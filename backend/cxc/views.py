# cxc/views.py
from rest_framework import viewsets

# cxc/views.py
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.admin.models import LogEntry
from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay, Coalesce
from django.http import HttpResponse
from collections import defaultdict
from datetime import timedelta
from django.utils import timezone
from io import BytesIO
import calendar
import xlsxwriter
from decimal import Decimal
from openai import OpenAI, OpenAIError

MAX_QUERY_TOKENS = 200
MAX_RESPONSE_TOKENS = 300
MAX_CONTEXT_TOKENS = 1000


def _truncate_words(text: str, limit: int) -> str:
    tokens = text.split()
    if len(tokens) <= limit:
        return text
    return " ".join(tokens[:limit])

from .permissions import HasPermissionForAction, CanViewAuditLog
from .rag import retrieve_relevant
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
    AuditLogSerializer,
)


class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base que requiere permisos de acción.
    """

    permission_classes = [HasPermissionForAction]


class BancoViewSet(BaseViewSet):
    queryset = Banco.objects.all().order_by("id")
    serializer_class = BancoSerializer


class ProyectoViewSet(BaseViewSet):
    queryset = Proyecto.objects.all().order_by("id")
    serializer_class = ProyectoSerializer


class UPEViewSet(BaseViewSet):
    queryset = UPE.objects.select_related("proyecto", "moneda").all().order_by("id")
    serializer_class = UPESerializer


class ClienteViewSet(BaseViewSet):
    queryset = Cliente.objects.all().order_by("id")
    serializer_class = ClienteSerializer


class PagoViewSet(BaseViewSet):
    queryset = Pago.objects.all().order_by("id")
    serializer_class = PagoSerializer


class MonedaViewSet(BaseViewSet):
    queryset = Moneda.objects.all().order_by("id")
    serializer_class = MonedaSerializer


class DepartamentoViewSet(BaseViewSet):
    queryset = Departamento.objects.all().order_by("id")
    serializer_class = DepartamentoSerializer


class PuestoViewSet(BaseViewSet):
    queryset = Puesto.objects.all().order_by("id")
    serializer_class = PuestoSerializer


class EmpleadoViewSet(BaseViewSet):
    queryset = Empleado.objects.all().order_by("id")
    serializer_class = EmpleadoSerializer


class MetodoPagoViewSet(BaseViewSet):
    queryset = MetodoPago.objects.all().order_by("id")
    serializer_class = MetodoPagoSerializer


class TipoCambioViewSet(BaseViewSet):
    queryset = TipoCambio.objects.all().order_by("id")
    serializer_class = TipoCambioSerializer


class VendedorViewSet(BaseViewSet):
    queryset = Vendedor.objects.all().order_by("id")
    serializer_class = VendedorSerializer


class FormaPagoViewSet(BaseViewSet):
    queryset = FormaPago.objects.all().order_by("id")
    serializer_class = FormaPagoSerializer


class PlanPagoViewSet(BaseViewSet):
    queryset = PlanPago.objects.all().order_by("id")
    serializer_class = PlanPagoSerializer


class EsquemaComisionViewSet(BaseViewSet):
    queryset = EsquemaComision.objects.all().order_by("id")
    serializer_class = EsquemaComisionSerializer


class PresupuestoViewSet(BaseViewSet):
    queryset = Presupuesto.objects.all().order_by("id")
    serializer_class = PresupuestoSerializer


class ContratoViewSet(BaseViewSet):
    queryset = Contrato.objects.all().order_by("id")
    serializer_class = ContratoSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogEntry.objects.select_related("user", "content_type").order_by(
        "-action_time"
    )
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLog]
    pagination_class = None

    @action(detail=False, methods=["get"], url_path="exportar")
    def exportar(self, request):
        logs = self.get_queryset()
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()

        headers = ["Usuario", "Acción", "Modelo", "ID", "Fecha", "Cambios"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)

        for row, log in enumerate(logs, start=1):
            worksheet.write(row, 0, log.user.get_username() if log.user else "-")
            worksheet.write(row, 1, log.get_action_flag_display())
            worksheet.write(row, 2, log.content_type.model)
            worksheet.write(row, 3, log.object_id)
            worksheet.write(row, 4, log.action_time.isoformat())
            worksheet.write(row, 5, log.change_message)

        workbook.close()
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = "attachment; filename=auditoria.xlsx"
        return response


class ConsultaInteligenteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        consulta = request.data.get("consulta", "").strip()
        if not consulta:
            return Response({"detalle": "Consulta requerida"}, status=400)

        consulta = _truncate_words(consulta, MAX_QUERY_TOKENS)

        contextos = retrieve_relevant(consulta)
        if not contextos:
            return Response({"respuesta": "No tengo información al respecto."})

        contexto_str = _truncate_words("\n".join(contextos), MAX_CONTEXT_TOKENS)

        mensajes = [
            {
                "role": "system",
                "content": (
                    "Eres un asistente del sistema Luximia ERP. "
                    "Responde solo con la información proporcionada en el contexto. "
                    "Si no hay datos relevantes responde 'No tengo información al respecto.'"
                ),
            },
            {
                "role": "user",
                "content": f"Contexto:\n{contexto_str}\n\nPregunta: {consulta}",
            },
        ]

        client = OpenAI()
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=mensajes,
                max_output_tokens=MAX_RESPONSE_TOKENS,
            )
        except OpenAIError:
            return Response({"detalle": "Error al contactar el modelo"}, status=500)
        respuesta = completion.choices[0].message.content.strip()
        return Response({"respuesta": respuesta})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def strategic_dashboard(request):
    # --- 1. Read and process filters ---
    timeframe = request.query_params.get("timeframe", "month")
    project_ids_str = request.query_params.get("projects", "all")

    project_ids = []
    if project_ids_str and project_ids_str != "all":
        try:
            project_ids = [int(pid) for pid in project_ids_str.split(",")]
        except (ValueError, TypeError):
            project_ids = []

    # --- 2. Apply filters to the base Querysets ---
    contratos_base = Contrato.objects.filter(activo=True)
    pagos_base = Pago.objects.filter(activo=True)

    if project_ids:
        # El modelo Contrato se vincula a Proyecto a través de presupuesto -> UPE -> proyecto
        contratos_base = contratos_base.filter(
            presupuesto__upe__proyecto__id__in=project_ids
        )
        # El modelo Pago se vincula a Proyecto mediante contrato -> presupuesto -> UPE -> proyecto
        pagos_base = pagos_base.filter(
            contrato__presupuesto__upe__proyecto__id__in=project_ids
        )

    # --- 3. Calculate KPIs ---
    total_ventas = contratos_base.aggregate(
        total=Coalesce(Sum("monto_mxn"), Decimal("0.0"), output_field=DecimalField())
    )["total"]

    total_recuperado = pagos_base.aggregate(
        total=Coalesce(Sum("monto"), Decimal("0.0"), output_field=DecimalField())
    )["total"]

    # Placeholder logic
    total_vencido = Decimal("0.0")
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
        # Usar truncado por semana para agrupar correctamente
        trunc_func = TruncWeek
        # Etiquetas por semana ISO (año-semana)
        date_format_str = "%G-W%V"
    else:  # month (default)
        trunc_func = TruncDay
        date_format_str = "%d-%b"

    ventas_por_periodo = (
        contratos_base.annotate(
            periodo=trunc_func("fecha")
        )  # Correct: 'fecha' for Contrato
        .values("periodo")
        .annotate(total=Sum("monto_mxn"))
        .order_by("periodo")
    )

    # FINAL CORRECTION: Using 'fecha_pago' for the Pago model
    recuperado_por_periodo = (
        pagos_base.annotate(
            periodo=trunc_func("fecha_pago")
        )  # Correct: 'fecha_pago' for Pago
        .values("periodo")
        .annotate(total=Sum("monto"))
        .order_by("periodo")
    )

    datos_combinados = defaultdict(
        lambda: {"ventas": Decimal("0.0"), "recuperado": Decimal("0.0")}
    )

    for v in ventas_por_periodo:
        if v["periodo"] and v["total"]:
            label = v["periodo"].strftime(date_format_str)
            datos_combinados[label]["ventas"] += v["total"]

    for r in recuperado_por_periodo:
        if r["periodo"] and r["total"]:
            label = r["periodo"].strftime(date_format_str)
            datos_combinados[label]["recuperado"] += r["total"]

    labels_ordenados = sorted(datos_combinados.keys())

    ventas_list = [datos_combinados[label]["ventas"] for label in labels_ordenados]
    recuperado_list = [
        datos_combinados[label]["recuperado"] for label in labels_ordenados
    ]
    programado_list = [
        datos_combinados[label]["ventas"] - datos_combinados[label]["recuperado"]
        for label in labels_ordenados
    ]

    chart_data = {
        "labels": labels_ordenados,
        "ventas": ventas_list,
        "recuperado": recuperado_list,
        "programado": programado_list,
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
