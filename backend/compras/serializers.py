from rest_framework import serializers
from .models import Proveedor, Insumo, OrdenCompra, DetalleOrdenCompra

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = '__all__'

class DetalleOrdenCompraSerializer(serializers.ModelSerializer):
    importe = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    insumo_nombre = serializers.ReadOnlyField(source='insumo.descripcion')
    
    class Meta:
        model = DetalleOrdenCompra
        fields = ['id', 'orden', 'insumo', 'insumo_nombre', 'descripcion_personalizada', 
                  'cantidad', 'precio_unitario', 'descuento', 'impuesto_tasa', 'importe']
        read_only_fields = ['orden']

class OrdenCompraSerializer(serializers.ModelSerializer):
    detalles = DetalleOrdenCompraSerializer(many=True, read_only=True)
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.razon_social')
    solicitante_nombre = serializers.ReadOnlyField(source='solicitante.get_full_name')
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = OrdenCompra
        fields = [
            'id', 'folio', 'fecha_solicitud', 'fecha_requerida', 
            'proveedor', 'proveedor_nombre', 'solicitante', 'solicitante_nombre',
            'departamento', 'proyecto', 'motivo_compra', 'notas',
            'subtotal', 'iva', 'total', 'moneda',
            'estado', 'estado_display',
            'vobo_por', 'vobo_fecha', 'autorizado_por', 'autorizado_fecha', 'rechazado_por', 'motivo_rechazo',
            'detalles'
        ]
        read_only_fields = [
            'folio', 'fecha_solicitud', 'solicitante', 
            'subtotal', 'iva', 'total', 
            'vobo_por', 'vobo_fecha', 'autorizado_por', 'autorizado_fecha', 'rechazado_por', 'motivo_rechazo',
            'estado'
        ]

class OrdenCompraCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para creación/edición que permite escribir detalles anidados básica o separadamente."""
    class Meta:
        model = OrdenCompra
        fields = '__all__'
        read_only_fields = ['folio', 'fecha_solicitud', 'solicitante', 'estado', 'subtotal', 'iva', 'total']
