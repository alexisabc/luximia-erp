# cxc/views.py
from rest_framework import viewsets
# cxc/views.py
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay, Coalesce
from collections import defaultdict
from datetime import timedelta
from django.utils import timezone
import calendar
from decimal import Decimal
from .permissions import HasPermissionForAction
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
    ViewSet base que requiere permisos de acción.
    """
    permission_classes = [HasPermissionForAction]


class BancoViewSet(BaseViewSet):
    queryset = Banco.objects.all().order_by('id')
    serializer_class = BancoSerializer


class ProyectoViewSet(BaseViewSet):
    queryset = Proyecto.objects.all().order_by('id')
    serializer_class = ProyectoSerializer


class UPEViewSet(BaseViewSet):
    queryset = UPE.objects.select_related('proyecto', 'moneda').all().order_by('id')
    serializer_class = UPESerializer


class ClienteViewSet(BaseViewSet):
    queryset = Cliente.objects.all().order_by('id')
    serializer_class = ClienteSerializer


class PagoViewSet(BaseViewSet):
    queryset = Pago.objects.all().order_by('id')
    serializer_class = PagoSerializer


class MonedaViewSet(BaseViewSet):
    queryset = Moneda.objects.all().order_by('id')
    serializer_class = MonedaSerializer


class DepartamentoViewSet(BaseViewSet):
    queryset = Departamento.objects.all().order_by('id')
    serializer_class = DepartamentoSerializer


class PuestoViewSet(BaseViewSet):
    queryset = Puesto.objects.all().order_by('id')
    serializer_class = PuestoSerializer


class EmpleadoViewSet(BaseViewSet):
    queryset = Empleado.objects.all().order_by('id')
    serializer_class = EmpleadoSerializer


class MetodoPagoViewSet(BaseViewSet):
    queryset = MetodoPago.objects.all().order_by('id')
    serializer_class = MetodoPagoSerializer


class TipoCambioViewSet(BaseViewSet):
    queryset = TipoCambio.objects.all().order_by('id')
    serializer_class = TipoCambioSerializer


class VendedorViewSet(BaseViewSet):
    queryset = Vendedor.objects.all().order_by('id')
    serializer_class = VendedorSerializer


class FormaPagoViewSet(BaseViewSet):
    queryset = FormaPago.objects.all().order_by('id')
    serializer_class = FormaPagoSerializer


class PlanPagoViewSet(BaseViewSet):
    queryset = PlanPago.objects.all().order_by('id')
    serializer_class = PlanPagoSerializer


class EsquemaComisionViewSet(BaseViewSet):
    queryset = EsquemaComision.objects.all().order_by('id')
    serializer_class = EsquemaComisionSerializer


class PresupuestoViewSet(BaseViewSet):
    queryset = Presupuesto.objects.all().order_by('id')
    serializer_class = PresupuestoSerializer


class ContratoViewSet(BaseViewSet):
    queryset = Contrato.objects.all().order_by('id')
    serializer_class = ContratoSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def strategic_dashboard(request):
    # --- 1. Read and process filters ---
    timeframe = request.query_params.get("timeframe", "month")
    project_ids_str = request.query_params.get("projects", "all")

    project_ids = []
    if project_ids_str and project_ids_str != 'all':
        try:
            project_ids = [int(pid) for pid in project_ids_str.split(',')]
        except (ValueError, TypeError):
            project_ids = []

    # --- 2. Apply filters to the base Querysets ---
    contratos_base = Contrato.objects.filter(activo=True)
    pagos_base = Pago.objects.filter(activo=True)

    if project_ids:
        contratos_base = contratos_base.filter(upe__proyecto_id__in=project_ids)
        pagos_base = pagos_base.filter(contrato__upe__proyecto_id__in=project_ids)

    # --- 3. Calculate KPIs ---
    total_ventas = contratos_base.aggregate(
        total=Coalesce(Sum('monto_mxn'), Decimal('0.0'), output_field=DecimalField())
    )['total']
    
    total_recuperado = pagos_base.aggregate(
        total=Coalesce(Sum('monto'), Decimal('0.0'), output_field=DecimalField())
    )['total']

    # Placeholder logic
    total_vencido = Decimal('0.0') 
    monto_por_cobrar = total_ventas - total_recuperado
    
    kpis = {
        "upes_total": UPE.objects.filter(activo=True).count(),
        "ventas": total_ventas,
        "recuperado": total_recuperado,
        "por_cobrar": monto_por_cobrar,
        "vencido": total_vencido,
    }

    # --- 4. Prepare data for the Chart ---
    if timeframe == "year":
        trunc_func = TruncMonth
        date_format_str = "%Y-%m"
    elif timeframe == "week":
        trunc_func = TruncDay
        date_format_str = "Sem %U"
    else:  # month (default)
        trunc_func = TruncDay
        date_format_str = "%d-%b"

    ventas_por_periodo = (contratos_base
                          .annotate(periodo=trunc_func('fecha')) # Correct: 'fecha' for Contrato
                          .values('periodo')
                          .annotate(total=Sum('monto_mxn'))
                          .order_by('periodo'))

    # FINAL CORRECTION: Using 'fecha_pago' for the Pago model
    recuperado_por_periodo = (pagos_base
                              .annotate(periodo=trunc_func('fecha_pago')) # Correct: 'fecha_pago' for Pago
                              .values('periodo')
                              .annotate(total=Sum('monto'))
                              .order_by('periodo'))
    
    datos_combinados = defaultdict(lambda: {'ventas': Decimal('0.0'), 'recuperado': Decimal('0.0')})
    
    for v in ventas_por_periodo:
        if v['periodo'] and v['total']:
            label = v['periodo'].strftime(date_format_str)
            datos_combinados[label]['ventas'] += v['total']

    for r in recuperado_por_periodo:
        if r['periodo'] and r['total']:
            label = r['periodo'].strftime(date_format_str)
            datos_combinados[label]['recuperado'] += r['total']

    labels_ordenados = sorted(datos_combinados.keys())
    
    chart_data = {
        "labels": labels_ordenados,
        "ventas": [datos_combinados[label]['ventas'] for label in labels_ordenados],
        "recuperado": [datos_combinados[label]['recuperado'] for label in labels_ordenados],
        "programado": [],
    }

    # --- 5. Assemble the final response ---
    data = {
        "kpis": kpis,
        "chart": chart_data,
        "filters": {
            "timeframe": timeframe,
            "projects": project_ids_str,
        },
    }
    return Response(data)