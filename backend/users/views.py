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
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.http import HttpRequest
from django.db import transaction

from rest_framework import permissions, status
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

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_enrollment_user(request: HttpRequest):
    user_id = request.session.get("enrollment_user_id")
    if not user_id:
        return None
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


def _get_login_user(request: HttpRequest):
    user_id = request.session.get("login_user_id")
    if not user_id:
        return None
    User = get_user_model()
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
        code = (struct.unpack(">I", h[o: o + 4])[0] & 0x7FFFFFFF) % 1000000
        if f"{code:06d}" == token:
            return True
    return False


def _get_jwt_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)

    access_token = refresh.access_token
    access_token["username"] = user.username
    access_token["email"] = user.email
    access_token["is_superuser"] = user.is_superuser
    access_token["permissions"] = list(user.get_all_permissions())

    return {
        "refresh": str(refresh),
        "access": str(access_token),
    }

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
            return Response({"detail": "Token requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # Log seguro: NO expongas el token; si quieres, loguea un hash truncado
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        logger.debug(
            "[BACKEND] Hash del token recibido (prefix): %s", token_hash[:12])

        try:
            with transaction.atomic():
                enrollment = EnrollmentToken.objects.select_for_update().get(token_hash=token_hash)

                if enrollment.is_expired():
                    enrollment.delete()
                    return Response({"detail": "Token expirado"}, status=status.HTTP_400_BAD_REQUEST)

                # One-time: crea sesión y destruye el token
                request.session["enrollment_user_id"] = enrollment.user_id
                enrollment.delete()

        except EnrollmentToken.DoesNotExist:
            return Response({"detail": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Token válido"})


class PasskeyRegisterChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=400)

        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])
        rp_name = getattr(settings, "RP_NAME", "Luximia ERP")

        uv_mode = (UserVerificationRequirement.REQUIRED
                   if settings.PASSKEY_STRICT_UV
                   else UserVerificationRequirement.PREFERRED)


        attachment = (AuthenticatorAttachment.PLATFORM
                    if settings.PASSKEY_STRICT_UV
                    else None #AuthenticatorAttachment.CROSS_PLATFORM
                    )

        options = generate_registration_options(
            rp_id=rp_id,
            rp_name=rp_name,
            user_name=user.email,
            user_display_name=user.get_full_name() or user.email,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=uv_mode,
                authenticator_attachment=attachment,
                resident_key=ResidentKeyRequirement.REQUIRED,  # ← clave para passkeys
                # ← legacy flag, ayuda a algunos gestores
                require_resident_key=True,
            ),
            attestation=AttestationConveyancePreference.NONE,
        )

        request.session["passkey_challenge"] = bytes_to_base64url(
            options.challenge)
        return Response(json.loads(options_to_json(options)))

