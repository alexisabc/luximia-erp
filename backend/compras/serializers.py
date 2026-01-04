from rest_framework import serializers
from .models import Proveedor, Insumo, OrdenCompra, DetalleOrdenCompra, Requisicion, DetalleRequisicion
from inventarios.models import MovimientoInventario, Almacen

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = '__all__'

class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = '__all__'

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    insumo_nombre = serializers.ReadOnlyField(source='insumo.descripcion')
    almacen_nombre = serializers.ReadOnlyField(source='almacen.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='usuario.get_full_name')
    tipo_movimiento_display = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            'id', 'insumo', 'insumo_nombre', 'almacen', 'almacen_nombre',
            'cantidad', 'costo_unitario', 'fecha', 'referencia',
            'tipo_movimiento', 'tipo_movimiento_display', 'usuario', 'usuario_nombre'
        ]
        read_only_fields = ['id', 'fecha', 'usuario']

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

class DetalleRequisicionSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.descripcion')
    total_estimado = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    
    class Meta:
        model = DetalleRequisicion
        fields = '__all__'
        read_only_fields = ['requisicion']

class RequisicionSerializer(serializers.ModelSerializer):
    detalles = DetalleRequisicionSerializer(many=True, read_only=True)
    usuario_nombre = serializers.ReadOnlyField(source='usuario_solicitante.get_full_name')
    obra_nombre = serializers.ReadOnlyField(source='obra.nombre')
    centro_costo_path = serializers.ReadOnlyField(source='centro_costo.nombre')
    
    class Meta:
        model = Requisicion
        fields = [
            'id', 'usuario_solicitante', 'usuario_nombre', 'fecha_solicitud',
            'obra', 'obra_nombre', 'centro_costo', 'centro_costo_path',
            'estado', 'prioridad', 'observaciones', 'detalles'
        ]
        read_only_fields = ['usuario_solicitante', 'fecha_solicitud', 'estado']
