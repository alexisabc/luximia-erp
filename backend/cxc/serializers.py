from rest_framework import serializers
from .models import (
    Banco,
    Proyecto,
    UPE,
    Cliente,
    Pago,
    Moneda,
    Departamento,
    Puesto,
    Empleado,
    MetodoPago,
    Contrato,
)


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = '__all__'


class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = '__all__'


class UPESerializer(serializers.ModelSerializer):
    class Meta:
        model = UPE
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class PagoSerializer(serializers.ModelSerializer):
    metodo_pago_nombre = serializers.CharField(source='metodo_pago.nombre', read_only=True)

    class Meta:
        model = Pago
        fields = '__all__'


class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoPago
        fields = '__all__'


class ContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contrato
        fields = '__all__'


class MonedaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Moneda
        fields = '__all__'


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'


class PuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puesto
        fields = '__all__'


class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = '__all__'
