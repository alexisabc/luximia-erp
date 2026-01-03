from rest_framework import serializers
from .models import Obra, CentroCosto, PartidaPresupuestal

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
