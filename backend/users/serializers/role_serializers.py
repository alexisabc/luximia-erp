from rest_framework import serializers
from django.contrib.auth.models import Permission
from users.models import Role

class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)
    model = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'app_label', 'model']

class RoleSerializer(serializers.ModelSerializer):
    permissions_data = PermissionSerializer(source='permissions', many=True, read_only=True)
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    user_count = serializers.IntegerField(source='users.count', read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'nombre', 'descripcion', 'permissions', 'permissions_data', 'es_sistema', 'user_count']
        read_only_fields = ['es_sistema']

    def create(self, validated_data):
        permissions = validated_data.pop('permissions', [])
        role = Role.objects.create(**validated_data)
        role.permissions.set(permissions)
        return role

    def update(self, instance, validated_data):
        if instance.es_sistema:
            # Protegemos roles de sistema de cambios de nombre y permisos base
            validated_data.pop('nombre', None)
        
        permissions = validated_data.pop('permissions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if permissions is not None:
            instance.permissions.set(permissions)
            
        instance.save()
        return instance
