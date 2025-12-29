from rest_framework import serializers
from .models import (
    ContraRecibo, ProgramacionPago, DetalleProgramacion,
    CuentaBancaria, CajaChica, MovimientoCaja, Egreso
)
from contabilidad.serializers import MonedaSerializer, BancoSerializer
from compras.serializers import ProveedorSerializer


class ContraReciboSerializer(serializers.ModelSerializer):
    proveedor_data = ProveedorSerializer(source='proveedor', read_only=True)
    moneda_data = MonedaSerializer(source='moneda', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = ContraRecibo
        fields = '__all__'
        read_only_fields = ['folio', 'saldo_pendiente']


class DetalleProgramacionSerializer(serializers.ModelSerializer):
    contra_recibo_data = ContraReciboSerializer(source='contra_recibo', read_only=True)
    
    class Meta:
        model = DetalleProgramacion
        fields = '__all__'


class ProgramacionPagoSerializer(serializers.ModelSerializer):
    banco_data = BancoSerializer(source='banco_emisor', read_only=True)
    detalles = DetalleProgramacionSerializer(many=True, read_only=True)
    autorizado_por_nombre = serializers.CharField(source='autorizado_por.get_full_name', read_only=True)
    
    class Meta:
        model = ProgramacionPago
        fields = '__all__'


class CuentaBancariaSerializer(serializers.ModelSerializer):
    banco_data = BancoSerializer(source='banco', read_only=True)
    moneda_data = MonedaSerializer(source='moneda', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    diferencia = serializers.SerializerMethodField()
    
    class Meta:
        model = CuentaBancaria
        fields = '__all__'
    
    def get_diferencia(self, obj):
        """Calcula la diferencia entre saldo sistema y bancario para conciliación"""
        return obj.saldo_actual - obj.saldo_bancario


class CajaChicaSerializer(serializers.ModelSerializer):
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    porcentaje_uso = serializers.SerializerMethodField()
    
    class Meta:
        model = CajaChica
        fields = '__all__'
        read_only_fields = ['saldo_actual', 'fecha_apertura']
    
    def get_porcentaje_uso(self, obj):
        """Calcula el porcentaje de uso del fondo"""
        if obj.monto_fondo > 0:
            return round((obj.saldo_actual / obj.monto_fondo) * 100, 2)
        return 0


class MovimientoCajaSerializer(serializers.ModelSerializer):
    caja_nombre = serializers.CharField(source='caja.nombre', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.get_full_name', read_only=True)
    
    class Meta:
        model = MovimientoCaja
        fields = '__all__'
        read_only_fields = ['fecha']


class EgresoSerializer(serializers.ModelSerializer):
    cuenta_bancaria_data = CuentaBancariaSerializer(source='cuenta_bancaria', read_only=True)
    solicitado_por_nombre = serializers.CharField(source='solicitado_por.get_full_name', read_only=True)
    autorizado_por_nombre = serializers.CharField(source='autorizado_por.get_full_name', read_only=True)
    contra_recibo_data = ContraReciboSerializer(source='contra_recibo', read_only=True)
    
    class Meta:
        model = Egreso
        fields = '__all__'
        read_only_fields = ['folio', 'fecha_autorizacion']


class EgresoCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para creación de egresos"""
    
    class Meta:
        model = Egreso
        fields = [
            'cuenta_bancaria', 'fecha', 'tipo', 'beneficiario',
            'concepto', 'monto', 'referencia', 'comprobante',
            'contra_recibo'
        ]
    
    def create(self, validated_data):
        # Asignar automáticamente el usuario que solicita
        validated_data['solicitado_por'] = self.context['request'].user
        validated_data['estado'] = 'BORRADOR'
        return super().create(validated_data)
