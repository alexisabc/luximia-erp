from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
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
from .authy import request_sms, verify_token


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

    otp = serializers.CharField(required=False, allow_blank=True, write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.get_username()
        token["email"] = getattr(user, "email", "")
        # Include administrative flags and permissions in the token so the
        # frontend can determine what to display without additional requests.
        token["is_superuser"] = user.is_superuser
        token["permissions"] = list(user.get_all_permissions())
        return token

    def validate(self, attrs):
        otp = attrs.pop("otp", None)
        data = super().validate(attrs)

        two_factor = getattr(self.user, "two_factor", None)
        if two_factor and two_factor.is_enabled:
            if not two_factor.authy_id:
                raise AuthenticationFailed("authy_user_not_registered")
            if not otp:
                try:
                    request_sms(two_factor.authy_id)
                except Exception:
                    pass
                raise AuthenticationFailed("two_factor_token_required")
            if not verify_token(two_factor.authy_id, otp):
                raise AuthenticationFailed("invalid_two_factor_token")

        data.update(
            {
                "username": self.user.get_username(),
                "email": getattr(self.user, "email", ""),
                "is_superuser": self.user.is_superuser,
                # ``get_all_permissions`` returns a set of permission strings
                # in the format ``app_label.codename``. Converting to a list
                # ensures the value is JSON serialisable for the response and
                # matches what is stored in the token above.
                "permissions": list(self.user.get_all_permissions()),
            }
        )
        return data
