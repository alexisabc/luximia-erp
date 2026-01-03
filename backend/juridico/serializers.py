from rest_framework import serializers
from .models import PlantillaLegal, DocumentoFirmado


class PlantillaLegalSerializer(serializers.ModelSerializer):
    """
    Serializer para PlantillaLegal.
    """
    class Meta:
        model = PlantillaLegal
        fields = [
            'id', 'titulo', 'contenido', 'tipo', 'activo',
            'descripcion', 'variables_disponibles',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DocumentoFirmadoSerializer(serializers.ModelSerializer):
    """
    Serializer para DocumentoFirmado.
    """
    plantilla_titulo = serializers.CharField(source='plantilla.titulo', read_only=True)
    usuario_firmante_nombre = serializers.SerializerMethodField()
    content_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentoFirmado
        fields = [
            'id', 'plantilla', 'plantilla_titulo',
            'content_type', 'object_id', 'content_type_display',
            'archivo_pdf', 'hash_firma',
            'datos_firma', 'usuario_firmante', 'usuario_firmante_nombre',
            'fecha_firma', 'estado',
            'datos_renderizados',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'hash_firma', 'archivo_pdf', 'fecha_firma',
            'created_at', 'updated_at'
        ]
    
    def get_usuario_firmante_nombre(self, obj):
        if obj.usuario_firmante:
            return obj.usuario_firmante.get_full_name() or obj.usuario_firmante.username
        return None
    
    def get_content_type_display(self, obj):
        return f"{obj.content_type.app_label}.{obj.content_type.model}"


class FirmarDocumentoSerializer(serializers.Serializer):
    """
    Serializer para la acción de firmar un documento.
    """
    plantilla_id = serializers.IntegerField(required=True)
    content_type = serializers.CharField(
        required=True,
        help_text="Formato: 'app.modelo' (ej: 'rrhh.empleado')"
    )
    object_id = serializers.IntegerField(required=True)
    datos_contexto = serializers.JSONField(
        required=True,
        help_text="Datos para renderizar la plantilla"
    )
    datos_meta = serializers.JSONField(
        required=False,
        help_text="Metadatos de la firma (IP, UserAgent, etc.)"
    )
