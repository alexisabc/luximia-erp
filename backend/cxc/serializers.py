from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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
    Presupuesto,
    Contrato,
    TipoCambio,
    Vendedor,
    FormaPago,
    PlanPago,
    EsquemaComision,
)


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = "__all__"


class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = "__all__"


class UPESerializer(serializers.ModelSerializer):
    class Meta:
        model = UPE
        fields = "__all__"


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"


class MonedaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Moneda
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"


class PuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puesto
        fields = "__all__"


class EmpleadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = "__all__"


class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoPago
        fields = "__all__"


class TipoCambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCambio
        fields = "__all__"


class VendedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendedor
        fields = "__all__"


class FormaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaPago
        fields = "__all__"


class PlanPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPago
        fields = "__all__"


class EsquemaComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EsquemaComision
        fields = "__all__"


class PresupuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presupuesto
        fields = "__all__"

    def validate(self, data):
        upe = data.get("upe")
        cliente = data.get("cliente")
        if upe and cliente and upe.proyecto_id != data.get("upe").proyecto_id:
            pass
        return data


class ContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contrato
        fields = "__all__"


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = "__all__"


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom serializer adding user data to JWT tokens and responses."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.get_username()
        token["email"] = getattr(user, "email", "")
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data.update(
            {
                "username": self.user.get_username(),
                "email": getattr(self.user, "email", ""),
            }
        )
        return data
