from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _

class VersionedJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that checks 'token_version' claim against user.token_version.
    This enforces a single active session policy (last login wins).
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        # Check for token_version claim
        token_version = validated_token.get("token_version")
        if not token_version:
             # If token doesn't have version, maybe it's old? 
             # We can optionally fail or allow. Best to fail if we are strictly enforcing this.
             # However, for transition, we might allow if user.token_version is null?
             # But we default uuid, so user always has one.
             raise AuthenticationFailed(_("Token inválido o antiguo (falta versión)."), code="token_no_version")

        if str(user.token_version) != token_version:
            raise AuthenticationFailed(_("Sesión expirada. Se ha iniciado sesión en otro dispositivo."), code="session_mismatch")

        return user
