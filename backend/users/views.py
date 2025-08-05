"""Views for passwordless enrollment flow."""

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

from webauthn import verify_authentication_response
from webauthn.helpers import base64url_to_bytes
from webauthn.helpers.structs import (
    AuthenticationCredential,
    AuthenticatorAssertionResponse,
)

from .models import EnrollmentToken


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_enrollment_user(request: HttpRequest):
    """Retrieve the user stored in the enrollment session."""

    user_id = request.session.get("enrollment_user_id")
    if not user_id:
        return None
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:  # pragma: no cover - defensive
        return None


def _generate_totp_secret() -> str:
    """Generate a base32 encoded TOTP secret."""

    return base64.b32encode(os.urandom(20)).decode("utf-8")


def _verify_totp(secret: str, token: str, interval: int = 30, window: int = 1) -> bool:
    """Verify a 6 digit TOTP token.

    A small implementation based on RFC 6238 to avoid external dependencies.
    """

    try:
        key = base64.b32decode(secret, True)
    except Exception:  # pragma: no cover - invalid secret
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


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class EnrollmentValidationView(APIView):
    """Validate the enrollment token and create a session."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:  # pragma: no cover - simple
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token required"}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        try:
            enrollment = EnrollmentToken.objects.get(token_hash=token_hash)
        except EnrollmentToken.DoesNotExist:
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        if enrollment.is_expired():
            return Response({"detail": "Token expired"}, status=status.HTTP_400_BAD_REQUEST)

        request.session["enrollment_user_id"] = enrollment.user_id
        return Response({"detail": "Token valid"})


class PasskeyRegisterChallengeView(APIView):
    """Provide a challenge for passkey registration."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: HttpRequest) -> Response:  # pragma: no cover - simple
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Enrollment session missing"}, status=status.HTTP_400_BAD_REQUEST)

        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode()
        request.session["passkey_challenge"] = challenge

        user_id_b64 = base64.urlsafe_b64encode(str(user.pk).encode()).decode()
        rp_name = getattr(settings, "RP_NAME", "Luximia ERP")

        data: dict[str, Any] = {
            "challenge": challenge,
            "rp": {"name": rp_name},
            "user": {
                "id": user_id_b64,
                "name": user.email,
                "displayName": user.get_full_name() or user.email,
            },
        }
        return Response(data)


class PasskeyRegisterView(APIView):
    """Verify the browser response and store the credential."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:  # pragma: no cover - simple
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Enrollment session missing"}, status=status.HTTP_400_BAD_REQUEST)

        expected_challenge = request.session.get("passkey_challenge")
        client_data_b64 = request.data.get("clientDataJSON")
        credential_id = request.data.get("id")

        if not expected_challenge or not client_data_b64 or not credential_id:
            return Response({"detail": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client_data = json.loads(base64.b64decode(client_data_b64))
        except Exception:  # pragma: no cover - invalid client data
            return Response({"detail": "Invalid client data"}, status=status.HTTP_400_BAD_REQUEST)

        if client_data.get("challenge") != expected_challenge:
            return Response({"detail": "Challenge mismatch"}, status=status.HTTP_400_BAD_REQUEST)

        creds = user.passkey_credentials or []
        creds.append({"id": credential_id})
        user.passkey_credentials = creds
        user.save()

        request.session.pop("passkey_challenge", None)
        return Response({"detail": "Passkey registered"})


class TOTPSetupView(APIView):
    """Generate a TOTP secret for the user and return an otpauth URI."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:  # pragma: no cover - simple
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Enrollment session missing"}, status=status.HTTP_400_BAD_REQUEST)

        secret = _generate_totp_secret()
        user.totp_secret = signing.dumps(secret, salt="totp")
        user.save()

        issuer = getattr(settings, "TOTP_ISSUER", "Luximia ERP")
        label = f"{issuer}:{user.email}"
        otpauth_uri = (
            f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&digits=6"
        )

        return Response({"otpauth_uri": otpauth_uri})


