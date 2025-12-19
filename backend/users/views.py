# backend/users/views.py
from __future__ import annotations

import base64
from base64 import urlsafe_b64decode, urlsafe_b64encode
import hashlib
import hmac
import json
import os
import struct
import time
import logging
import secrets
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core import signing
from django.http import HttpRequest, Http404
from django.db import transaction
from config.emails import send_mail
from datetime import timedelta
from django.utils import timezone
from django.template.loader import render_to_string

from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# WebAuthn core
from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    verify_registration_response,
    verify_authentication_response,
)

# Helpers/parsers oficiales (evitan dicts "crudos")
from webauthn.helpers import (
    options_to_json,
    bytes_to_base64url,
    base64url_to_bytes,
    parse_registration_credential_json,
    parse_authentication_credential_json,
)

from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    AttestationConveyancePreference,
    AuthenticatorAttachment,
    ResidentKeyRequirement,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialType,
)

from webauthn.helpers.exceptions import InvalidRegistrationResponse

from .models import EnrollmentToken
from .serializers import UserSerializer, GroupSerializer, PermissionSerializer
from .utils import build_enrollment_email_context

logger = logging.getLogger(__name__)


class IsStaffOrSuperuser(permissions.BasePermission):
    """Permite acceso a usuarios con is_staff o is_superuser."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and (user.is_staff or user.is_superuser))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
User = get_user_model()


def _get_enrollment_user(request: HttpRequest):
    user_id = request.session.get("enrollment_user_id")
    if not user_id:
        return None

    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


def _get_login_user(request: HttpRequest):
    user_id = request.session.get("login_user_id")
    if not user_id:
        return None

    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


def _generate_totp_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode("utf-8")


def _verify_totp(secret: str, token: str, interval: int = 30, window: int = 1) -> bool:
    try:
        key = base64.b32decode(secret, True)
    except Exception:
        return False

    tm = int(time.time() // interval)
    for offset in range(-window, window + 1):
        msg = struct.pack(">Q", tm + offset)
        h = hmac.new(key, msg, hashlib.sha1).digest()
        o = h[19] & 15
        code = (struct.unpack(">I", h[o : o + 4])[0] & 0x7FFFFFFF) % 1000000
        if f"{code:06d}" == token:
            return True
    return False


def _get_jwt_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    access_token["username"] = user.username
    access_token["email"] = user.email
    access_token["first_name"] = user.first_name
    access_token["last_name"] = user.last_name
    access_token["is_superuser"] = user.is_superuser
    access_token["permissions"] = list(user.get_all_permissions())
    access_token["ultima_empresa_activa"] = user.ultima_empresa_activa.id if user.ultima_empresa_activa else None
    return {
        "refresh": str(refresh),
        "access": str(access_token),
    }


# ---------------------------------------------------------------------------
# Vistas de usuarios
# ---------------------------------------------------------------------------
class InviteUserView(APIView):
    permission_classes = [IsStaffOrSuperuser]

    def _send_invite(self, user):
        """Función interna para generar y enviar el token de invitación."""
        EnrollmentToken.objects.filter(user=user).delete()
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(hours=24)
        EnrollmentToken.objects.create(
            user=user, token_hash=token_hash, expires_at=expires_at
        )

        domain = settings.FRONTEND_DOMAIN
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{token}"

        context = build_enrollment_email_context(
            enroll_url,
            user=user,
            extra_context={
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        )
        plain_message = render_to_string(
            "users/welcome_invitation.txt", context
        )
        html_message = render_to_string(
            "users/enrollment_email.html", context
        )
        send_mail(
            "Invitación a Luximia ERP",
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message,
        )

    def post(self, request, pk=None):
        # Si se recibe un PK, es para reenviar una invitación
        if pk:
            try:
                user = User.objects.get(pk=pk, is_active=False)
            except User.DoesNotExist:
                return Response(
                    {"detail": "Usuario no encontrado o ya activo"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            self._send_invite(user)
            return Response(
                {"detail": "Invitación reenviada con éxito"}, status=status.HTTP_200_OK
            )

        # Si no se recibe un PK, es para crear un usuario nuevo
        email = request.data.get("email")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        groups_ids = request.data.get("groups", [])

        if not email:
            return Response(
                {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email=email, defaults={"username": email, "is_active": False}
                )
                
                # Actualizar datos personales y roles si se proporcionan
                user.first_name = first_name
                user.last_name = last_name
                user.save()

                if groups_ids:
                    user.groups.set(groups_ids)

                self._send_invite(user)

            return Response(
                {"detail": "Invitation sent successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserListView(generics.ListAPIView):
    """Lista de usuarios. Permite filtrar por estado activo/inactivo."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    queryset = User.objects.all().order_by("id")  # Required for DjangoModelPermissions

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filtrado por estado activo
        is_active_param = self.request.query_params.get("is_active")

        if is_active_param is not None:
            is_active = is_active_param.lower() in ["true", "1"]
            
            # Si quiere ver inactivos, verificar permiso
            if not is_active:
                if not user.has_perm("users.view_inactive_users") and not user.is_superuser:
                    # Si no tiene permiso, forzamos a ver solo activos o devolvemos vacio? 
                    # El requerimiento dice: "Si no tiene permiso... marke error". 
                    # Pero en un listado, usualmente se filtran.
                    # Vamos a filtrar para mostrar solo lo que puede ver (activos).
                    return queryset.none()
            
            queryset = queryset.filter(is_active=is_active)
        else:
             # Por defecto mostrar solo activos si no especifica? 
             # O mostrar todos?
             # Usualmente 'users' endpoint muestra todo. 
             # Si el usuario no tiene permiso `view_inactive_users`, ocultamos inactivos.
             if not user.has_perm("users.view_inactive_users") and not user.is_superuser:
                 queryset = queryset.filter(is_active=True)

        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Gestiona operaciones de obtención, actualización y soft delete de un usuario.
    El método DELETE realiza una 'desactivación' (soft delete).
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

    def perform_destroy(self, instance):
        """Realiza el soft delete en lugar del borrado permanente."""
        # Check standard delete permission handled by DjangoModelPermissions? 
        # Yes, checks 'users.delete_customuser'.
        instance.is_active = False
        instance.save()


