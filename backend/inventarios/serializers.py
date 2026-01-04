from rest_framework import serializers
from .models import Almacen, MovimientoInventario, Existencia

class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = '__all__'

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    insumo_codigo = serializers.CharField(source='insumo.codigo', read_only=True)
    insumo_nombre = serializers.CharField(source='insumo.descripcion', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    
    class Meta:
        model = MovimientoInventario
        fields = '__all__'
        read_only_fields = ['fecha', 'costo_unitario', 'saldo_cantidad', 'saldo_valor']

class ExistenciaSerializer(serializers.ModelSerializer):
    insumo_codigo = serializers.CharField(source='insumo.codigo', read_only=True)
    insumo_nombre = serializers.CharField(source='insumo.descripcion', read_only=True)
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only=True)
    
    class Meta:
        model = Existencia
        fields = '__all__'
        read_only_fields = ['cantidad']