class TOTPVerifyView(APIView):
    """Verify a TOTP code and activate the user if appropriate."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:  # pragma: no cover - simple
        user = _get_enrollment_user(request)
        if not user:
            return Response({"detail": "Enrollment session missing"}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            return Response({"detail": "TOTP not configured"}, status=status.HTTP_400_BAD_REQUEST)

        if not _verify_totp(secret, code):
            return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        if user.passkey_credentials:
            user.is_active = True
        user.save()

        return Response({"detail": "TOTP verified"})


class StartLoginView(APIView):
    """Start the passwordless login flow for an existing user."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email required"}, status=status.HTTP_400_BAD_REQUEST
            )

        User = get_user_model()
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        login_method = None
        if user.passkey_credentials:
            login_method = "passkey"
        elif user.totp_secret:
            login_method = "totp"
        if not login_method:
            return Response(
                {"detail": "No login method configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.session["login_user_id"] = user.pk
        return Response({"login_method": login_method})


class PasskeyLoginChallengeView(APIView):
    """Provide a challenge for passkey authentication."""

    permission_classes = [permissions.AllowAny]

    def get(self, request: HttpRequest) -> Response:
        user_id = request.session.get("login_user_id")
        if not user_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:  # pragma: no cover - defensive
            return Response(status=status.HTTP_400_BAD_REQUEST)

        allowed_ids = [cred.get("id") for cred in user.passkey_credentials or []]
        if not allowed_ids:
            return Response({"detail": "No passkeys"}, status=status.HTTP_400_BAD_REQUEST)

        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode()
        request.session["login_challenge"] = challenge

        data: dict[str, Any] = {
            "challenge": challenge,
            "allowCredentials": [{"id": cid} for cid in allowed_ids],
        }
        return Response(data)


class PasskeyLoginView(APIView):
    """Verify the passkey assertion and issue JWT tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:
        user_id = request.session.get("login_user_id")
        expected_challenge = request.session.get("login_challenge")
        if not user_id or not expected_challenge:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:  # pragma: no cover - defensive
            return Response(status=status.HTTP_400_BAD_REQUEST)

        credential_id = request.data.get("id")
        client_data_b64 = request.data.get("clientDataJSON")
        auth_data_b64 = request.data.get("authenticatorData")
        signature_b64 = request.data.get("signature")

        if not all([credential_id, client_data_b64, auth_data_b64, signature_b64]):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            client_data = json.loads(base64.b64decode(client_data_b64))
        except Exception:  # pragma: no cover - invalid client data
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if client_data.get("challenge") != expected_challenge:
            return Response(
                {"detail": "Challenge mismatch"}, status=status.HTTP_400_BAD_REQUEST
            )

        credential = None
        for c in user.passkey_credentials or []:
            if c.get("id") == credential_id:
                credential = c
                break
        if not credential:
            return Response({"detail": "Unknown credential"}, status=status.HTTP_400_BAD_REQUEST)

        public_key_b64 = credential.get("public_key")
        sign_count = credential.get("sign_count", 0)
        if not public_key_b64:
            return Response(
                {"detail": "Credential missing public key"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            auth_credential = AuthenticationCredential(
                id=credential_id,
                raw_id=base64url_to_bytes(credential_id),
                response=AuthenticatorAssertionResponse(
                    client_data_json=base64url_to_bytes(client_data_b64),
                    authenticator_data=base64url_to_bytes(auth_data_b64),
                    signature=base64url_to_bytes(signature_b64),
                    user_handle=None,
                ),
                type="public-key",
            )

            verification = verify_authentication_response(
                credential=auth_credential,
                expected_challenge=expected_challenge,
                expected_rp_id=getattr(settings, "RP_ID", request.get_host()),
                expected_origin=getattr(
                    settings,
                    "WEBAUTHN_ORIGIN",
                    f"{'https' if request.is_secure() else 'http'}://{request.get_host()}",
                ),
                credential_public_key=base64url_to_bytes(public_key_b64),
                credential_current_sign_count=sign_count,
                require_user_verification=True,
            )
        except Exception:
            return Response(
                {"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST
            )

        credential["sign_count"] = verification.new_sign_count
        updated_creds = []
        for c in user.passkey_credentials or []:
            if c.get("id") == credential_id:
                updated_creds.append(credential)
            else:
                updated_creds.append(c)
        user.passkey_credentials = updated_creds
        user.save()

        refresh = RefreshToken.for_user(user)
        data = {"refresh": str(refresh), "access": str(refresh.access_token)}

        request.session.pop("login_user_id", None)
        request.session.pop("login_challenge", None)
        return Response(data)


class VerifyTOTPLoginView(APIView):
    """Verify a TOTP code for login and issue JWT tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request: HttpRequest) -> Response:
        user_id = request.session.get("login_user_id")
        if not user_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get("code")
        if not code or len(code) != 6:
            return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:  # pragma: no cover - defensive
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            secret = signing.loads(user.totp_secret, salt="totp")
        except Exception:
            return Response({"detail": "TOTP not configured"}, status=status.HTTP_400_BAD_REQUEST)

        if not _verify_totp(secret, code):
            return Response({"detail": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        data = {"refresh": str(refresh), "access": str(refresh.access_token)}

        request.session.pop("login_user_id", None)
        request.session.pop("login_challenge", None)
        return Response(data)


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

