from rest_framework import serializers
from .models import (
    SolicitudVacaciones,
    SolicitudPermiso,
    Incapacidad,
    DocumentoExpediente,
    Empleado
)

class SolicitudVacacionesSerializer(serializers.ModelSerializer):
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)

    class Meta:
        model = SolicitudVacaciones
        fields = '__all__'
        read_only_fields = ('empleado', 'estatus', 'fecha_solicitud', 'observaciones_rh')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empleado'):
            validated_data['empleado'] = request.user.empleado
        return super().create(validated_data)

class SolicitudPermisoSerializer(serializers.ModelSerializer):
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = SolicitudPermiso
        fields = '__all__'
        read_only_fields = ('empleado', 'estatus', 'fecha_solicitud', 'observaciones_rh')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empleado'):
            validated_data['empleado'] = request.user.empleado
        return super().create(validated_data)

class IncapacidadSerializer(serializers.ModelSerializer):
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Incapacidad
        fields = '__all__'
        read_only_fields = ('empleado', 'estatus')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empleado'):
            validated_data['empleado'] = request.user.empleado
        return super().create(validated_data)

class DocumentoExpedienteSerializer(serializers.ModelSerializer):
    estatus_display = serializers.CharField(source='get_estatus_display', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)

    class Meta:
        model = DocumentoExpediente
        fields = '__all__'
        read_only_fields = ('empleado', 'estatus', 'fecha_subida', 'comentarios')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'empleado'):
            validated_data['empleado'] = request.user.empleado
        return super().create(validated_data)

# Serializers for HR Admin (Read/Write all fields)
class AdminSolicitudVacacionesSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    class Meta:
        model = SolicitudVacaciones
        fields = '__all__'

class AdminSolicitudPermisoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    class Meta:
        model = SolicitudPermiso
        fields = '__all__'

class AdminIncapacidadSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    class Meta:
        model = Incapacidad
        fields = '__all__'

class AdminDocumentoExpedienteSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    class Meta:
        model = DocumentoExpediente
        fields = '__all__'
