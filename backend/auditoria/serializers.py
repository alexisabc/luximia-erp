from rest_framework import serializers
from auditoria.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer para registros de auditoría del sistema.
    Provee información detallada de cambios con formato legible.
    """
    usuario_nombre = serializers.SerializerMethodField()
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    content_type_display = serializers.SerializerMethodField()
    cambios_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'usuario', 'usuario_nombre', 'accion', 'accion_display',
            'content_type', 'content_type_display', 'object_id', 'object_repr',
            'cambios', 'cambios_formatted', 'ip_address', 'user_agent',
            'descripcion', 'fecha'
        ]
        read_only_fields = fields  # Todos los campos son read-only
    
    def get_usuario_nombre(self, obj):
        """Retorna el nombre del usuario o 'Sistema' si es None."""
        if obj.usuario:
            full_name = obj.usuario.get_full_name()
            return full_name if full_name else obj.usuario.username
        return 'Sistema'
    
    def get_content_type_display(self, obj):
        """Retorna el nombre legible del modelo."""
        if obj.content_type:
            return f"{obj.content_type.app_label}.{obj.content_type.model}"
        return None
    
    def get_cambios_formatted(self, obj):
        """Retorna los cambios en formato legible."""
        return obj.get_cambios_legibles()
