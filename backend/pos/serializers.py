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
    caja_nombre = serializers.ReadOnlyField(source='caja.nombre')
    
    class Meta:
        model = Turno
        fields = ['id', 'caja', 'caja_nombre', 'usuario', 'usuario_nombre', 'fecha_inicio', 'fecha_cierre', 'estado', 'saldo_inicial', 'saldo_final_calculado', 'saldo_final_declarado', 'diferencia']
        read_only_fields = ['saldo_final_calculado', 'diferencia', 'fecha_cierre']

class ItemVentaSerializer(serializers.Serializer):
    """Serializer para items individuales en una venta."""
    tipo = serializers.ChoiceField(choices=['insumo', 'producto'])
    insumo_id = serializers.IntegerField(required=False, allow_null=True)
    producto_id = serializers.IntegerField(required=False, allow_null=True)
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=4)
    precio_unitario = serializers.DecimalField(max_digits=12, decimal_places=4)
    
    def validate(self, data):
        if data['tipo'] == 'insumo' and not data.get('insumo_id'):
            raise serializers.ValidationError("Se requiere insumo_id para items tipo 'insumo'")
        if data['tipo'] == 'producto' and not data.get('producto_id'):
            raise serializers.ValidationError("Se requiere producto_id para items tipo 'producto'")
        return data

