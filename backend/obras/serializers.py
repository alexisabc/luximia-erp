from rest_framework import serializers
from .models import (
    Obra, CentroCosto, PartidaPresupuestal, 
    ActividadProyecto, DependenciaActividad,
    AsignacionRecurso, OrdenCambio
)

class PartidaPresupuestalSerializer(serializers.ModelSerializer):
    disponible = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    
    class Meta:
        model = PartidaPresupuestal
        fields = '__all__'

class CentroCostoSerializer(serializers.ModelSerializer):
    partidas = PartidaPresupuestalSerializer(many=True, read_only=True)
    
    class Meta:
        model = CentroCosto
        fields = '__all__'

class ObraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Obra
        fields = '__all__'

class ActividadProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActividadProyecto
        fields = '__all__'

class DependenciaActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DependenciaActividad
        fields = '__all__'

class AsignacionRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsignacionRecurso
        fields = '__all__'

class OrdenCambioSerializer(serializers.ModelSerializer):
    solicitado_por_nombre = serializers.ReadOnlyField(source='solicitado_por.username')
    autorizado_por_nombre = serializers.ReadOnlyField(source='autorizado_por.username')
    
    class Meta:
        model = OrdenCambio
        fields = '__all__'
