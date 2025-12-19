from rest_framework import serializers
from .models import ContraRecibo, ProgramacionPago, DetalleProgramacion

class ContraReciboSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.razon_social')
    orden_folio = serializers.ReadOnlyField(source='orden_compra.folio')
    
    class Meta:
        model = ContraRecibo
        fields = '__all__'
        read_only_fields = ['folio', 'fecha_recepcion', 'saldo_pendiente', 'estado', 'creado_por']

class DetalleProgramacionSerializer(serializers.ModelSerializer):
    contra_recibo_folio = serializers.ReadOnlyField(source='contra_recibo.folio')
    proveedor_nombre = serializers.ReadOnlyField(source='contra_recibo.proveedor.razon_social')
    
    class Meta:
        model = DetalleProgramacion
        fields = '__all__'

class ProgramacionPagoSerializer(serializers.ModelSerializer):
    detalles = DetalleProgramacionSerializer(many=True, read_only=True)
    banco_nombre = serializers.ReadOnlyField(source='banco_emisor.nombre_corto')
    autorizado_por_nombre = serializers.ReadOnlyField(source='autorizado_por.get_full_name')
    
    class Meta:
        model = ProgramacionPago
        fields = '__all__'
        read_only_fields = ['total_mxn', 'total_usd', 'autorizado_por', 'estado']