class HardDeleteUserView(APIView):
    """
    Elimina un usuario de forma permanente.
    Requiere el permiso 'users.hard_delete_customuser'.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, format=None):
        if not request.user.has_perm("users.hard_delete_customuser") and not request.user.is_superuser:
             return Response(
                {"detail": "No tienes permisos para eliminar permanentemente."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            raise Http404


# ---------------------------------------------------------------------------
# Vistas de Grupos y Permisos
# ---------------------------------------------------------------------------


class GroupListView(generics.ListCreateAPIView):
    """Lista todos los grupos (roles) y permite crear uno nuevo."""

    # Agrega .order_by('name') o .order_by('id') al queryset
    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [IsStaffOrSuperuser]
    # La lista de roles es corta, se devuelve completa sin paginación
    pagination_class = None


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Recupera, actualiza y elimina un grupo específico."""

    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsStaffOrSuperuser]


class PermissionListView(generics.ListAPIView):
    """Lista todos los permisos disponibles."""

    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsStaffOrSuperuser]
    # Se necesita la lista completa de permisos para construir formularios
    pagination_class = None


# ---------------------------------------------------------------------------
# Vistas de Inscripción (Enrollment)
# ---------------------------------------------------------------------------


class EnrollmentValidationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        # ✅ Si la sesión de inscripción ya existe, no vuelvas a validar el token
        if request.session.get("enrollment_user_id"):
            return Response({"detail": "Sesión de inscripción activa"})

        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Token requerido"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Log seguro: NO expongas el token; si quieres, loguea un hash truncado
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        logger.debug("[BACKEND] Hash del token recibido (prefix): %s", token_hash[:12])

        try:
            with transaction.atomic():
                enrollment = EnrollmentToken.objects.select_for_update().get(
                    token_hash=token_hash
                )

                if enrollment.is_expired():
                    enrollment.delete()
                    return Response(
                        {"detail": "Token expirado"}, status=status.HTTP_400_BAD_REQUEST
                    )

                # One-time: crea sesión y destruye el token
                request.session["enrollment_user_id"] = enrollment.user_id
                enrollment.delete()

        except EnrollmentToken.DoesNotExist:
            return Response(
                {"detail": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"detail": "Token válido"})


class PasskeyRegisterChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response(
                {"detail": "Sesión de inscripción no encontrada"}, status=400
            )

        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])
        rp_name = getattr(settings, "RP_NAME", "Luximia ERP")

        uv_mode = (
            UserVerificationRequirement.REQUIRED
            if settings.PASSKEY_STRICT_UV
            else UserVerificationRequirement.PREFERRED
        )

        attachment = (
            AuthenticatorAttachment.PLATFORM
            if settings.PASSKEY_STRICT_UV
            else None
        )

        options = generate_registration_options(
            rp_id=rp_id,
            rp_name=rp_name,
            # ✨ CAMBIO CLAVE: Añadimos el user_id, que es obligatorio.
            # Lo convertimos a string y luego a bytes, un formato estable y seguro.
            user_id=str(user.id).encode("utf-8"),
            user_name=user.email,
            user_display_name=user.get_full_name() or user.email,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=uv_mode,
                authenticator_attachment=attachment,
                resident_key=ResidentKeyRequirement.REQUIRED,
                require_resident_key=True,
            ),
            attestation=AttestationConveyancePreference.NONE,
        )

        request.session["passkey_challenge"] = bytes_to_base64url(options.challenge)
        return Response(json.loads(options_to_json(options)))


class PasskeyRegisterView(APIView):
    """Parsea JSON -> dataclass y verifica con challenge original (bytes)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response(
                {"detail": "Sesión de inscripción no encontrada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge_b64url = request.session.get("passkey_challenge")
        if not challenge_b64url:
            return Response(
                {"detail": "Desafío no encontrado en la sesión"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # ✅ convertir JSON del navegador a RegistrationCredential (dataclass)
            credential = parse_registration_credential_json(request.data)

            verification = verify_registration_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(challenge_b64url),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=getattr(
                    settings, "RP_ID", request.get_host().split(":")[0]
                ),
                require_user_verification=settings.PASSKEY_STRICT_UV,  # <- clave
            )

            # fallback defensivo
            sign_count = getattr(verification, "sign_count", 0)

            new_credential = {
                "id": urlsafe_b64encode(verification.credential_id)
                .decode("utf-8")
                .rstrip("="),
                "public_key": urlsafe_b64encode(verification.credential_public_key)
                .decode("utf-8")
                .rstrip("="),
                "sign_count": int(sign_count) if sign_count is not None else 0,
            }

            creds = user.passkey_credentials or []
            creds.append(new_credential)
            user.passkey_credentials = creds
            user.is_active = True
            user.save()

            request.session.pop("passkey_challenge", None)
            return Response({"detail": "Passkey registrada"})

        except InvalidRegistrationResponse as e:
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            logger.error("Error en el registro de Passkey: %s", e, exc_info=True)
            return Response(
                {"detail": "Fallo en el registro de la Passkey."}, status=400
            )


class TOTPSetupView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response(
                {"detail": "Sesión de inscripción no encontrada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = _generate_totp_secret()
        user.totp_secret = signing.dumps(secret, salt="totp")
        user.save()

        issuer = getattr(settings, "TOTP_ISSUER", "Luximia ERP")
        label = f"{issuer}:{user.email}"
        otpauth_uri = f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&digits=6"
        return Response({"otpauth_uri": otpauth_uri})


class TOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response(
                {"detail": "Sesión de inscripción no encontrada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response(
                {"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            return Response(
                {"detail": "TOTP no configurado"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not _verify_totp(secret, code):
            return Response(
                {"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = True
        user.save()

        request.session.pop("enrollment_user_id", None)
        return Response({"detail": "TOTP verificado y usuario activado"})


class PasskeyCredentialView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: HttpRequest) -> Response:
        creds = request.user.passkey_credentials or []
        return Response({"credentials": creds})


class PasskeyResetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: HttpRequest) -> Response:
        request.user.passkey_credentials = []
        request.user.passkey_provider = None
        request.user.save()
        return Response({"detail": "Passkeys reiniciadas"})


class TOTPResetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: HttpRequest) -> Response:
        secret = _generate_totp_secret()
        request.user.totp_secret = signing.dumps(secret, salt="totp")
        request.user.save()

        issuer = getattr(settings, "TOTP_ISSUER", "Luximia ERP")
        label = f"{issuer}:{request.user.email}"
        otpauth_uri = f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&digits=6"
        return Response({"otpauth_uri": otpauth_uri})


class TOTPResetVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: HttpRequest) -> Response:
        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response(
                {"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            secret = signing.loads(request.user.totp_secret, salt="totp")
        except Exception:
            return Response(
                {"detail": "TOTP no configurado"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not _verify_totp(secret, code):
            return Response(
                {"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST
            )
        request.user.save()
        return Response({"detail": "TOTP verificado"})


# ---------------------------------------------------------------------------
# Vistas de Inicio de Sesión (Login)
# ---------------------------------------------------------------------------

# from axes.helpers import get_client_ip # Removed in axes 6.x

def get_client_ip(request):
    """
    Recupera la IP del cliente del request, considerando cabeceras de proxy.
    Implementación local para reemplazar axes.helpers.get_client_ip
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

