from rest_framework import serializers
from .models import CuentaBancaria, MovimientoBancario, Egreso, ContraRecibo
from contabilidad.serializers import BancoSerializer


class CuentaBancariaSerializer(serializers.ModelSerializer):
    banco_nombre = serializers.ReadOnlyField(source='banco.nombre_corto')
    empresa_nombre = serializers.ReadOnlyField(source='empresa.nombre_comercial')
    
    class Meta:
        model = CuentaBancaria
        fields = [
            'id', 'banco', 'banco_nombre', 'empresa', 'empresa_nombre',
            'numero_cuenta', 'clabe', 'tipo_cuenta', 'moneda',
            'saldo_actual', 'saldo_bancario', 'cuenta_contable',
            'es_principal', 'activa', 'created_at', 'updated_at'
        ]
        read_only_fields = ['saldo_actual', 'saldo_bancario']


class MovimientoBancarioSerializer(serializers.ModelSerializer):
    cuenta_nombre = serializers.ReadOnlyField(source='cuenta.__str__')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    origen_tipo_display = serializers.CharField(source='get_origen_tipo_display', read_only=True)
    registrado_por_nombre = serializers.ReadOnlyField(source='registrado_por.username')
    conciliado_por_nombre = serializers.SerializerMethodField()
    origen_detalle = serializers.SerializerMethodField()
    
    class Meta:
        model = MovimientoBancario
        fields = [
            'id', 'cuenta', 'cuenta_nombre', 'fecha', 'tipo', 'tipo_display',
            'monto', 'referencia', 'beneficiario', 'concepto',
            'origen_tipo', 'origen_tipo_display', 'origen_id', 'origen_detalle',
            'conciliado', 'fecha_conciliacion', 'conciliado_por', 'conciliado_por_nombre',
            'registrado_por', 'registrado_por_nombre', 'created_at'
        ]
        read_only_fields = [
            'cuenta', 'fecha', 'tipo', 'monto', 'referencia', 'beneficiario',
            'concepto', 'origen_tipo', 'origen_id', 'conciliado',
            'fecha_conciliacion', 'conciliado_por', 'registrado_por', 'created_at'
        ]
    
    def get_conciliado_por_nombre(self, obj):
        if obj.conciliado_por:
            return obj.conciliado_por.username
        return None
    
    def get_origen_detalle(self, obj):
        """Genera una descripción legible del origen del movimiento."""
        if obj.origen_tipo == 'POS_TURNO' and obj.origen_id:
            try:
                from pos.models import Turno
                turno = Turno.objects.get(pk=obj.origen_id)
                return f"Turno POS #{turno.id} - Cajero {turno.usuario.username} - {turno.caja.nombre}"
            except:
                return f"Turno POS #{obj.origen_id}"
        
        elif obj.origen_tipo == 'CXC_PAGO' and obj.origen_id:
            return f"Pago de Cliente #{obj.origen_id}"
        
        elif obj.origen_tipo == 'CXP_PAGO' and obj.origen_id:
            return f"Pago a Proveedor #{obj.origen_id}"
        
        elif obj.origen_tipo == 'NOMINA' and obj.origen_id:
            return f"Dispersión de Nómina #{obj.origen_id}"
        
        elif obj.origen_tipo == 'MANUAL':
            return "Movimiento Manual"
        
        return obj.get_origen_tipo_display()


class DepositoCorteInputSerializer(serializers.Serializer):
    """Serializer para procesar depósito de corte de caja."""
    turno_id = serializers.IntegerField(help_text="ID del turno a depositar")
    cuenta_id = serializers.IntegerField(help_text="ID de la cuenta bancaria destino")
    imagen_ficha = serializers.FileField(required=False, allow_null=True, help_text="Imagen de la ficha de depósito")


class ConciliacionInputSerializer(serializers.Serializer):
    """Serializer para conciliar un movimiento bancario."""
    fecha_conciliacion = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Fecha de conciliación (default: hoy)"
    )


class EgresoSerializer(serializers.ModelSerializer):
    cuenta_bancaria_nombre = serializers.ReadOnlyField(source='cuenta_bancaria.__str__')
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    solicitado_por_nombre = serializers.ReadOnlyField(source='solicitado_por.username')
    autorizado_por_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Egreso
        fields = [
            'id', 'folio', 'cuenta_bancaria', 'cuenta_bancaria_nombre',
            'fecha', 'tipo', 'tipo_display', 'beneficiario', 'concepto', 'monto',
            'referencia', 'comprobante', 'contra_recibo', 'movimiento_bancario',
            'estado', 'estado_display', 'solicitado_por', 'solicitado_por_nombre',
            'autorizado_por', 'autorizado_por_nombre', 'fecha_autorizacion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['folio', 'movimiento_bancario']
    
    def get_autorizado_por_nombre(self, obj):
        if obj.autorizado_por:
            return obj.autorizado_por.username
        return None


class ContraReciboSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    moneda_codigo = serializers.ReadOnlyField(source='moneda.codigo')
    
    class Meta:
        model = ContraRecibo
        fields = [
            'id', 'folio', 'proveedor', 'proveedor_nombre', 'tipo', 'tipo_display',
            'xml_archivo', 'pdf_archivo', 'uuid', 'orden_compra',
            'fecha_recepcion', 'fecha_vencimiento', 'moneda', 'moneda_codigo',
            'subtotal', 'iva', 'retenciones', 'total', 'saldo_pendiente',
            'comentarios', 'estado', 'estado_display', 'creado_por',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['folio', 'saldo_pendiente']
