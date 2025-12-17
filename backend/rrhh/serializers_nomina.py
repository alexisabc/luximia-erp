from rest_framework import serializers
from .models import (
    Nomina, ReciboNomina, DetalleReciboItem, 
    ConceptoNomina, TablaISR, ConfiguracionEconomica,
    Empleado
)
from .serializers import EmpleadoSerializer

# ---------------------------------------------------------------------------
# Serializers de Configuración
# ---------------------------------------------------------------------------

class ConfiguracionEconomicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionEconomica
        fields = '__all__'

class ConceptoNominaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptoNomina
        fields = '__all__'

# ---------------------------------------------------------------------------
# Serializers Transaccionales
# ---------------------------------------------------------------------------

class DetalleReciboItemSerializer(serializers.ModelSerializer):
    concepto_codigo = serializers.ReadOnlyField(source='concepto.codigo')
    
    class Meta:
        model = DetalleReciboItem
        fields = [
            'id', 'concepto', 'concepto_codigo', 'nombre_concepto', 
            'clave_sat', 'monto_gravado', 'monto_exento', 'monto_total'
        ]

class ReciboNominaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.ReadOnlyField(source='empleado.nombre_completo')
    detalles = DetalleReciboItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ReciboNomina
        fields = [
            'id', 'empleado', 'empleado_nombre', 
            'salario_diario', 'sbc', 'dias_pagados', 
            'subtotal', 'impuestos_retenidos', 'imss_retenido', 
            'descuentos', 'neto', 'uuid_sat', 'detalles'
        ]

class NominaSerializer(serializers.ModelSerializer):
    # Resumen simple para listas
    class Meta:
        model = Nomina
        fields = [
            'id', 'descripcion', 'fecha_inicio', 'fecha_fin', 'fecha_pago', 
            'tipo', 'estado', 'total_neto', 'created_at'
        ]

class NominaDetailSerializer(NominaSerializer):
    # Detalle completo con recibos embebidos (paginación recomendada en prod, pero útil aquí)
    recibos = ReciboNominaSerializer(many=True, read_only=True)
    
    class Meta(NominaSerializer.Meta):
        fields = NominaSerializer.Meta.fields + ['recibos']

class CalculoNominaSerializer(serializers.Serializer):
    """Serializer para la acción de cálculo (input)."""
    empleados_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        required=False,
        help_text="Lista opcional de IDs de empleados a recalcular. Si vacio, calcula todos."
    )
