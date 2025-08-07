# backend/users/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Vistas de Inscripción (Enrollment)
    EnrollmentValidationView,
    PasskeyRegisterChallengeView,
    PasskeyRegisterView,
    TOTPSetupView,
    TOTPVerifyView,

    # Vistas de Inicio de Sesión (Login)
    StartLoginView,
    PasskeyLoginChallengeView,
    PasskeyLoginView,
    VerifyTOTPLoginView,
)


app_name = 'users'

urlpatterns = [
    # --- Rutas de Inscripción ---
    path("enrollment/validate/", EnrollmentValidationView.as_view(), name="enrollment-validate"),
    path("passkey/register/challenge/", PasskeyRegisterChallengeView.as_view(), name="passkey-register-challenge"),
    path("passkey/register/", PasskeyRegisterView.as_view(), name="passkey-register"),
    path("totp/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("totp/verify/", TOTPVerifyView.as_view(), name="totp-verify"),

    # --- Rutas de Inicio de Sesión ---
    path("start_login/", StartLoginView.as_view(), name="start_login"),
    path("passkey/login/challenge/", PasskeyLoginChallengeView.as_view(), name="passkey-login-challenge"),
    path("passkey/login/verify/", PasskeyLoginView.as_view(), name="passkey-login-verify"),
    path("totp/login/verify/", VerifyTOTPLoginView.as_view(), name="totp-login-verify"),

    # --- Ruta para Refrescar el Token ---
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"), 
]