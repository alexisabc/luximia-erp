from django.contrib.auth import get_user_model
from rest_framework import permissions, status, decorators
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone
from django.core import signing
import uuid
import logging
import json
import hashlib
import time
import base64
import hmac
import struct
import os

# WebAuthn
from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    verify_registration_response,
    verify_authentication_response,
)
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
)
from webauthn.helpers.exceptions import InvalidRegistrationResponse

from users.models import EnrollmentToken
from users.services.rbac_service import RBACService
from users.auth_backends import RolePermissionBackend # Just to ensure load

logger = logging.getLogger(__name__)
User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

def _get_enrollment_user(request):
    user_id = request.session.get("enrollment_user_id")
    if not user_id: return None
    return User.objects.filter(id=user_id).first()

def _get_login_user(request):
    user_id = request.session.get("login_user_id")
    if not user_id: return None
    return User.objects.filter(id=user_id).first()

def _generate_totp_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode("utf-8")

def _verify_totp(secret: str, token: str, interval: int = 30, window: int = 1) -> bool:
    try:
        key = base64.b32decode(secret, True)
    except Exception: return False
    tm = int(time.time() // interval)
    for offset in range(-window, window + 1):
        msg = struct.pack(">Q", tm + offset)
        h = hmac.new(key, msg, hashlib.sha1).digest()
        o = h[19] & 15
        code = (struct.unpack(">I", h[o : o + 4])[0] & 0x7FFFFFFF) % 1000000
        if f"{code:06d}" == token: return True
    return False

def _get_jwt_for_user(user, request=None) -> dict:
    user.update_token_version()
    if request:
        user.current_session_device = request.META.get('HTTP_USER_AGENT', '')[:255]
    user.last_login = timezone.now()
    user.save()

    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    access_token["username"] = user.username
    access_token["email"] = user.email
    access_token["roles"] = RBACService.get_user_roles(user)
    access_token["token_version"] = str(user.token_version)
    if user.ultima_empresa_activa:
        access_token["ultima_empresa_activa"] = user.ultima_empresa_activa.id

    return {"refresh": str(refresh), "access": str(access_token)}

# Axes Helpers
from axes.handlers.proxy import AxesProxyHandler
from axes.utils import reset as axes_reset
from django.contrib.auth.signals import user_login_failed

def _check_axes_lockout(request, credentials):
    if AxesProxyHandler.is_locked(request, credentials):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Cuenta bloqueada temporalmente.")

def _log_axes_failure(request, credentials):
    user_login_failed.send(sender=__name__, credentials=credentials, request=request)

# ---------------------------------------------------------------------------
# LOGIN VIEWS
# ---------------------------------------------------------------------------

class StartLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = 'login_start'

    def post(self, request):
        identifier = request.data.get("email")
        if not identifier: return Response({"detail": "Email requerido"}, status=400)
        identifier = identifier.lower().strip()
        
        creds = {"username": identifier, "ip_address": get_client_ip(request)}
        _check_axes_lockout(request, creds)

        user = User.objects.filter(models.Q(email=identifier) | models.Q(username=identifier), is_active=True).first()
        if not user: return Response({"detail": "No encontrado"}, status=404)

        methods = []
        if user.passkey_credentials: methods.append("passkey")
        if user.totp_secret: methods.append("totp")
        
        if not methods: return Response({"detail": "Sin seguridad"}, status=400)

        request.session["login_user_id"] = user.pk
        request.session.set_expiry(300)
        return Response({"available_methods": methods})

class PasskeyLoginChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        user = _get_login_user(request)
        if not user: return Response({"detail": "Sesión inválida"}, status=400)
        
        _check_axes_lockout(request, {"username": user.email, "ip_address": get_client_ip(request)})

        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])
        options = generate_authentication_options(
            rp_id=rp_id,
            user_verification=UserVerificationRequirement.REQUIRED if settings.PASSKEY_STRICT_UV else UserVerificationRequirement.PREFERRED
        )
        request.session["login_challenge"] = bytes_to_base64url(options.challenge)
        return Response(json.loads(options_to_json(options)))

class PasskeyLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = _get_login_user(request)
        challenge = request.session.get("login_challenge")
        if not user or not challenge: return Response({"detail": "Sesión inválida"}, status=400)

        creds = {"username": user.email, "ip_address": get_client_ip(request)}
        try:
            credential = parse_authentication_credential_json(request.data)
            user_cred = next((c for c in (user.passkey_credentials or []) if base64.urlsafe_b64decode(c["id"] + "==") == credential.raw_id), None)
            
            if not user_cred:
                _log_axes_failure(request, creds)
                return Response({"detail": "Credencial inválida"}, status=400)

            verify_authentication_response(
                credential=credential,
                expected_challenge=base64url_to_bytes(challenge),
                expected_rp_id=getattr(settings, "RP_ID", request.get_host().split(":")[0]),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                credential_public_key=base64.urlsafe_b64decode(user_cred["public_key"] + "=="),
                credential_current_sign_count=user_cred["sign_count"],
                require_user_verification=settings.PASSKEY_STRICT_UV
            )
            
            request.session.flush()
            axes_reset(ip=creds["ip_address"], username=creds["username"])
            return Response(_get_jwt_for_user(user, request))
        except Exception as e:
            _log_axes_failure(request, creds)
            return Response({"detail": "Fallo auth"}, status=400)

class VerifyTOTPLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = _get_login_user(request)
        if not user: return Response({"detail": "Sesión inválida"}, status=400)
        
        creds = {"username": user.email, "ip_address": get_client_ip(request)}
        _check_axes_lockout(request, creds)

        code = request.data.get("code")
        if not code or len(code) != 6: return Response({"detail": "Formato inválido"}, status=400)

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
            if not _verify_totp(secret, code):
                _log_axes_failure(request, creds)
                return Response({"detail": "Código incorrecto"}, status=400)
            
            tokens = _get_jwt_for_user(user, request)
            request.session.flush()
            axes_reset(ip=creds["ip_address"], username=creds["username"])
            return Response(tokens)
        except Exception: return Response({"detail": "Error TOTP"}, status=400)

# ---------------------------------------------------------------------------
# ENROLLMENT VIEWS
# ---------------------------------------------------------------------------

class EnrollmentValidationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        if request.session.get("enrollment_user_id"): return Response({"detail": "Activa"})
        token = request.data.get("token")
        if not token: return Response({"detail": "Falta token"}, status=400)
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        try:
            with transaction.atomic():
                enroll = EnrollmentToken.objects.select_for_update().get(token_hash=token_hash)
                if enroll.is_expired():
                    enroll.delete()
                    return Response({"detail": "Expirado"}, status=400)
                request.session["enrollment_user_id"] = enroll.user_id
                enroll.delete()
                return Response({"detail": "OK"})
        except EnrollmentToken.DoesNotExist:
            return Response({"detail": "Inválido"}, status=400)

class PasskeyRegisterChallengeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        user = _get_enrollment_user(request)
        if not user: return Response({"detail": "Sin sesión"}, status=400)
        
        rp_id = getattr(settings, "RP_ID", request.get_host().split(":")[0])
        options = generate_registration_options(
            rp_id=rp_id, rp_name=getattr(settings, "RP_NAME", "ERP"),
            user_id=str(user.id).encode("utf-8"), user_name=user.email,
            user_display_name=user.get_full_name() or user.email,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.REQUIRED if settings.PASSKEY_STRICT_UV else UserVerificationRequirement.PREFERRED,
                resident_key=ResidentKeyRequirement.REQUIRED, require_resident_key=True
            )
        )
        request.session["passkey_challenge"] = bytes_to_base64url(options.challenge)
        return Response(json.loads(options_to_json(options)))

class PasskeyRegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = _get_enrollment_user(request)
        challenge = request.session.get("passkey_challenge")
        if not user or not challenge: return Response({"detail": "Inválido"}, status=400)

        try:
            credential = parse_registration_credential_json(request.data)
            verification = verify_registration_response(
                credential=credential, expected_challenge=base64url_to_bytes(challenge),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=getattr(settings, "RP_ID", request.get_host().split(":")[0]),
                require_user_verification=settings.PASSKEY_STRICT_UV
            )
            creds = user.passkey_credentials or []
            creds.append({
                "id": base64.urlsafe_b64encode(verification.credential_id).decode("utf-8").rstrip("="),
                "public_key": base64.urlsafe_b64encode(verification.credential_public_key).decode("utf-8").rstrip("="),
                "sign_count": int(verification.sign_count or 0)
            })
            user.passkey_credentials = creds
            user.is_active = True
            user.save()
            request.session.pop("passkey_challenge", None)
            return Response({"detail": "Passkey registrada"})
        except Exception as e: return Response({"detail": str(e)}, status=400)

class TOTPSetupView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = _get_enrollment_user(request)
        if not user: return Response({"detail": "Inválido"}, status=400)
        secret = _generate_totp_secret()
        user.totp_secret = signing.dumps(secret, salt="totp")
        user.save()
        issuer = getattr(settings, "TOTP_ISSUER", "ERP")
        return Response({"otpauth_uri": f"otpauth://totp/{issuer}:{user.email}?secret={secret}&issuer={issuer}&digits=6"})

class TOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = _get_enrollment_user(request)
        code = request.data.get("code")
        if not user or not code: return Response({"detail": "Inválido"}, status=400)
        try:
            secret = signing.loads(user.totp_secret, salt="totp")
            if not _verify_totp(secret, code): return Response({"detail": "Incorrecto"}, status=400)
            user.is_active = True
            user.save()
            request.session.pop("enrollment_user_id", None)
            return Response({"detail": "Activado"})
        except Exception: return Response({"detail": "Error"}, status=400)

# ---------------------------------------------------------------------------
# MANAGEMENT VIEWS (RESET, etc)
# ---------------------------------------------------------------------------

class TOTPResetView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        secret = _generate_totp_secret()
        request.user.totp_secret = signing.dumps(secret, salt="totp")
        request.user.save()
        issuer = getattr(settings, "TOTP_ISSUER", "ERP")
        return Response({"otpauth_uri": f"otpauth://totp/{issuer}:{request.user.email}?secret={secret}&issuer={issuer}&digits=6"})

class TOTPResetVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        code = request.data.get("code")
        try:
            secret = signing.loads(request.user.totp_secret, salt="totp")
            if not _verify_totp(secret, code): return Response({"detail": "Incorrecto"}, status=400)
            return Response({"detail": "OK"})
        except Exception: return Response({"detail": "Error"}, status=400)

class ResetUserSessionView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.update_token_version()
        return Response({"detail": "Sesión reseteada"})
