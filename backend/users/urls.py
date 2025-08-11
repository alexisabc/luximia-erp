# backend/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EnrollmentValidationView,
    PasskeyRegisterChallengeView,
    PasskeyRegisterView,
    TOTPSetupView,
    TOTPVerifyView,
    StartLoginView,
    PasskeyLoginChallengeView,
    PasskeyLoginView,
    VerifyTOTPLoginView,
)

app_name = 'users'

urlpatterns = [
    # --- Enrollment ---
    path("enrollment/validate/", EnrollmentValidationView.as_view(), name="enrollment-validate"),
    path("passkey/register/challenge/", PasskeyRegisterChallengeView.as_view(), name="passkey-register-challenge"),
    path("passkey/register/", PasskeyRegisterView.as_view(), name="passkey-register"),
    path("totp/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("totp/verify/", TOTPVerifyView.as_view(), name="totp-verify"),

    # --- Login (alineado al front) ---
    path("login/start/", StartLoginView.as_view(), name="login-start"),                     # antes: start_login/
    path("passkey/login/challenge/", PasskeyLoginChallengeView.as_view(), name="passkey-login-challenge"),
    path("passkey/login/", PasskeyLoginView.as_view(), name="passkey-login"),              # antes: passkey/login/verify/
    path("totp/login/verify/", VerifyTOTPLoginView.as_view(), name="totp-login-verify"),

    # --- JWT refresh ---
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
