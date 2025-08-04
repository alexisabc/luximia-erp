from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate

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
    UserTwoFactor,
)

from .serializers import (
    BancoSerializer,
    ProyectoSerializer,
    UPESerializer,
    ClienteSerializer,
    PagoSerializer,
    MonedaSerializer,
    DepartamentoSerializer,
    PuestoSerializer,
    EmpleadoSerializer,
    MetodoPagoSerializer,
    PresupuestoSerializer,
    ContratoSerializer,
    TipoCambioSerializer,
    VendedorSerializer,
    FormaPagoSerializer,
    PlanPagoSerializer,
    EsquemaComisionSerializer,
)
from .authy import register_user


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]


class BancoViewSet(BaseViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer


class ProyectoViewSet(BaseViewSet):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer


class UPEViewSet(BaseViewSet):
    queryset = UPE.objects.all()
    serializer_class = UPESerializer


class ClienteViewSet(BaseViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class PagoViewSet(BaseViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer


class MonedaViewSet(BaseViewSet):
    queryset = Moneda.objects.all()
    serializer_class = MonedaSerializer


class DepartamentoViewSet(BaseViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer


class PuestoViewSet(BaseViewSet):
    queryset = Puesto.objects.all()
    serializer_class = PuestoSerializer


class EmpleadoViewSet(BaseViewSet):
    queryset = Empleado.objects.all()
    serializer_class = EmpleadoSerializer


class MetodoPagoViewSet(BaseViewSet):
    queryset = MetodoPago.objects.all()
    serializer_class = MetodoPagoSerializer


class TipoCambioViewSet(BaseViewSet):
    queryset = TipoCambio.objects.all()
    serializer_class = TipoCambioSerializer


class VendedorViewSet(BaseViewSet):
    queryset = Vendedor.objects.all()
    serializer_class = VendedorSerializer


class FormaPagoViewSet(BaseViewSet):
    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer


class PlanPagoViewSet(BaseViewSet):
    queryset = PlanPago.objects.all()
    serializer_class = PlanPagoSerializer


class EsquemaComisionViewSet(BaseViewSet):
    queryset = EsquemaComision.objects.all()
    serializer_class = EsquemaComisionSerializer


class PresupuestoViewSet(BaseViewSet):
    queryset = Presupuesto.objects.all()
    serializer_class = PresupuestoSerializer


class ContratoViewSet(BaseViewSet):
    queryset = Contrato.objects.all()
    serializer_class = ContratoSerializer


class AuthyRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        phone = request.data.get("phone")
        country_code = request.data.get("country_code", "52")

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "invalid_credentials"}, status=400)

        two_factor, _ = UserTwoFactor.objects.get_or_create(user=user)
        try:
            resp = register_user(user.email, phone, country_code)
        except Exception:
            return Response({"detail": "authy_registration_failed"}, status=400)

        if getattr(resp, "ok", False):
            two_factor.authy_id = resp.id
            two_factor.phone_number = phone
            two_factor.country_code = country_code
            two_factor.save()
            return Response({"authy_id": resp.id})
        return Response({"detail": "authy_registration_failed"}, status=400)
