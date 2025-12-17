from rest_framework import serializers
from .models import (
    CategoriaEquipo, ModeloEquipo, ActivoIT, 
    AsignacionEquipo, DetalleAsignacion, MovimientoInventario
)
from rrhh.serializers import EmpleadoSerializer

class CategoriaEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEquipo
        fields = '__all__'

class ModeloEquipoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    
    class Meta:
        model = ModeloEquipo
        fields = '__all__'

class ActivoITSerializer(serializers.ModelSerializer):
    modelo_nombre = serializers.ReadOnlyField(source='modelo.nombre')
    categoria_nombre = serializers.ReadOnlyField(source='modelo.categoria.nombre')
    empleado_nombre = serializers.ReadOnlyField(source='empleado_asignado.nombre_completo')
    
    class Meta:
        model = ActivoIT
        fields = '__all__'

class DetalleAsignacionSerializer(serializers.ModelSerializer):
    producto_str = serializers.SerializerMethodField()
    
    class Meta:
        model = DetalleAsignacion
        fields = ['id', 'activo', 'modelo', 'cantidad', 'producto_str', 'devuelto', 'fecha_devolucion']
        
    def get_producto_str(self, obj):
        if obj.activo:
            return f"{obj.activo.modelo.nombre} (S/N: {obj.activo.numero_serie})"
        if obj.modelo:
            return obj.modelo.nombre
        return "N/A"

class AsignacionEquipoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.ReadOnlyField(source='empleado.nombre_completo')
    detalles = DetalleAsignacionSerializer(many=True, read_only=True)
    items = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    
    class Meta:
        model = AsignacionEquipo
        fields = [
            'id', 'empleado', 'empleado_nombre', 'fecha_asignacion', 
            'observaciones', 'firmada', 'pdf_responsiva', 'detalles', 'items'
        ]
        read_only_fields = ['pdf_responsiva', 'fecha_asignacion']

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')
    modelo_nombre = serializers.ReadOnlyField(source='modelo.nombre')
    
    class Meta:
        model = MovimientoInventario
        fields = '__all__'