class PasskeyRegisterView(APIView):
    """Parsea JSON -> dataclass y verifica con challenge original (bytes)."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        challenge_b64url = request.session.get("passkey_challenge")
        if not challenge_b64url:
            return Response({"detail": "Desafío no encontrado en la sesión"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ convertir JSON del navegador a RegistrationCredential (dataclass)
            credential = parse_registration_credential_json(request.data)

            verification = verify_registration_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(challenge_b64url),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=getattr(
                    settings, "RP_ID", request.get_host().split(":")[0]),
                require_user_verification=settings.PASSKEY_STRICT_UV,  # <- clave
            )

            # fallback defensivo
            sign_count = getattr(verification, "sign_count", 0)


            new_credential = {
                "id": urlsafe_b64encode(verification.credential_id).decode("utf-8").rstrip("="),
                "public_key": urlsafe_b64encode(verification.credential_public_key).decode("utf-8").rstrip("="),
                "sign_count": int(sign_count) if sign_count is not None else 0,
            }

            creds = user.passkey_credentials or []
            creds.append(new_credential)
            user.passkey_credentials = creds
            user.save()

            request.session.pop("passkey_challenge", None)
            return Response({"detail": "Passkey registrada"})

        except InvalidRegistrationResponse as e:
            return Response({"detail": str(e)}, status=400)
        except Exception as e:
            logger.error("Error en el registro de Passkey: %s",
                         e, exc_info=True)
            return Response({"detail": "Fallo en el registro de la Passkey."}, status=400)


class TOTPSetupView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response({"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            return Response({"detail": "TOTP no configurado"}, status=status.HTTP_400_BAD_REQUEST)

        if not _verify_totp(secret, code):
            return Response({"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

        if user.passkey_credentials:
            user.is_active = True
        user.save()

        request.session.pop("enrollment_user_id", None)
        return Response({"detail": "TOTP verificado y usuario activado"})

# ---------------------------------------------------------------------------
# Vistas de Inicio de Sesión (Login)
# ---------------------------------------------------------------------------


class StartLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "Usuario no encontrado o inactivo"}, status=status.HTTP_404_NOT_FOUND)

        login_method = None
        if user.passkey_credentials:
            login_method = "passkey"
        elif user.totp_secret:
            login_method = "totp"

        if not login_method:
            return Response({"detail": "Ningún método de login configurado"}, status=status.HTTP_400_BAD_REQUEST)

        request.session["login_user_id"] = user.pk
        return Response({"login_method": login_method})


class PasskeyLoginChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        if not user:
            return Response({"detail": "Sesión de login no encontrada"}, status=400)

        if not user.passkey_credentials:
            return Response({"detail": "No hay passkeys registradas para este usuario"}, status=400)

        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])

        # ✅ No enviar allow_credentials → account discovery
        options = generate_authentication_options(
            rp_id=rp_id,
            allow_credentials=None,
            user_verification=(
                UserVerificationRequirement.REQUIRED
                if settings.PASSKEY_STRICT_UV else
                UserVerificationRequirement.PREFERRED
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
            return Response({"detail": "Sesión de login no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ convertir JSON del navegador a AuthenticationCredential (dataclass)
            credential = parse_authentication_credential_json(request.data)

            # localizar la cred del usuario
            user_credential = next(
                (c for c in (user.passkey_credentials or [])
                 if urlsafe_b64decode(c["id"] + "==") == credential.raw_id),
                None
            )
            if not user_credential:
                return Response({"detail": "Credencial desconocida"}, status=status.HTTP_400_BAD_REQUEST)

            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(challenge_b64url),
                expected_rp_id=getattr(
                    settings, "RP_ID", request.get_host().split(":")[0]),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                credential_public_key=urlsafe_b64decode(
                    user_credential["public_key"] + "=="),
                credential_current_sign_count=user_credential["sign_count"],
                require_user_verification=settings.PASSKEY_STRICT_UV,  # <- clave
            )

            user_credential["sign_count"] = verification.new_sign_count
            user.save()
            request.session.pop("login_user_id", None)
            request.session.pop("login_challenge", None)
            return Response(_get_jwt_for_user(user))
        except Exception as e:
            logger.error(
                "Error en la autenticación con Passkey: %s", e, exc_info=True)
            return Response({"detail": f"Fallo en la autenticación: {e}"}, status=status.HTTP_400_BAD_REQUEST)


class VerifyTOTPLoginView(APIView):
    """
    Verifica un código TOTP durante el LOGIN (no enrollment) y emite JWT.
    Requiere que StartLoginView haya guardado 'login_user_id' en sesión.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        if not user:
            return Response({"detail": "Sesión de login no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response({"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            return Response({"detail": "TOTP no configurado"}, status=status.HTTP_400_BAD_REQUEST)

        if not _verify_totp(secret, code):
            return Response({"detail": "Código inválido"}, status=status.HTTP_400_BAD_REQUEST)

        # OK: emitir JWT y limpiar sesión de login
        tokens = _get_jwt_for_user(user)
        request.session.pop("login_user_id", None)
        request.session.pop("login_challenge", None)  # por si venía de passkey
        return Response(tokens)

# ---------------------------------------------------------------------------
# Exportaciones
# ---------------------------------------------------------------------------


__all__ = [
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
