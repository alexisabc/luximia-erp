from rest_framework import serializers
from .models import SystemSetting, FeatureFlag


class SystemSettingSerializer(serializers.ModelSerializer):
    """Serializer para configuraciones del sistema"""
    
    modified_by_name = serializers.CharField(
        source='modified_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = SystemSetting
        fields = [
            'id',
            'key',
            'value',
            'category',
            'description',
            'is_public',
            'modified_by',
            'modified_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'modified_by_name']
    
    def validate_key(self, value):
        """Validar que la key esté en mayúsculas y sin espacios"""
        if ' ' in value:
            raise serializers.ValidationError("La clave no puede contener espacios")
        return value.upper()


class SystemSettingUpdateSerializer(serializers.Serializer):
    """Serializer para actualizar solo el valor de una configuración"""
    
    value = serializers.JSONField(
        help_text="Nuevo valor de la configuración"
    )
    
    def validate_value(self, value):
        """Validar que el valor sea serializable"""
        import json
        try:
            json.dumps(value)
            return value
        except (TypeError, ValueError):
            raise serializers.ValidationError("El valor debe ser serializable a JSON")


class PublicSettingsSerializer(serializers.Serializer):
    """Serializer para configuraciones públicas (frontend)"""
    
    settings = serializers.DictField(
        child=serializers.JSONField(),
        help_text="Diccionario de configuraciones públicas"
    )
    features = serializers.DictField(
        child=serializers.BooleanField(),
        help_text="Diccionario de feature flags activos"
    )


class FeatureFlagSerializer(serializers.ModelSerializer):
    """Serializer para feature flags"""
    
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    allowed_users_count = serializers.IntegerField(
        source='allowed_users.count',
        read_only=True
    )
    
    class Meta:
        model = FeatureFlag
        fields = [
            'id',
            'code',
            'name',
            'description',
            'is_active',
            'rollout_percentage',
            'allowed_roles',
            'allowed_users_count',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 'allowed_users_count']
    
    def validate_code(self, value):
        """Validar que el código esté en mayúsculas y sin espacios"""
        if ' ' in value:
            raise serializers.ValidationError("El código no puede contener espacios")
        return value.upper()
    
    def validate_rollout_percentage(self, value):
        """Validar que el porcentaje esté entre 0 y 100"""
        if not 0 <= value <= 100:
            raise serializers.ValidationError("El porcentaje debe estar entre 0 y 100")
        return value


class FeatureFlagToggleSerializer(serializers.Serializer):
    """Serializer para activar/desactivar un feature flag"""
    
    is_active = serializers.BooleanField(
        help_text="True para activar, False para desactivar"
    )
