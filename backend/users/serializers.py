# users/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    has_passkey = serializers.SerializerMethodField()
    has_totp = serializers.SerializerMethodField()
    passkey_provider = serializers.CharField(read_only=True)
    totp_provider = serializers.CharField(read_only=True)

    # Serializa los nombres de los grupos para la tabla de usuarios
    groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "ultima_empresa_activa",
            "has_passkey",
            "has_totp",
            "passkey_provider",
            "totp_provider",
        ]

    def get_has_passkey(self, obj):
        return bool(obj.passkey_credentials)

    def get_has_totp(self, obj):
        return bool(obj.totp_secret)


class PermissionSerializer(serializers.ModelSerializer):
    content_type__model = serializers.CharField(
        source="content_type.model", read_only=True
    )

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type__model"]


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de grupos (roles).
    """

    # Campo de salida para mostrar los permisos completos
    permissions_data = PermissionSerializer(
        source="permissions", many=True, read_only=True
    )
    # Campo de entrada para recibir solo los IDs
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,  # <-- Solo para escritura
    )

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "permissions_data"]

    def create(self, validated_data):
        permissions_data = validated_data.pop("permissions", [])
        group = Group.objects.create(**validated_data)
        group.permissions.set(permissions_data)
        return group

    def update(self, instance, validated_data):
        permissions_data = validated_data.pop("permissions", None)
        instance.name = validated_data.get("name", instance.name)

        if permissions_data is not None:
            instance.permissions.set(permissions_data)

        instance.save()
        return instance
