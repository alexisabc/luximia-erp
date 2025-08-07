# cxc/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import (
    Banco, Proyecto, UPE, Cliente, Pago, Moneda, Departamento,
    Puesto, Empleado, MetodoPago, Presupuesto, Contrato, TipoCambio,
    Vendedor, FormaPago, PlanPago, EsquemaComision,
)

from .serializers import (
    BancoSerializer, ProyectoSerializer, UPESerializer, ClienteSerializer,
    PagoSerializer, MonedaSerializer, DepartamentoSerializer, PuestoSerializer,
    EmpleadoSerializer, MetodoPagoSerializer, PresupuestoSerializer,
    ContratoSerializer, TipoCambioSerializer, VendedorSerializer,
    FormaPagoSerializer, PlanPagoSerializer, EsquemaComisionSerializer,
)

class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base que requiere que el usuario esté autenticado.
    """
    permission_classes = [IsAuthenticated]


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

