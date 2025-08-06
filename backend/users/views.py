# backend/users/views.py

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import struct
import time
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.http import HttpRequest
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Asegúrate de tener 'webauthn' en tu requirements.txt
from webauthn import verify_authentication_response, verify_registration_response
from webauthn.helpers import base64url_to_bytes
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticationCredential,
)

from .models import EnrollmentToken

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_enrollment_user(request: HttpRequest):
    """Obtiene al usuario de la sesión de inscripción (enrollment)."""
    user_id = request.session.get("enrollment_user_id")
    if not user_id:
        return None
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

def _get_login_user(request: HttpRequest):
    """Obtiene al usuario de la sesión de inicio de sesión (login)."""
    user_id = request.session.get("login_user_id")
    if not user_id:
        return None
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

def _generate_totp_secret() -> str:
    """Genera un secreto TOTP codificado en base32."""
    return base64.b32encode(os.urandom(20)).decode("utf-8")

def _verify_totp(secret: str, token: str, interval: int = 30, window: int = 1) -> bool:
    """Verifica un código TOTP de 6 dígitos."""
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
    """Genera tokens JWT para un usuario."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}

# ---------------------------------------------------------------------------
# Vistas de Inscripción (Enrollment)
# ---------------------------------------------------------------------------

class EnrollmentValidationView(APIView):
    """Valida el token de inscripción e inicia una sesión."""
    permission_classes = [permissions.AllowAny]
    def post(self, request: HttpRequest) -> Response:
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token requerido"}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        try:
            enrollment = EnrollmentToken.objects.get(token_hash=token_hash)
        except EnrollmentToken.DoesNotExist:
            return Response({"detail": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)

        if enrollment.is_expired():
            return Response({"detail": "Token expirado"}, status=status.HTTP_400_BAD_REQUEST)

        request.session["enrollment_user_id"] = enrollment.user_id
        return Response({"detail": "Token válido"})

class PasskeyRegisterChallengeView(APIView):
    """Genera un desafío para registrar una nueva passkey."""
    permission_classes = [permissions.AllowAny]
    def get(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")
        request.session["passkey_challenge"] = challenge

        user_id_b64 = base64.urlsafe_b64encode(str(user.pk).encode()).decode().rstrip("=")
        rp_name = getattr(settings, "RP_NAME", "Luximia ERP")
        rp_id = getattr(settings, "RP_ID", request.get_host())

        data: dict[str, Any] = {
            "challenge": challenge,
            "rp": {"name": rp_name, "id": rp_id},
            "user": {
                "id": user_id_b64,
                "name": user.email,
                "displayName": user.get_full_name() or user.email,
            },
            "pubKeyCredParams": [{"type": "public-key", "alg": -7}], # ES256
            "authenticatorSelection": {"userVerification": "required"},
            "timeout": 60000,
            "attestation": "direct",
        }
        return Response(data)

class PasskeyRegisterView(APIView):
    """Verifica la respuesta del navegador y guarda la nueva passkey."""
    permission_classes = [permissions.AllowAny]
    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
        
        challenge = request.session.get("passkey_challenge")
        if not challenge:
            return Response({"detail": "Desafío no encontrado en la sesión"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            credential = RegistrationCredential.parse_raw(json.dumps(request.data))
            verification = verify_registration_response(
                credential=credential,
                expected_challenge=challenge.encode(),
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=settings.RP_ID,
                require_user_verification=True,
            )
            
            new_credential = {
                "id": base64.urlsafe_b64encode(verification.credential_id).decode('utf-8').rstrip("="),
                "public_key": base64.urlsafe_b64encode(verification.credential_public_key).decode('utf-8').rstrip("="),
                "sign_count": verification.sign_count,
            }
            
            creds = user.passkey_credentials or []
            creds.append(new_credential)
            user.passkey_credentials = creds
            user.save()

            request.session.pop("passkey_challenge", None)
            return Response({"detail": "Passkey registrada"})
            
        except Exception as e:
            return Response({"detail": f"Fallo en el registro de la Passkey: {e}"}, status=status.HTTP_400_BAD_REQUEST)

class TOTPSetupView(APIView):
    """Genera un secreto TOTP y devuelve una URI para el QR."""
    permission_classes = [permissions.AllowAny]
    def post(self, request: HttpRequest) -> Response:
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Sesión de inscripción no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        secret = _generate_totp_secret()
        user.totp_secret = signing.dumps(secret, salt="totp")
        user.save()

        issuer = getattr(settings, "TOTP_ISSUER", "Luximia ERP")
        label = f"{issuer}:{user.email}"
        otpauth_uri = (f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&digits=6")
        return Response({"otpauth_uri": otpauth_uri})

class TOTPVerifyView(APIView):
    """Verifica un código TOTP durante la inscripción y activa al usuario."""
    permission_classes = [permissions.AllowAny]
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
    """Inicia el flujo de login para un usuario existente."""
    permission_classes = [permissions.AllowAny]
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
    """Genera un desafío para autenticar con una passkey existente."""
    permission_classes = [permissions.AllowAny]
    def get(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        if not user:
            return Response({"detail": "Sesión de login no encontrada"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.passkey_credentials:
            return Response({"detail": "No hay passkeys registradas para este usuario"}, status=status.HTTP_400_BAD_REQUEST)

        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")
        request.session["login_challenge"] = challenge

        data: dict[str, Any] = {
            "challenge": challenge,
            "allowCredentials": [{"type": "public-key", "id": cred.get("id")} for cred in user.passkey_credentials],
            "timeout": 60000,
            "userVerification": "required",
            "rpId": getattr(settings, "RP_ID", request.get_host()),
        }
        return Response(data)

class PasskeyLoginView(APIView):
    """Verifica la respuesta de la passkey y emite tokens JWT."""
    permission_classes = [permissions.AllowAny]
    def post(self, request: HttpRequest) -> Response:
        user = _get_login_user(request)
        challenge = request.session.get("login_challenge")
        if not user or not challenge:
            return Response({"detail": "Sesión de login no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            credential_data = request.data
            credential = AuthenticationCredential.parse_raw(json.dumps(credential_data))
            
            user_credential = None
            for cred in user.passkey_credentials:
                if base64url_to_bytes(cred["id"]) == credential.raw_id:
                    user_credential = cred
                    break

            if not user_credential:
                return Response({"detail": "Credencial desconocida"}, status=status.HTTP_400_BAD_REQUEST)

            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=challenge.encode(),
                expected_rp_id=settings.RP_ID,
                expected_origin=settings.WEBAUTHN_ORIGIN,
                credential_public_key=base64.urlsafe_b64decode(user_credential["public_key"] + "=="),
                credential_current_sign_count=user_credential["sign_count"],
                require_user_verification=True,
            )

            # Actualizar el contador de firmas para prevenir ataques de repetición
            user_credential["sign_count"] = verification.new_sign_count
            user.save()

            # Limpiar la sesión
            request.session.pop("login_user_id", None)
            request.session.pop("login_challenge", None)

            return Response(_get_jwt_for_user(user))

        except Exception as e:
            return Response({"detail": f"Fallo en la autenticación: {e}"}, status=status.HTTP_400_BAD_REQUEST)

class VerifyTOTPLoginView(APIView):
    """Verifica un código TOTP para login y emite tokens JWT."""
    permission_classes = [permissions.AllowAny]
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
        
        request.session.pop("login_user_id", None)
        return Response(_get_jwt_for_user(user))

# ---------------------------------------------------------------------------
# Exportaciones
# ---------------------------------------------------------------------------

__all__ = [
    # Vistas de Inscripción
    "EnrollmentValidationView",
    "PasskeyRegisterChallengeView",
    "PasskeyRegisterView",
    "TOTPSetupView",
    "TOTPVerifyView",
    # Vistas de Inicio de Sesión
    "StartLoginView",
    "PasskeyLoginChallengeView",
    "PasskeyLoginView",
    "VerifyTOTPLoginView",
]