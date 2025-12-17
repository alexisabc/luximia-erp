from rest_framework import serializers
from .models import (
    Producto, Caja, Turno, Venta, DetalleVenta, 
    CuentaCliente, MovimientoSaldoCliente, MovimientoCaja
)
from contabilidad.models import Cliente
from contabilidad.serializers import ClienteSerializer

class ProductoSerializer(serializers.ModelSerializer):
    precio_final = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Producto
        fields = '__all__'

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = '__all__'

class TurnoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.ReadOnlyField(source='usuario.username')
    
    class Meta:
        model = Turno
        fields = '__all__'
        read_only_fields = ['saldo_final_calculado', 'diferencia', 'fecha_fin']

class CuentaClienteSerializer(serializers.ModelSerializer):
    credito_disponible = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    nombre_cliente = serializers.ReadOnlyField(source='cliente.nombre_completo')
    
    class Meta:
        model = CuentaCliente
        fields = ['id', 'cliente', 'nombre_cliente', 'limite_credito', 'saldo', 'credito_disponible', 'activo']

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    
    class Meta:
        model = DetalleVenta
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_unitario', 'subtotal']

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True) # Para lectura
    items = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    ) # Para escritura: [{producto_id: 1, cantidad: 5}, ...]
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre_completo')
    cajero_nombre = serializers.ReadOnlyField(source='turno.usuario.username')

    class Meta:
        model = Venta
        fields = [
            'id', 'folio', 'turno', 'cajero_nombre', 'cliente', 'cliente_nombre', 
            'fecha', 'subtotal', 'impuestos', 'total', 'estado', 
            'metodo_pago_principal', 'detalles', 'items'
        ]
        read_only_fields = ['folio', 'turno', 'fecha', 'subtotal', 'impuestos', 'total']

class MovimientoSaldoClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoSaldoCliente
        fields = '__all__'

class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = '__all__'

class VentaCancelacionSerializer(serializers.Serializer):
    supervisor_username = serializers.CharField()
    supervisor_code = serializers.CharField(help_text="TOTP code del supervisor")
    motivo = serializers.CharField()

class PagoCuentaSerializer(serializers.Serializer):
    """
    Serializer para registrar un abono a cuenta (Pago de deuda o anticipo).
    """
    cliente_id = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=12, decimal_places=2)
    forma_pago = serializers.ChoiceField(choices=[('EFECTIVO', 'Efectivo'), ('TRANSFERENCIA', 'Transferencia')])
    comentarios = serializers.CharField(required=False, allow_blank=True)
    turno_id = serializers.IntegerField(help_text="ID del turno activo para registrar ingreso si es efectivo")

