# backend/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserListView,
    UserDetailView,
    HardDeleteUserView,
    InviteUserView,
    GroupListView,
    GroupDetailView,
    PermissionListView,
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
    # --- Users ---
    path("", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("<int:pk>/hard/", HardDeleteUserView.as_view(), name="user-hard-delete"),
    path("invite/", InviteUserView.as_view(), name="invite-user"),
    path("<int:pk>/resend-invite/", InviteUserView.as_view(), name="resend-invite"),

    # --- Grupos y Permisos ---
    path("groups/", GroupListView.as_view(), name="group-list-create"),
    path("groups/<int:pk>/", GroupDetailView.as_view(), name="group-detail"),
    path("permissions/", PermissionListView.as_view(), name="permission-list"),

    # --- Enrollment ---
    path("enrollment/validate/", EnrollmentValidationView.as_view(), name="enrollment-validate"),
    path("passkey/register/challenge/", PasskeyRegisterChallengeView.as_view(), name="passkey-register-challenge"),
    path("passkey/register/", PasskeyRegisterView.as_view(), name="passkey-register"),
    path("totp/setup/", TOTPSetupView.as_view(), name="totp-setup"),
    path("totp/verify/", TOTPVerifyView.as_view(), name="totp-verify"),

    # --- Login (alineado al front) ---
    path("login/start/", StartLoginView.as_view(), name="login-start"),
    path("passkey/login/challenge/", PasskeyLoginChallengeView.as_view(), name="passkey-login-challenge"),
    path("passkey/login/", PasskeyLoginView.as_view(), name="passkey-login"),
    path("totp/login/verify/", VerifyTOTPLoginView.as_view(), name="totp-login-verify"),

    # --- JWT refresh ---
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
