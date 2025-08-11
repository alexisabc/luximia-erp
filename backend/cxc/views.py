# cxc/views.py
from rest_framework import viewsets
# cxc/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime


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

class StrategicDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        timeframe = request.query_params.get("timeframe", "month")  # 'week' | 'month' | 'year'
        projects = request.query_params.get("projects", "all")      # 'all' o '1,2,3'
        morosidad = request.query_params.get("morosidad", "30")     # '30'|'60'|'90'|'mas'
        por_cobrar = request.query_params.get("por_cobrar", "30")   # '30'|'60'|'90'|'mas'

        # --- Filtros base (proyectos) ---
        from .models import UPE, Contrato, Pago, Presupuesto, Proyecto

        upe_qs = UPE.objects.all()
        contrato_qs = Contrato.objects.all()
        pago_qs = Pago.objects.all()
        presupuesto_qs = Presupuesto.objects.all()

        if projects != "all":
            try:
                ids = [int(x) for x in projects.split(",") if x.strip()]
                upe_qs = upe_qs.filter(proyecto_id__in=ids)
                contrato_qs = contrato_qs.filter(presupuesto__upe__proyecto_id__in=ids)
                pago_qs = pago_qs.filter(contrato__presupuesto__upe__proyecto_id__in=ids)
                presupuesto_qs = presupuesto_qs.filter(upe__proyecto_id__in=ids)
            except ValueError:
                pass

        # --- KPIs (ejemplo simple, ajusta según tu negocio) ---
        upes_total = upe_qs.count()
        ventas_total = (presupuesto_qs.aggregate(s=Sum("precio_con_descuento"))["s"] or 0)
        recuperado_total = (pago_qs.aggregate(s=Sum("valor_mxn"))["s"] or 0)
        por_cobrar_total = (contrato_qs.aggregate(s=Sum("saldo"))["s"] or 0)
        vencido_total = 0  # si no tienes lógica aún, deja 0

        # --- Series para gráficas (últimos 6 meses por simplicidad) ---
        today = timezone.now().date()
        labels = []
        ventas_series = []
        recuperado_series = []
        programado_series = []

        # Genera últimos 6 meses (MM/YYYY)
        for i in range(5, -1, -1):
            year = (today.year if today.month - i > 0 else today.year - 1) if False else None
            month = ((today.month - i - 1) % 12) + 1
            year = today.year - ((today.month - i - 1) // 12 + (1 if today.month - i <= 0 else 0))
            labels.append(f"{month:02d}/{year}")

            # Ventas: suma de presupuestos del mes (placeholder)
            month_ventas = presupuesto_qs.filter(fecha__year=year, fecha__month=month).aggregate(s=Sum("precio_con_descuento"))["s"] or 0
            ventas_series.append(float(month_ventas))

            # Recuperado: suma de pagos del mes
            month_recuperado = pago_qs.filter(fecha_ingreso__year=year, fecha_ingreso__month=month).aggregate(s=Sum("valor_mxn"))["s"] or 0
            recuperado_series.append(float(month_recuperado))

            # Programado: puedes usar contratos.saldo como placeholder (no por mes)
            programado_series.append(float(por_cobrar_total / 6 if por_cobrar_total else 0))

        payload = {
            "kpis": {
                "upes_total": float(upes_total),
                "ventas": float(ventas_total),
                "recuperado": float(recuperado_total),
                "por_cobrar": float(por_cobrar_total),
                "vencido": float(vencido_total),
            },
            "chart": {
                "labels": labels,
                "ventas": ventas_series,
                "recuperado": recuperado_series,
                "programado": programado_series,
            },
        }
        return Response(payload)