from django.contrib.auth import get_user_model
from rest_framework import serializers
from .role_serializers import RoleSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer completo de Usuario con roles y seguridad.
    """
    roles_data = RoleSerializer(source='roles', many=True, read_only=True)
    roles = serializers.SlugRelatedField(
        many=True, 
        slug_field='nombre', 
        queryset=User.roles.field.related_model.objects.all(),
        required=False
    )
    has_passkey = serializers.SerializerMethodField()
    has_totp = serializers.SerializerMethodField()
    totp_auth_configured = serializers.BooleanField(source='totp_authorization_configured', read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "is_active", "is_staff", "is_superuser", "roles", "roles_data",
            "empresa_principal", "ultima_empresa_activa", "has_passkey",
            "has_totp", "totp_auth_configured", "last_login", 
            "current_session_device"
        ]
        read_only_fields = ["last_login", "current_session_device"]

    def get_has_passkey(self, obj):
        return bool(obj.passkey_credentials)

    def get_has_totp(self, obj):
        return bool(obj.totp_secret)

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if roles is not None:
            instance.roles.set(roles)
            # Invalida sesión para refrescar permisos
            instance.update_token_version()
            
        instance.save()
        return instance
