# cxc/views.py
from rest_framework import viewsets
# cxc/views.py
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime
from decimal import Decimal


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
    queryset = Proyecto.objects.all().order_by('id')
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def strategic_dashboard(request):
    # lee filtros opcionales (úsalos después en tu query real)
    timeframe = request.query_params.get("timeframe", "month")
    projects = request.query_params.get("projects", "all")
    morosidad = request.query_params.get("morosidad", "30")
    por_cobrar = request.query_params.get("por_cobrar", "30")

    # TODO: reemplazar con cálculos reales
    data = {
        "kpis": {
            "upes_total": 0,
            "ventas": 0,
            "recuperado": 0,
            "por_cobrar": 0,
            "vencido": 0,
        },
        "chart": {
            "labels": [],
            "ventas": [],
            "recuperado": [],
            "programado": [],
        },
        # si luego quieres devolver lo que el usuario filtró:
        "filters": {
            "timeframe": timeframe,
            "projects": projects,
            "morosidad": morosidad,
            "por_cobrar": por_cobrar,
        },
    }
    return Response(data)