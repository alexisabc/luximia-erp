"""URL configuration for user enrollment API."""

from django.urls import path

from .views import (
    EnrollmentValidationView,
    PasskeyRegisterChallengeView,
    PasskeyRegisterView,
    TOTPSetupView,
    TOTPVerifyView,
)


urlpatterns = [
    path("enrollment/validate/", EnrollmentValidationView.as_view(), name="enrollment-validate"),
    path(
        "passkey/register/challenge/",
        PasskeyRegisterChallengeView.as_view(),
        name="passkey-register-challenge",
    ),
    path("passkey/register/", PasskeyRegisterView.as_view(), name="passkey-register"),
    path("totp/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("totp/verify/", TOTPVerifyView.as_view(), name="totp-verify"),
]

