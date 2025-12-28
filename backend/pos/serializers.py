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
