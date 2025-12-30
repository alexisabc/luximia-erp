from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    UserViewSet, RoleViewSet, PermissionViewSet,
    StartLoginView, PasskeyLoginChallengeView, PasskeyLoginView, VerifyTOTPLoginView,
    EnrollmentValidationView, PasskeyRegisterChallengeView, PasskeyRegisterView,
    TOTPSetupView, TOTPVerifyView, TOTPResetView, TOTPResetVerifyView, ResetUserSessionView
)

app_name = 'users'

router = DefaultRouter()
router.register(r'usuarios', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permisos', PermissionViewSet, basename='permission')

urlpatterns = [
    # Router (Usuarios, Roles, Permisos)
    path('', include(router.urls)),

    # Custom Management Actions
    path('usuarios/<int:pk>/reset-session/', ResetUserSessionView.as_view(), name='reset-session'),

    # Enrollment
    path('enrollment/validate/', EnrollmentValidationView.as_view(), name='enrollment-validate'),
    path('enrollment/passkey-challenge/', PasskeyRegisterChallengeView.as_view(), name='passkey-register-challenge'),
    path('enrollment/passkey-register/', PasskeyRegisterView.as_view(), name='passkey-register'),
    path('enrollment/totp-setup/', TOTPSetupView.as_view(), name='totp-setup'),
    path('enrollment/totp-verify/', TOTPVerifyView.as_view(), name='totp-verify'),

    # Auth Management
    path('totp/reset/', TOTPResetView.as_view(), name='totp-reset'),
    path('totp/reset/verify/', TOTPResetVerifyView.as_view(), name='totp-reset-verify'),

    # Login Flow
    path('login/start/', StartLoginView.as_view(), name='login-start'),
    path('passkey/login/challenge/', PasskeyLoginChallengeView.as_view(), name='passkey-login-challenge'),
    path('passkey/login/', PasskeyLoginView.as_view(), name='passkey-login'),
    path('totp/login/verify/', VerifyTOTPLoginView.as_view(), name='totp-login-verify'),

    # JWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