from axes.handlers.proxy import AxesProxyHandler
from axes.utils import reset as axes_reset
from django.contrib.auth.signals import user_login_failed


def _check_axes_lockout(request, credentials):
    """Verifica si el usuario/IP está bloqueado por Axes."""
    if AxesProxyHandler.is_locked(request, credentials):
        raise permissions.exceptions.PermissionDenied(
            "Cuenta bloqueada temporalmente por múltiples intentos fallidos."
        )


def _log_axes_failure(request, credentials):
    """Registra un intento fallido en Axes."""
    user_login_failed.send(
        sender=__name__,
        credentials=credentials,
        request=request,
    )


from django.db.models import Q

class StartLoginView(APIView):
    """
    Paso 1 del Login: Identificación.
    Verifica si el usuario existe y qué métodos tiene configurados.
    Protegido contra enumeración masiva mediante Throttling estricto.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    # Throttling estricto para evitar enumeración masiva
    throttle_scope = 'login_start' 

    def post(self, request: HttpRequest) -> Response:
        identifier = request.data.get("email")
        if not identifier:
            return Response(
                {"detail": "Email o Username requerido"}, status=status.HTTP_400_BAD_REQUEST
            )
        
        # Normalizar identifier (si es email)
        identifier = identifier.lower().strip()

        # Verificar bloqueo preventivo de Axes antes de consultar DB
        # Usamos el identifier como username para Axes
        credentials = {"username": identifier, "ip_address": get_client_ip(request)}
        _check_axes_lockout(request, credentials)

        try:
            # Buscar por email O username (mantiene acceso si cambia email)
            user = User.objects.get(Q(email=identifier) | Q(username=identifier), is_active=True)
            
            # TODO: Considerar si hay múltiples matches (improbable si emails son únicos)
            # User.objects.get lanzará MultipleObjectsReturned, lo cual es manejado como 500 por defecto,
            # o podríamos capturarlo. Dado que username se inicializa con email, es posible overlap,
            # pero get() retornará el único usuario si es el mismo objeto.
            
        except User.DoesNotExist:
            # Para evitar enumeración, podríamos retornar 200 con métodos vacíos,
            # pero la UX requiere saber si mostrar métodos.
            # Mitigamos con RateLimit (Throttle) y Axes (si decidimos loguear intentos de usuarios inexistentes).
            # Por ahora, retornamos 404 para que el frontend sepa.
            return Response(
                {"detail": "Usuario no encontrado o inactivo"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Crear una lista de métodos de login disponibles
        available_methods = []
        if user.passkey_credentials:
            available_methods.append("passkey")
        if user.totp_secret:
            available_methods.append("totp")

        if not available_methods:
            return Response(
                {"detail": "Ningún método de login configurado para este usuario."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Iniciar sesión temporal de login
        request.session["login_user_id"] = user.pk
        request.session.set_expiry(300) # Expira en 5 minutos por seguridad
        return Response(
            {"available_methods": available_methods}
        )


class PasskeyLoginChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        if not user:
            return Response({"detail": "Sesión de login expirada o inválida"}, status=400)

        # Verificación de bloqueo Axes
        credentials = {"username": user.email, "ip_address": get_client_ip(request)}
        _check_axes_lockout(request, credentials)

        if not user.passkey_credentials:
            return Response(
                {"detail": "No hay passkeys registradas para este usuario"}, status=400
            )

        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])

        options = generate_authentication_options(
            rp_id=rp_id,
            allow_credentials=None, # Allow any credential from this RP (Discoverable)
            user_verification=(
                UserVerificationRequirement.REQUIRED
                if settings.PASSKEY_STRICT_UV
                else UserVerificationRequirement.PREFERRED
            ),
        )

        request.session["login_challenge"] = bytes_to_base64url(options.challenge)
        return Response(json.loads(options_to_json(options)))


class PasskeyLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        challenge_b64url = request.session.get("login_challenge")
        
        if not user or not challenge_b64url:
            return Response(
                {"detail": "Sesión de login expirada o inválida"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Puntos de control para Axes
        credentials = {"username": user.email, "ip_address": get_client_ip(request)}
        
        try:
            # 1. Parsear credencia
            credential = parse_authentication_credential_json(request.data)

            # 2. Localizar credencial del usuario
            user_credential = next(
                (
                    c
                    for c in (user.passkey_credentials or [])
                    if urlsafe_b64decode(c["id"] + "==") == credential.raw_id
                ),
                None,
            )
            
            if not user_credential:
                _log_axes_failure(request, credentials)
                return Response(
                    {"detail": "Credencial desconocida o no asociada a este usuario"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 3. Verificar firma
            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(challenge_b64url),
                expected_rp_id=getattr(
                    settings, "RP_ID", request.get_host().split(":")[0]
                ),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                credential_public_key=urlsafe_b64decode(
                    user_credential["public_key"] + "=="
                ),
                credential_current_sign_count=user_credential["sign_count"],
                require_user_verification=settings.PASSKEY_STRICT_UV,
            )

            # 4. Actualizar contador de firmas (Clone detection)
            user_credential["sign_count"] = verification.new_sign_count
            user.save()
            
            # Limpiar sesión
            request.session.flush() # Limpia todo por seguridad y regenera session_key
            
            # Axes: resetear fallos previos al tener éxito
            # Axes: resetear fallos previos al tener éxito
            axes_reset(ip=credentials["ip_address"], username=credentials["username"])

            return Response(_get_jwt_for_user(user))

        except Exception as e:
            logger.error("Error en autenticación Passkey: %s", e, exc_info=True)
            _log_axes_failure(request, credentials)
            return Response(
                {"detail": "Fallo en la autenticación. Intente nuevamente."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class VerifyTOTPLoginView(APIView):
    """
    Verifica un código TOTP durante el LOGIN (no enrollment) y emite JWT.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        if not user:
            return Response(
                {"detail": "Sesión de login expirada o inválida"},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        credentials = {"username": user.email, "ip_address": get_client_ip(request)}
        _check_axes_lockout(request, credentials)

        code = request.data.get("code")
        if not code or len(code) != 6:
            # No registramos fallo en Axes por formato inválido trivial, 
            # pero sí validamos input.
            return Response(
                {"detail": "Formato de código inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            # Estado inconsistente, el usuario no debería ver opción TOTP si no tiene secret
            return Response(
                {"detail": "TOTP no configurado correctamente"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not _verify_totp(secret, code):
            _log_axes_failure(request, credentials)
            return Response(
                {"detail": "Código incorrecto"}, status=status.HTTP_400_BAD_REQUEST
            )

        # OK: emitir JWT y limpiar sesión
        tokens = _get_jwt_for_user(user)
        
        request.session.flush() # Limpia datos temporales y regenera ID de sesión
        
        # Resetear contadores de Axes
        # Resetear contadores de Axes
        axes_reset(ip=credentials["ip_address"], username=credentials["username"])
        
        return Response(tokens)


# ---------------------------------------------------------------------------
# Exportaciones
# ---------------------------------------------------------------------------


__all__ = [
    "InviteUserView",
    "UserListView",
    "UserDetailView",
    "HardDeleteUserView",
    "GroupListView",
    "GroupDetailView",
    "PermissionListView",
    "EnrollmentValidationView",
    "PasskeyRegisterChallengeView",
    "PasskeyRegisterView",
    "TOTPSetupView",
    "TOTPVerifyView",
    "StartLoginView",
    "PasskeyLoginChallengeView",
    "PasskeyLoginView",
    "VerifyTOTPLoginView",
]