class CobroVentaSerializer(serializers.Serializer):
    """Serializer para crear una venta (checkout)."""
    items = ItemVentaSerializer(many=True)
    metodo_pago = serializers.ChoiceField(
        choices=['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'ANTICIPO', 'MIXTO']
    )
    almacen_id = serializers.IntegerField(help_text="ID del almacén desde donde se descuenta")
    cliente_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un item en la venta")
        return value

class CuentaClienteSerializer(serializers.ModelSerializer):
    credito_disponible = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    nombre_cliente = serializers.ReadOnlyField(source='cliente.nombre_completo')
    
    class Meta:
        model = CuentaCliente
        fields = ['id', 'cliente', 'nombre_cliente', 'limite_credito', 'saldo', 'credito_disponible', 'activo']

class DetalleVentaReadSerializer(serializers.ModelSerializer):
    """Serializer detallado para lectura de detalles de venta."""
    producto_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = DetalleVenta
        fields = ['id', 'producto', 'insumo', 'producto_nombre', 'descripcion', 'cantidad', 'precio_unitario', 'subtotal']
    
    def get_producto_nombre(self, obj):
        if obj.producto:
            return obj.producto.nombre
        elif obj.insumo:
            return obj.insumo.descripcion
        return obj.descripcion or 'Sin descripción'

class VentaReadSerializer(serializers.ModelSerializer):
    """Serializer completo para lectura de ventas (tickets)."""
    detalles = DetalleVentaReadSerializer(many=True, read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    cajero_nombre = serializers.ReadOnlyField(source='turno.usuario.username')
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Venta
        fields = [
            'id', 'folio', 'turno', 'cajero_nombre', 'cliente', 'cliente_nombre',
            'fecha', 'subtotal', 'impuestos', 'total', 'estado', 'estado_display',
            'metodo_pago', 'metodo_pago_display', 'monto_metodo_principal',
            'metodo_pago_secundario', 'monto_metodo_secundario', 'detalles'
        ]
    
    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return obj.cliente.nombre_completo
        return 'Público General'

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaReadSerializer(many=True, read_only=True)
    items = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    cliente_nombre = serializers.SerializerMethodField()
    cajero_nombre = serializers.ReadOnlyField(source='turno.usuario.username')

    class Meta:
        model = Venta
        fields = [
            'id', 'folio', 'turno', 'cajero_nombre', 'cliente', 'cliente_nombre', 
            'fecha', 'subtotal', 'impuestos', 'total', 'estado', 
            'metodo_pago', 'detalles', 'items'
        ]
        read_only_fields = ['folio', 'turno', 'fecha', 'subtotal', 'impuestos', 'total']
    
    def get_cliente_nombre(self, obj):
        if obj.cliente:
            return obj.cliente.nombre_completo
        return 'Público General'

class MovimientoSaldoClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoSaldoCliente
        fields = '__all__'

class MovimientoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCaja
        fields = '__all__'

class VentaCancelacionSerializer(serializers.Serializer):
    """Serializer legacy - mantener para compatibilidad."""
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


# ============= SISTEMA DE CANCELACIONES CON AUTORIZACIÓN =============

from .models import SolicitudCancelacion

class SolicitudCancelacionSerializer(serializers.ModelSerializer):
    """Serializer para listar y ver solicitudes de cancelación."""
    venta_folio = serializers.ReadOnlyField(source='venta.folio')
    venta_total = serializers.DecimalField(
        source='venta.total', 
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    venta_fecha = serializers.DateTimeField(source='venta.fecha', read_only=True)
    solicitante_nombre = serializers.ReadOnlyField(source='solicitante.username')
    solicitante_nombre_completo = serializers.SerializerMethodField()
    autorizado_por_nombre = serializers.ReadOnlyField(source='autorizado_por.username')
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = SolicitudCancelacion
        fields = [
            'id', 'venta', 'venta_folio', 'venta_total', 'venta_fecha',
            'solicitante', 'solicitante_nombre', 'solicitante_nombre_completo',
            'motivo', 'estado', 'autorizado_por', 'autorizado_por_nombre',
            'fecha_autorizacion', 'comentarios_autorizacion',
            'fecha_solicitud', 'tiempo_transcurrido'
        ]
        read_only_fields = [
            'venta_folio', 'venta_total', 'solicitante_nombre',
            'autorizado_por_nombre', 'fecha_autorizacion', 'fecha_solicitud'
        ]
    
    def get_solicitante_nombre_completo(self, obj):
        return f"{obj.solicitante.first_name} {obj.solicitante.last_name}".strip() or obj.solicitante.username
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.fecha_solicitud
        minutes = int(delta.total_seconds() / 60)
        if minutes < 60:
            return f"Hace {minutes} min"
        hours = minutes // 60
        if hours < 24:
            return f"Hace {hours}h"
        days = hours // 24
        return f"Hace {days}d"


class CrearSolicitudCancelacionSerializer(serializers.Serializer):
    """Serializer para que el cajero solicite una cancelación."""
    venta_id = serializers.IntegerField(help_text="ID de la venta a cancelar")
    motivo = serializers.CharField(
        min_length=10, 
        help_text="Motivo de la cancelación (mínimo 10 caracteres)"
    )
    
    def validate_venta_id(self, value):
        from .models import Venta
        try:
            venta = Venta.objects.get(pk=value)
            if venta.estado == 'CANCELADA':
                raise serializers.ValidationError("Esta venta ya está cancelada.")
            # Verificar si ya hay una solicitud pendiente
            if venta.solicitudes_cancelacion.filter(estado='PENDIENTE').exists():
                raise serializers.ValidationError("Ya existe una solicitud de cancelación pendiente para esta venta.")
            return value
        except Venta.DoesNotExist:
            raise serializers.ValidationError("Venta no encontrada.")


class AutorizarCancelacionSerializer(serializers.Serializer):
    """Serializer para que el supervisor autorice una cancelación."""
    codigo_autorizacion = serializers.CharField(
        min_length=6, 
        max_length=6,
        help_text="Código TOTP de autorización del supervisor (6 dígitos)"
    )
    comentarios = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="Comentarios opcionales del supervisor"
    )
    
    def validate_codigo_autorizacion(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El código debe contener solo dígitos.")
        return value


class RechazarCancelacionSerializer(serializers.Serializer):
    """Serializer para que el supervisor rechace una cancelación."""
    comentarios = serializers.CharField(
        min_length=5,
        help_text="Motivo del rechazo (requerido)"
    )
