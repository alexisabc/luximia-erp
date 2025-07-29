# backend/cxc/views.py

# ==============================================================================
# --- IMPORTS ---
# ==============================================================================
from datetime import date, datetime, timedelta
from django.conf import settings
import base64
import traceback
from decimal import Decimal
import os
import json
import polars as pl
import io
import xlsxwriter
import locale
from .utils import obtener_y_guardar_tipo_de_cambio, get_logo_path
from django.apps import apps
from django.db import transaction
from django.db.models import Sum, F, Case, When, Value, DecimalField, Q, Count, Min, Max
from django.db.models.functions import Coalesce, TruncDay, TruncWeek, TruncMonth, TruncYear
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.contrib.auth.models import User, Group, Permission
from django.contrib.humanize.templatetags.humanize import intcomma
from django.utils import timezone
from .pagination import CustomPagination
from openai import OpenAI
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from weasyprint import HTML
from .models import Proyecto, Cliente, UPE, Contrato, Pago, PlanDePagos, TipoDeCambio, AuditLog
from .serializers import (
    ProyectoSerializer, ClienteSerializer, UPESerializer, UPEReadSerializer,
    ContratoWriteSerializer, ContratoReadSerializer, PagoWriteSerializer, PagoReadSerializer,
    PlanDePagosSerializer,
    UserReadSerializer, UserWriteSerializer, GroupReadSerializer, GroupWriteSerializer,
    MyTokenObtainPairSerializer, TipoDeCambioSerializer, AuditLogSerializer
)

# ==============================================================================
# --- PERMISOS PERSONALIZADOS ---
# ==============================================================================

class CanViewDashboard(BasePermission):
    """Permite acceso si el usuario tiene el permiso para ver el dashboard."""

    def has_permission(self, request, view):
        return request.user.has_perm('cxc.can_view_dashboard')


class CanUseAI(BasePermission):
    """Permite acceso si el usuario tiene el permiso para usar la IA."""

    def has_permission(self, request, view):
        return request.user.has_perm('cxc.can_use_ai')


class CanViewInactiveRecords(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cxc.can_view_inactive_records')


class CanDeletePermanently(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cxc.can_delete_permanently')


class CanViewAuditLog(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cxc.can_view_auditlog')

# ==============================================================================
# --- FUNCIONES AUXILIARES REUTILIZABLES ---
# ==============================================================================

def log_action(user, action, instance, changes=None):
    AuditLog.objects.create(
        user=user if user.is_authenticated else None,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        changes=changes or ''
    )

def _autoajustar_columnas_excel(worksheet, dataframe):
    """
    Ajusta el ancho de las columnas de una hoja de Excel basándose en el
    contenido más largo de cada una, usando la sintaxis correcta de Polars.
    """
    for idx, col_name in enumerate(dataframe.columns):
        # 1. Convertimos toda la columna a texto (Utf8) para poder medirla.
        # 2. Usamos .str.len_chars() que es el método correcto en Polars.
        # 3. Obtenemos el máximo y manejamos el caso de que la columna esté vacía.
        max_len = dataframe[col_name].cast(pl.Utf8).str.len_chars().max()

        # Si la columna está vacía, max_len puede ser None
        if max_len is None:
            max_len = 0

        header_len = len(col_name)
        column_width = max(max_len, header_len) + 2
        worksheet.set_column(idx, idx, column_width)

# --- MIXIN REUTILIZABLE PARA SOFT DELETE ---
class SoftDeleteViewSetMixin:
    """
    Un mixin que reemplaza el método de eliminación (destroy)
    por una lógica de soft delete (cambia activo a False).
    """

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'create', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'update', instance)

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
        log_action(self.request.user, 'soft_delete', instance)

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self, 'action', None) == 'list':
            return qs.filter(activo=True)
        return qs

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, CanViewInactiveRecords], pagination_class=None)
    def inactive(self, request):
        queryset = self.get_queryset().filter(activo=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, CanDeletePermanently])
    def hard_delete(self, request, pk=None):
        instance = self.get_object()
        log_action(request.user, 'hard_delete', instance)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

def convertir_fecha_excel(valor_fecha):
    """
    Convierte un valor a fecha, manejando tanto el formato de texto 'DD/MM/YYYY'
    como el formato de número de serie de Excel.
    """
    if isinstance(valor_fecha, str):
        return datetime.strptime(valor_fecha, '%d/%m/%Y').date()
    elif isinstance(valor_fecha, (int, float)):
        # Fórmula para convertir el número de serie de Excel a una fecha
        # (El -2 es para ajustar por el año bisiesto de 1900 que Excel calcula mal)
        return (datetime(1899, 12, 30) + timedelta(days=int(valor_fecha))).date()
    return None

# ==============================================================================
# --- VIEWSETS (CRUD BÁSICO) ---
# ==============================================================================


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class ProyectoViewSet(SoftDeleteViewSetMixin,  viewsets.ModelViewSet):
    queryset = Proyecto.objects.all().order_by('nombre')
    serializer_class = ProyectoSerializer
    pagination_class = CustomPagination

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        proyectos = self.get_queryset()
        serializer = self.get_serializer(proyectos, many=True)
        return Response(serializer.data)


class ClienteViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.prefetch_related(
        'contratos__upe__proyecto').order_by('nombre_completo')
    serializer_class = ClienteSerializer
    pagination_class = CustomPagination


class UPEViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = UPE.objects.select_related(
        'proyecto').all().order_by('identificador')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        return UPEReadSerializer if self.action in ['list', 'retrieve'] else UPESerializer

    @action(detail=False, methods=['get'], pagination_class=None)
    def disponibles(self, request):
        upes_disponibles = UPE.objects.select_related(
            'proyecto').filter(estado='Disponible')
        serializer = UPEReadSerializer(upes_disponibles, many=True)
        return Response(serializer.data)


class ContratoViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Contrato.objects.select_related('cliente', 'upe__proyecto').prefetch_related(
        'pagos', 'plan_de_pagos').order_by('-fecha_venta')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        return ContratoReadSerializer if self.action in ['list', 'retrieve'] else ContratoWriteSerializer

    @action(detail=True, methods=['get'])
    def pagos(self, request, pk=None):
        contrato = self.get_object()
        pagos_del_contrato = Pago.objects.filter(
            contrato=contrato).order_by('fecha_pago')
        serializer = PagoReadSerializer(pagos_del_contrato, many=True)
        return Response(serializer.data)


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all().order_by('-fecha_pago')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        return PagoReadSerializer if self.action in ['list', 'retrieve'] else PagoWriteSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'create', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'update', instance)

    def perform_destroy(self, instance):
        contrato_afectado = instance.contrato
        log_action(self.request.user, 'delete', instance)
        instance.delete()
        contrato_afectado.actualizar_plan_de_pagos()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserWriteSerializer
        return UserReadSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self, 'action', None) == 'list':
            return qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'create', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'update', instance)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        log_action(self.request.user, 'soft_delete', instance)

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        users = self.get_queryset()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, CanViewInactiveRecords], pagination_class=None)
    def inactive(self, request):
        users = User.objects.filter(is_active=False)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, CanDeletePermanently])
    def hard_delete(self, request, pk=None):
        user = self.get_object()
        if user.pk == 1:
            return Response({'detail': 'No se puede eliminar el superusuario inicial.'}, status=status.HTTP_400_BAD_REQUEST)
        log_action(request.user, 'hard_delete', user)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('name')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupWriteSerializer
        return GroupReadSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'create', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'update', instance)

    def perform_destroy(self, instance):
        log_action(self.request.user, 'delete', instance)
        instance.delete()

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        groups = self.get_queryset()
        serializer = GroupReadSerializer(groups, many=True)
        return Response(serializer.data)


# ==============================================================================
# --- VISTAS DE REPORTES ---
# ==============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_estado_de_cuenta_pdf(request, pk=None):
    """
    Genera un PDF del estado de cuenta para un contrato específico,
    con columnas seleccionables y marca de agua.
    """
    try:
        contrato = get_object_or_404(
            Contrato.objects.select_related('cliente', 'upe__proyecto'), pk=pk
        )

        # --- Lógica para Columnas Dinámicas ---
        pago_cols_keys = request.query_params.getlist(
            'pago_cols', ['fecha_pago', 'concepto', 'monto_pagado', 'valor_mxn'])
        PAGO_COLUMNAS = {
            "fecha_pago": "Fecha de Pago", "concepto": "Concepto", "instrumento_pago": "Instrumento",
            "ordenante": "Ordenante", "monto_pagado": "Monto Pagado", "valor_mxn": "Valor (MXN)"
        }
        table_headers = [PAGO_COLUMNAS[key]
                         for key in pago_cols_keys if key in PAGO_COLUMNAS]
        table_headers.append("Saldo Restante")

        # --- Lógica de preparación de datos mejorada ---
        pagos_qs = contrato.pagos.order_by('fecha_pago', 'id')
        table_rows = []
        saldo_actual = contrato.precio_final_pactado
        for pago in pagos_qs:
            saldo_actual -= pago.valor_mxn

            # Usamos un diccionario para que la plantilla sea más clara
            row_data = {}
            if 'fecha_pago' in pago_cols_keys:
                row_data['fecha_pago'] = pago.fecha_pago
            if 'concepto' in pago_cols_keys:
                row_data['concepto'] = pago.get_concepto_display()
            if 'instrumento_pago' in pago_cols_keys:
                row_data['instrumento_pago'] = pago.instrumento_pago or ""
            if 'ordenante' in pago_cols_keys:
                row_data['ordenante'] = pago.ordenante or ""
            if 'monto_pagado' in pago_cols_keys:
                row_data['monto_pagado'] = f"${intcomma(round(pago.monto_pagado, 2))} {pago.moneda_pagada}"
            if 'valor_mxn' in pago_cols_keys:
                row_data['valor_mxn'] = f"${intcomma(round(pago.valor_mxn, 2))}"

            row_data['saldo_restante'] = f"${intcomma(round(saldo_actual, 2))}"
            table_rows.append(row_data)

        # --- Lógica para Marca de Agua ---
        logo_base64 = ""
        try:
            logo_path = get_logo_path()
            with open(logo_path, "rb") as image_file:
                encoded_string = base64.b64encode(
                    image_file.read()).decode('utf-8')
            logo_base64 = f"data:image/png;base64,{encoded_string}"
        except FileNotFoundError:
            print(
                f"ADVERTENCIA: No se encontró el archivo del logo en {logo_path}")

        # Usamos el serializer para los datos del resumen
        serializer = ContratoReadSerializer(instance=contrato)
        datos_financieros = serializer.data

        context = {
            'contrato': contrato,
            'plan_de_pagos': contrato.plan_de_pagos.all(),
            'table_headers': table_headers,
            'table_rows': table_rows,  # <-- Ahora contiene los datos pre-formateados
            'pago_cols_keys': pago_cols_keys,
            'logo_base64': logo_base64,
            'adeudo': datos_financieros.get('adeudo'),
            'intereses_generados': datos_financieros.get('intereses_generados'),
            'adeudo_al_corte': datos_financieros.get('adeudo_al_corte'),
            'precio_final_pactado': datos_financieros.get('precio_final_pactado'),
            'moneda_pactada': datos_financieros.get('moneda_pactada'),
        }

        html_string = render_to_string('cxc/estado_de_cuenta.html', context)
        html = HTML(string=html_string)
        pdf = html.write_pdf()

        response = HttpResponse(pdf, content_type='application/pdf')
        response[
            'Content-Disposition'] = f'attachment; filename="estado_de_cuenta_contrato_{contrato.id}.pdf"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el PDF: {e}", status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generar_estado_de_cuenta_excel(request, pk=None):
    """
    Genera un archivo Excel (.xlsx) con formatos de celda específicos y columnas autoajustadas.
    Versión final con escritura manual para control total del formato.
    """
    try:
        contrato = get_object_or_404(Contrato, pk=pk)

        # --- (La lógica para preparar los DataFrames df_plan y df_historial se queda igual) ---
        plan_cols = request.query_params.getlist('plan_cols')
        pago_cols = request.query_params.getlist('pago_cols')
        PLAN_COLUMNAS = {
            "id": "No.", "fecha_vencimiento": "Fecha de Vencimiento", "tipo": "Tipo",
            "monto_programado": "Monto Programado", "pagado": "Estado"
        }
        PAGO_COLUMNAS = {
            "fecha_pago": "Fecha de Pago", "concepto": "Concepto", "instrumento_pago": "Instrumento",
            "ordenante": "Ordenante", "monto_pagado": "Monto Pagado", "moneda_pagada": "Moneda",
            "tipo_cambio": "Tipo de Cambio", "valor_mxn": "Valor (MXN)", "banco_origen": "Banco Origen",
            "num_cuenta_origen": "Cuenta Origen", "banco_destino": "Banco Destino",
            "cuenta_beneficiaria": "Cuenta Beneficiaria", "comentarios": "Comentarios"
        }
        if not plan_cols:
            plan_cols = list(PLAN_COLUMNAS.keys())
        if not pago_cols:
            pago_cols = list(PAGO_COLUMNAS.keys())

        plan_de_pagos_qs = contrato.plan_de_pagos.order_by('fecha_vencimiento')
        plan_data = {PLAN_COLUMNAS[col]: [] for col in plan_cols}
        for i, p in enumerate(plan_de_pagos_qs):
            if 'id' in plan_cols:
                plan_data[PLAN_COLUMNAS['id']].append(i + 1)
            if 'fecha_vencimiento' in plan_cols:
                plan_data[PLAN_COLUMNAS['fecha_vencimiento']].append(
                    p.fecha_vencimiento)
            if 'tipo' in plan_cols:
                plan_data[PLAN_COLUMNAS['tipo']].append(p.get_tipo_display())
            if 'monto_programado' in plan_cols:
                plan_data[PLAN_COLUMNAS['monto_programado']].append(
                    float(p.monto_programado))
            if 'pagado' in plan_cols:
                plan_data[PLAN_COLUMNAS['pagado']].append(
                    "Pagado" if p.pagado else "Pendiente")
        df_plan = pl.DataFrame(plan_data)

        pagos_qs = contrato.pagos.order_by('fecha_pago', 'id')
        historial_data = {PAGO_COLUMNAS[col]: [] for col in pago_cols}
        for p in pagos_qs:
            for col_key in pago_cols:
                col_name = PAGO_COLUMNAS[col_key]
                value = getattr(p, col_key) if hasattr(p, col_key) else None
                if isinstance(value, Decimal):
                    value = float(value)
                historial_data[col_name].append(value)
        df_historial = pl.DataFrame(historial_data)

        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)

        # 1. Definir los formatos
        title_format = workbook.add_format(
            {'bold': True, 'font_size': 18, 'align': 'center'})
        header_format = workbook.add_format(
            {'bold': True, 'bg_color': '#F0F0F0', 'border': 1})
        date_format = workbook.add_format({'num_format': 'dd-mm-yyyy'})
        money_format = workbook.add_format({'num_format': '$#,##0.00'})
        four_decimal_format = workbook.add_format({'num_format': '0.0000'})

        # Construimos la ruta al logo
        logo_path = get_logo_path()

        # 2. Escribir la hoja "Plan de Pagos"
        if not df_plan.is_empty():
            ws_plan = workbook.add_worksheet('Plan de Pagos')

            # ### CAMBIO: Se establece el logo como fondo ###
            ws_plan.set_background(logo_path)


            # Escribimos las cabeceras en la primera fila
            ws_plan.write_row(0, 0, df_plan.columns, header_format)

            # Escribimos los datos celda por celda para aplicar formatos
            for i, row in enumerate(df_plan.iter_rows()):
                for j, value in enumerate(row):
                    col_name = df_plan.columns[j]
                    if 'Fecha' in col_name:
                        ws_plan.write_datetime(i + 1, j, value, date_format)
                    elif 'Monto' in col_name:
                        ws_plan.write_number(i + 1, j, value, money_format)
                    else:
                        ws_plan.write(i + 1, j, value)
            _autoajustar_columnas_excel(ws_plan, df_plan)

        # 3. Escribir la hoja "Historial de Transacciones"
        if not df_historial.is_empty():
            ws_historial = workbook.add_worksheet('Historial de Transacciones')

            # ### CAMBIO: Se establece el logo como fondo ###
            ws_historial.set_background(logo_path)


            ws_historial.write_row(0, 0, df_historial.columns, header_format)
            for i, row in enumerate(df_historial.iter_rows()):
                for j, value in enumerate(row):
                    col_name = df_historial.columns[j]
                    if 'Fecha' in col_name:
                        ws_historial.write_datetime(
                            i + 1, j, value, date_format)
                    elif 'Monto' in col_name or 'Valor' in col_name:
                        ws_historial.write_number(
                            i + 1, j, value, money_format)
                    elif 'Tipo de Cambio' in col_name:
                        ws_historial.write_number(
                            i + 1, j, value, four_decimal_format)
                    else:
                        ws_historial.write(i + 1, j, value)
            _autoajustar_columnas_excel(ws_historial, df_historial)

        workbook.close()
        output.seek(0)

        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response[
            'Content-Disposition'] = f'attachment; filename="estado_de_cuenta_contrato_{contrato.id}.xlsx"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el Excel: {e}", status=500)

# ==============================================================================
# --- VISTAS DE UTILIDADES ---
# ==============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, CanUseAI])
def consulta_inteligente(request):
    pregunta_usuario = request.data.get('pregunta')
    if not pregunta_usuario:
        return Response({"error": "No se proporcionó ninguna pregunta."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "La clave de API de OpenAI no está configurada en el entorno.")

        client = OpenAI(api_key=api_key)

        # ### CAMBIO ###: Ampliamos el prompt con todos los modelos disponibles
        system_prompt = """
        Eres un asistente experto en el CRM de Luximia. Tu trabajo es convertir la pregunta de un usuario en un objeto JSON para consultar la base de datos.
        El JSON debe tener la siguiente estructura: {"modelo": "nombre_del_modelo", "filtros": {}, "agregacion": "tipo_de_agregacion"}.

        Modelos disponibles: 'Contrato', 'Cliente', 'UPE', 'Proyecto', 'PlanDePagos', 'Pago', 'TipoDeCambio'.
        Agregaciones disponibles: 'count' (contar resultados) o 'none' (listar resultados).

        Campos para filtrar en 'Contrato': cliente__nombre_completo__icontains, upe__identificador__iexact, upe__proyecto__nombre__icontains, estado__iexact.
        Campos para filtrar en 'Cliente': nombre_completo__icontains, email__iexact.
        Campos para filtrar en 'UPE': identificador__iexact, proyecto__nombre__icontains, estado__iexact (Valores: 'Disponible', 'Vendida', 'Pagada', 'Bloqueada').
        Campos para filtrar en 'Proyecto': nombre__icontains, activo (Valores: true o false).
        Campos para filtrar en 'PlanDePagos': contrato__cliente__nombre_completo__icontains, fecha_vencimiento, tipo (Valores: 'ENGANCHE', 'MENSUALIDAD'), pagado.
        Campos para filtrar en 'Pago': contrato__cliente__nombre_completo__icontains, fecha_pago, concepto (Valores: 'APARTADO', 'DEVOLUCIÓN', 'DESCUENTO', 'PAGO'), moneda_pagada.
        Campos para filtrar en 'TipoDeCambio': fecha, valor.

        Ejemplo 1: "cuantos contratos tiene el proyecto shark tower" -> {"modelo": "Contrato", "filtros": {"upe__proyecto__nombre__icontains": "shark tower"}, "agregacion": "count"}
        Ejemplo 2: "lista los pagos de marzo" -> {"modelo": "Pago", "filtros": {"fecha_pago__month": 3}, "agregacion": "none"}
        Ejemplo 3: "mostrar upes disponibles en be towers" -> {"modelo": "UPE", "filtros": {"proyecto__nombre__icontains": "be towers", "estado__iexact": "Disponible"}, "agregacion": "none"}
        Ejemplo 4: "cuantos proyectos estan activos" -> {"modelo": "Proyecto", "filtros": {"activo": true}, "agregacion": "count"}

        Nunca respondas con texto conversacional, solo con el objeto JSON.
        """

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": pregunta_usuario}
            ],
            response_format={"type": "json_object"}
        )

        respuesta_ia_str = completion.choices[0].message.content
        parametros_consulta = json.loads(respuesta_ia_str)

        modelo = parametros_consulta.get('modelo')
        filtros = parametros_consulta.get('filtros', {})
        agregacion = parametros_consulta.get('agregacion', 'none')

        q_objects = Q()
        for campo, valor in filtros.items():
            q_objects &= Q(**{campo: valor})

        if modelo == 'Contrato':
            queryset = Contrato.objects.select_related(
                'cliente', 'upe__proyecto').filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} contratos."})
            serializer = ContratoReadSerializer(queryset, many=True)
            return Response(serializer.data)

        elif modelo == 'Cliente':
            queryset = Cliente.objects.filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} clientes."})
            serializer = ClienteSerializer(queryset, many=True)
            return Response(serializer.data)

        # ### NUEVO ###: Lógica para manejar consultas de UPE y Proyecto
        elif modelo == 'UPE':
            queryset = UPE.objects.select_related('proyecto').filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} UPEs."})
            serializer = UPEReadSerializer(queryset, many=True)
            return Response(serializer.data)

        elif modelo == 'Proyecto':
            queryset = Proyecto.objects.filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} proyectos."})
            serializer = ProyectoSerializer(queryset, many=True)
            return Response(serializer.data)

        elif modelo == 'PlanDePagos':
            queryset = PlanDePagos.objects.select_related('contrato__cliente').filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} planes de pago."})
            serializer = PlanDePagosSerializer(queryset, many=True)
            return Response(serializer.data)

        elif modelo == 'Pago':
            queryset = Pago.objects.select_related('contrato__cliente').filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} pagos."})
            serializer = PagoReadSerializer(queryset, many=True)
            return Response(serializer.data)

        elif modelo == 'TipoDeCambio':
            queryset = TipoDeCambio.objects.filter(q_objects)
            if agregacion == 'count':
                return Response({'respuesta': f"Se encontraron {queryset.count()} tipos de cambio."})
            serializer = TipoDeCambioSerializer(queryset, many=True)
            return Response(serializer.data)

        else:
            return Response({"error": "Modelo no reconocido por la IA."}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error al procesar la consulta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_tipo_de_cambio(request):
    """
    Devuelve el tipo de cambio aplicable al día de hoy (o el último día hábil anterior).
    """
    try:
        today = timezone.now().date()
        ultimo_tc = TipoDeCambio.objects.filter(
            fecha__lte=today).latest('fecha')
        return Response({'valor': ultimo_tc.valor})
    except TipoDeCambio.DoesNotExist:
        return Response(
            {'error': 'No hay tipos de cambio registrados en la base de datos.'},
            status=status.HTTP_404_NOT_FOUND
        )


class TipoDeCambioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoDeCambio.objects.all().order_by('-fecha')
    serializer_class = TipoDeCambioSerializer
    pagination_class = CustomPagination

# Añade esta nueva vista


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLog]
    pagination_class = CustomPagination

    @action(detail=False, methods=['get'])
    def excel(self, request):
        logs_qs = self.get_queryset()
        data = {
            'Usuario': [log.user.username if log.user else '' for log in logs_qs],
            'Acción': [log.action for log in logs_qs],
            'Modelo': [log.model_name for log in logs_qs],
            'ID': [log.object_id for log in logs_qs],
            'Fecha': [log.timestamp.strftime('%Y-%m-%d %H:%M:%S') for log in logs_qs],
            'Cambios': [log.changes for log in logs_qs],
        }
        df = pl.DataFrame(data)
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Auditoria')
        worksheet.write_row(0, 0, df.columns)
        for i, row in enumerate(df.iter_rows()):
            worksheet.write_row(i + 1, 0, row)
        _autoajustar_columnas_excel(worksheet, df)
        workbook.close()
        output.seek(0)
        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="auditlog.xlsx"'
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def actualizar_tipo_de_cambio_hoy(request):
    today = timezone.now().date()
    if TipoDeCambio.objects.filter(fecha=today).exists():
        return Response({"mensaje": "El tipo de cambio para hoy ya está actualizado."})

    mensaje = obtener_y_guardar_tipo_de_cambio(today)

    if "Error" in mensaje:
        return Response({"error": mensaje}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"mensaje": mensaje})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_permissions(request):
    """Devuelve una lista de todos los permisos relevantes."""
    apps_a_excluir = ['admin', 'contenttypes', 'sessions']
    permissions = Permission.objects.exclude(
        content_type__app_label__in=apps_a_excluir
    ).order_by('content_type__model').values(
        'id',
        'name',
        'codename',
        'content_type__model',
    )
    return Response(permissions)


# ==============================================================================
# --- VISTAS PARA IMPORTACIÓN DE DATOS ---
# ==============================================================================


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def importar_datos_masivos(request):
    """Importa todos los datos desde un único archivo CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        # LÍNEA CORREGIDA: Usamos pl.read_csv para leer el archivo en memoria
        df = pl.read_csv(archivo_csv.read(),
                          encoding='utf-8', null_values=[''])

        registros_creados = {'proyectos': 0,
                             'clientes': 0, 'upes': 0, 'contratos': 0}
        registros_actualizados = {'proyectos': 0,
                                  'clientes': 0, 'upes': 0, 'contratos': 0}

        # LÍNEA CORREGIDA: Usamos la sintaxis de Polars para iterar
        for row in df.iter_rows(named=True):
            # LÍNEA CORREGIDA: Verificamos si es None
            if row.get('proyecto_nombre') is None:
                continue

            # 1. Procesar Proyecto
            proyecto, creado = Proyecto.objects.update_or_create(
                nombre=row['proyecto_nombre'].strip().upper(),
                defaults={}
            )
            if creado:
                registros_creados['proyectos'] += 1
            else:
                registros_actualizados['proyectos'] += 1

            # 2. Procesar Cliente
            cliente = None
            if row.get('cliente_email') and str(row.get('cliente_email')).strip():
                cliente, creado = Cliente.objects.update_or_create(
                    email=str(row.get('cliente_email')).strip().lower(),
                    defaults={
                        'nombre_completo': str(row.get('cliente_nombre', '')).strip(),
                        'telefono': str(row.get('cliente_telefono', ''))
                    }
                )
                if creado:
                    registros_creados['clientes'] += 1
                else:
                    registros_actualizados['clientes'] += 1

            # 3. Procesar UPE
            upe, creado = UPE.objects.update_or_create(
                proyecto=proyecto,
                identificador=str(row['upe_identificador']).strip(),
                defaults={
                    'valor_total': row['upe_valor_total'],
                    'moneda': str(row['upe_moneda']).strip(),
                    'estado': str(row['upe_estado']).strip()
                }
            )
            if creado:
                registros_creados['upes'] += 1
            else:
                registros_actualizados['upes'] += 1

            # 4. Procesar Contrato (con la nueva lógica)
            if cliente and row.get('contrato_fecha_venta'):
                fecha_obj = convertir_fecha_excel(row.get('contrato_fecha_venta'))
            if not fecha_obj:
                raise Exception(f"Fila {index + 2}: Formato de fecha inválido.")


                # Preparamos los datos del contrato
                defaults_contrato = {
                    'cliente': cliente,
                    'fecha_venta': fecha_obj,
                    'precio_final_pactado': row['contrato_precio_pactado'],
                    'moneda_pactada': row['contrato_moneda'],
                    # ### NUEVOS CAMPOS FINANCIEROS ###
                    'monto_enganche': row.get('monto_enganche', 0),
                    'numero_mensualidades': row.get('numero_mensualidades', 0),
                    'tasa_interes_mensual': row.get('tasa_interes_mensual', 0.0)
                }

                contrato, creado = Contrato.objects.update_or_create(
                    upe=upe,
                    defaults=defaults_contrato
                )
                if creado:
                    registros_creados['contratos'] += 1
                else:
                    registros_actualizados['contratos'] += 1

        return Response({
            "mensaje": "Importación completada.",
            "registros_creados": registros_creados,
            "registros_actualizados": registros_actualizados
        }, status=status.HTTP_200_OK)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def importar_clientes(request):
    """Importa o actualiza clientes desde un CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)

    registros_creados, registros_actualizados = 0, 0
    errores = []

    try:
        # ### CAMBIO CLAVE: Se usa encoding='utf-8' ###
        df = pl.read_csv(archivo_csv.read(), encoding='utf-8', null_values=[''])
        
        for index, row in enumerate(df.iter_rows(named=True)):
            try:
                email = row.get('email')
                if not email or not str(email).strip():
                    errores.append(f"Fila {index + 2}: El campo 'email' no puede estar vacío.")
                    continue

                defaults_cliente = {
                    'nombre_completo': str(row.get('nombre_completo', '')).strip(),
                    'telefono': str(row.get('telefono', ''))
                }
                cliente, creado = Cliente.objects.update_or_create(
                    email=str(email).strip().lower(), 
                    defaults=defaults_cliente
                )
                
                if creado:
                    registros_creados += 1
                else:
                    registros_actualizados += 1
            
            except Exception as e:
                errores.append(f"Fila {index + 2}: Error inesperado - {str(e)}")

        if errores:
            return Response({
                "mensaje": f"Importación completada con errores. Se procesaron {registros_creados + registros_actualizados} registros.",
                "errores": errores
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "mensaje": "Importación de clientes completada.",
            "clientes_creados": registros_creados,
            "clientes_actualizados": registros_actualizados
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error crítico al leer el archivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def importar_upes(request):
    """Importa o actualiza UPEs desde un CSV, recolectando todos los errores."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)

    # ### LÓGICA DE ERRORES MEJORADA ###
    registros_creados, registros_actualizados = 0, 0
    errores = []

    try:
        df = pl.read_csv(archivo_csv.read(),  encoding='utf-8', null_values=[''])
        
        for index, row in enumerate(df.iter_rows(named=True)):
            try:
                proyecto_nombre_csv = str(row.get('proyecto_nombre', '')).strip().upper()
                if not proyecto_nombre_csv:
                    # Añade el error a la lista y continúa con la siguiente fila
                    errores.append(f"Fila {index + 2}: El campo 'proyecto_nombre' no puede estar vacío.")
                    continue 

                try:
                    proyecto = Proyecto.objects.get(nombre=proyecto_nombre_csv)
                except Proyecto.DoesNotExist:
                    errores.append(f"Fila {index + 2}: El proyecto '{proyecto_nombre_csv}' no existe.")
                    continue

                defaults = {
                    'valor_total': row['valor_total'], 
                    'moneda': str(row['moneda']).strip(), 
                    'estado': str(row['estado']).strip()
                }
                upe, creado = UPE.objects.update_or_create(
                    proyecto=proyecto, 
                    identificador=str(row['identificador']).strip(), 
                    defaults=defaults
                )
                
                if creado:
                    registros_creados += 1
                else:
                    registros_actualizados += 1
            
            except Exception as e:
                errores.append(f"Fila {index + 2}: Error inesperado - {str(e)}")

        # Después del bucle, si hay errores, los devolvemos todos juntos
        if errores:
            return Response({
                "mensaje": f"Importación completada con errores. Se procesaron {registros_creados + registros_actualizados} registros.",
                "errores": errores
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "mensaje": "Importación de UPEs completada.",
            "upes_creadas": registros_creados,
            "upes_actualizadas": registros_actualizados
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error crítico al leer el archivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def importar_contratos(request):
    """Importa o actualiza Contratos desde un CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    
    registros_creados, registros_actualizados = 0, 0
    errores = []

    try:
        df = pl.read_csv(archivo_csv.read(), encoding='utf-8', null_values=[''])

        for index, row in enumerate(df.iter_rows(named=True)):
            try:
                cliente_email = str(row.get('cliente_email', '')).strip().lower()
                if not cliente_email:
                    errores.append(f"Fila {index + 2}: El campo 'cliente_email' no puede estar vacío.")
                    continue

                try:
                    cliente = Cliente.objects.get(email=cliente_email)
                except Cliente.DoesNotExist:
                    errores.append(f"Fila {index + 2}: El cliente con email '{cliente_email}' no existe.")
                    continue

                proyecto_nombre = str(row.get('proyecto_nombre', '')).strip().upper()
                upe_identificador = str(row.get('upe_identificador', '')).strip()
                if not proyecto_nombre or not upe_identificador:
                    errores.append(f"Fila {index + 2}: 'proyecto_nombre' y 'upe_identificador' son obligatorios.")
                    continue

                try:
                    upe = UPE.objects.get(proyecto__nombre=proyecto_nombre, identificador=upe_identificador)
                except UPE.DoesNotExist:
                    errores.append(f"Fila {index + 2}: La UPE '{upe_identificador}' en el proyecto '{proyecto_nombre}' no existe.")
                    continue

                # ### LÓGICA CORREGIDA (AHORA DENTRO DEL BUCLE) ###
                fecha_obj = convertir_fecha_excel(row.get('fecha_venta'))
                if not fecha_obj:
                    errores.append(f"Fila {index + 2}: Formato de fecha inválido para '{row.get('fecha_venta')}'.")
                    continue

                defaults_data = {
                    'cliente': cliente,
                    'fecha_venta': fecha_obj,
                    'precio_final_pactado': row['contrato_precio_pactado'],
                    'moneda_pactada': str(row['moneda_pactada']).strip(),
                    'monto_enganche': row.get('monto_enganche', 0),
                    'numero_mensualidades': row.get('numero_mensualidades', 0),
                    'tasa_interes_mensual': row.get('tasa_interes_mensual', 0.0)
                }

                contrato, creado = Contrato.objects.update_or_create(
                    upe=upe,
                    defaults=defaults_data
                )

                if creado:
                    registros_creados += 1
                else:
                    registros_actualizados += 1
            
            except Exception as e:
                errores.append(f"Fila {index + 2}: Error inesperado - {str(e)}")

        if errores:
            return Response({
                "mensaje": f"Importación completada con errores. Se procesaron {registros_creados + registros_actualizados} registros.",
                "errores": errores
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "mensaje": "Importación de Contratos completada.",
            "contratos_creados": registros_creados,
            "contratos_actualizados": registros_actualizados
        }, status=status.HTTP_200_OK)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error crítico al leer el archivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def importar_pagos_historicos(request):
    """
    Importa un histórico de pagos desde un archivo CSV usando Polars.
    """
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)

    pagos_creados = 0
    errores = []
    try:
        # ### CAMBIO: Leemos el CSV con Polars ###
        # Polars lee el archivo en memoria, es más eficiente.
        df = pl.read_csv(archivo_csv.read(),  encoding='utf-8',
                         separator=',', null_values=[''])

        # ### CAMBIO: La forma de iterar es diferente y más limpia ###
        for index, row in enumerate(df.iter_rows(named=True)):
            try:
                contrato_id = row.get('CONTRATO_ID')
                if not contrato_id:
                    errores.append(f"Fila {index + 2}: Falta el CONTRATO_ID.")
                    continue

                contrato = Contrato.objects.get(id=int(contrato_id))

                pago_data = {
                    'contrato': contrato,
                    'monto_pagado': Decimal(row.get('monto_pagado', 0)),
                    'moneda_pagada': row.get('moneda_pagada'),
                    'tipo_cambio': Decimal(row.get('tipo_cambio', '1.0')),
                    'fecha_pago': datetime.strptime(row['fecha_pago'], '%d/%m/%Y').date(),
                    'concepto': row.get('concepto', 'ABONO'),
                    'instrumento_pago': row.get('instrumento_pago'),
                    'ordenante': row.get('ordenante'),
                    'banco_origen': row.get('banco_origen'),
                    'num_cuenta_origen': row.get('num_cuenta_origen'),
                    'banco_destino': row.get('banco_destino'),
                    'cuenta_beneficiaria': row.get('cuenta_beneficiaria'),
                    'comentarios': row.get('comentarios'),
                }

                fecha_ingreso_str = row.get('fecha_ingreso_cuentas')
                if fecha_ingreso_str:
                    pago_data['fecha_ingreso_cuentas'] = datetime.strptime(
                        fecha_ingreso_str, '%d/%m/%Y').date()

                Pago.objects.create(**pago_data)
                pagos_creados += 1

            except Contrato.DoesNotExist:
                errores.append(
                    f"Fila {index + 2}: El contrato con ID {contrato_id} no existe.")
            except Exception as e:
                errores.append(f"Fila {index + 2}: Error - {str(e)}")

        if errores:
            return Response({
                "mensaje": f"Importación completada con errores. Se crearon {pagos_creados} pagos.",
                "errores": errores
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({"mensaje": f"Importación exitosa. Se crearon {pagos_creados} pagos."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error crítico: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================================
# --- VISTAS PARA EXPORTACIÓN DE DATOS ---
# ==============================================================================


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_proyectos_excel(request):
    """
    Exporta un reporte de Proyectos a Excel con formato personalizado.
    """
    try:
        PROYECTO_COLUMNAS = {
            "id": "ID", "nombre": "Nombre",
            "descripcion": "Descripción", "activo": "Estado"
        }
        selected_cols = request.query_params.getlist(
            'cols', list(PROYECTO_COLUMNAS.keys()))

        # 1. Preparar los datos
        proyectos_qs = Proyecto.objects.all()

        proyectos_data = {PROYECTO_COLUMNAS[col]: [] for col in selected_cols}
        for p in proyectos_qs:
            if 'id' in selected_cols:
                proyectos_data[PROYECTO_COLUMNAS['id']].append(p.id)
            if 'nombre' in selected_cols:
                proyectos_data[PROYECTO_COLUMNAS['nombre']].append(p.nombre)
            if 'descripcion' in selected_cols:
                proyectos_data[PROYECTO_COLUMNAS['descripcion']].append(
                    p.descripcion)
            if 'activo' in selected_cols:
                # Lógica para cambiar Verdadero/Falso a texto
                proyectos_data[PROYECTO_COLUMNAS['activo']].append(
                    "Activo" if p.activo else "Inactivo")

        df_proyectos = pl.DataFrame(proyectos_data)

        # 2. Generar el archivo Excel
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Proyectos')

        logo_path = get_logo_path()

        try:
            worksheet.set_background(logo_path)
        except FileNotFoundError:
            print(f"ADVERTENCIA: No se encontró el logo en {logo_path}.")

        header_format = workbook.add_format(
            {'bold': True, 'bg_color': '#F0F0F0', 'border': 1})
        worksheet.write_row(0, 0, df_proyectos.columns, header_format)
        for i, row in enumerate(df_proyectos.iter_rows()):
            worksheet.write_row(i + 1, 0, row)

        _autoajustar_columnas_excel(worksheet, df_proyectos)
        workbook.close()
        output.seek(0)

        response = HttpResponse(
            output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="reporte_proyectos.xlsx"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el Excel: {e}", status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_clientes_excel(request):
    """Exporta un reporte de Clientes a Excel."""
    try:
        CLIENTE_COLUMNAS = {
            "id": "ID", "nombre_completo": "Nombre Completo", "email": "Email",
            "telefono": "Teléfono", "activo": "Estado"
        }
        selected_cols = request.query_params.getlist(
            'cols', list(CLIENTE_COLUMNAS.keys()))

        clientes_qs = Cliente.objects.all()
        # ### CORRECCIÓN: El nombre de la variable era incorrecto ###
        clientes_data = {CLIENTE_COLUMNAS[col]: [] for col in selected_cols}
        for c in clientes_qs:
            if 'id' in selected_cols:
                clientes_data[CLIENTE_COLUMNAS['id']].append(c.id)
            if 'nombre_completo' in selected_cols:
                clientes_data[CLIENTE_COLUMNAS['nombre_completo']].append(
                    c.nombre_completo)
            if 'email' in selected_cols:
                clientes_data[CLIENTE_COLUMNAS['email']].append(c.email)
            if 'telefono' in selected_cols:
                clientes_data[CLIENTE_COLUMNAS['telefono']].append(c.telefono)
            if 'activo' in selected_cols:
                clientes_data[CLIENTE_COLUMNAS['activo']].append(
                    "Activo" if c.activo else "Inactivo")

        df_clientes = pl.DataFrame(clientes_data)

        # 2. Generar el archivo Excel
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Clientes')

        logo_path = get_logo_path()

        try:
            worksheet.set_background(logo_path)
        except FileNotFoundError:
            print(f"ADVERTENCIA: No se encontró el logo en {logo_path}.")

        header_format = workbook.add_format(
            {'bold': True, 'bg_color': '#F0F0F0', 'border': 1})
        worksheet.write_row(0, 0, df_clientes.columns, header_format)

        for i, row in enumerate(df_clientes.iter_rows()):
            worksheet.write_row(i + 1, 0, row)

        _autoajustar_columnas_excel(worksheet, df_clientes)
        workbook.close()
        output.seek(0)

        # 3. Devolver la respuesta
        response = HttpResponse(
            output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="reporte_clientes.xlsx"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el Excel: {e}", status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_upes_excel(request):
    """
    Exporta un reporte de UPEs a Excel con formato personalizado.
    """
    try:
        UPE_COLUMNAS = {
            "id": "ID",
            "proyecto__nombre": "Proyecto",  # Campo relacionado
            "identificador": "Identificador",
            "valor_total": "Valor Total",
            "moneda": "Moneda",
            "estado": "Estado"
        }
        selected_cols = request.query_params.getlist(
            'cols', list(UPE_COLUMNAS.keys()))

        # 1. Obtenemos los objetos con 'select_related' para optimizar la consulta
        upes_qs = UPE.objects.select_related('proyecto').all()

        # 2. Construimos la lista de datos dinámicamente
        upes_data = {UPE_COLUMNAS[col]: [] for col in selected_cols}
        for upe in upes_qs:
            # ### LÓGICA COMPLETADA ###
            if 'id' in selected_cols:
                upes_data[UPE_COLUMNAS['id']].append(upe.id)
            if 'proyecto__nombre' in selected_cols:
                upes_data[UPE_COLUMNAS['proyecto__nombre']].append(
                    upe.proyecto.nombre)
            if 'identificador' in selected_cols:
                upes_data[UPE_COLUMNAS['identificador']].append(
                    upe.identificador)
            if 'valor_total' in selected_cols:
                upes_data[UPE_COLUMNAS['valor_total']].append(
                    float(upe.valor_total))
            if 'moneda' in selected_cols:
                upes_data[UPE_COLUMNAS['moneda']].append(upe.moneda)
            if 'estado' in selected_cols:
                upes_data[UPE_COLUMNAS['estado']].append(upe.estado)

        df_upes = pl.DataFrame(upes_data)

        # 3. Generar el archivo Excel (esta parte se queda igual)
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('UPEs')

        logo_path = get_logo_path()

        try:
            worksheet.set_background(logo_path)
        except FileNotFoundError:
            print(f"ADVERTENCIA: No se encontró el logo en {logo_path}.")

        header_format = workbook.add_format(
            {'bold': True, 'bg_color': '#F0F0F0', 'border': 1})
        money_format = workbook.add_format({'num_format': '$#,##0.00'})

        worksheet.write_row(0, 0, df_upes.columns, header_format)

        for i, row in enumerate(df_upes.iter_rows()):
            for j, value in enumerate(row):
                col_name = df_upes.columns[j]
                if 'Valor Total' in col_name:
                    worksheet.write_number(i + 1, j, value, money_format)
                else:
                    worksheet.write(i + 1, j, value)

        _autoajustar_columnas_excel(worksheet, df_upes)
        workbook.close()
        output.seek(0)

        # 4. Devolver la respuesta
        response = HttpResponse(
            output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="reporte_upes.xlsx"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el Excel: {e}", status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_contratos_excel(request):
    """
    Exporta un reporte de Contratos a Excel con formato personalizado.
    """
    try:
        CONTRATO_COLUMNAS = {
            "id": "ID Contrato",
            "cliente__nombre_completo": "Cliente",
            "upe__proyecto__nombre": "Proyecto",
            "upe__identificador": "UPE",
            "fecha_venta": "Fecha de Venta",
            "precio_final_pactado": "Precio Pactado",
            "moneda_pactada": "Moneda",
            "estado": "Estado"
        }
        selected_cols = request.query_params.getlist(
            'cols', list(CONTRATO_COLUMNAS.keys()))

        # 1. Obtenemos los objetos con 'select_related' para optimizar la consulta
        contratos_qs = Contrato.objects.select_related(
            'cliente', 'upe__proyecto').all()

        # 2. Construimos la lista de datos dinámicamente
        contratos_data = {CONTRATO_COLUMNAS[col]: [] for col in selected_cols}
        for c in contratos_qs:
            # ### LÓGICA COMPLETADA ###
            if 'id' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['id']].append(c.id)
            if 'cliente__nombre_completo' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['cliente__nombre_completo']].append(
                    c.cliente.nombre_completo)
            if 'upe__proyecto__nombre' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['upe__proyecto__nombre']].append(
                    c.upe.proyecto.nombre)
            if 'upe__identificador' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['upe__identificador']].append(
                    c.upe.identificador)
            if 'fecha_venta' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['fecha_venta']].append(
                    c.fecha_venta)
            if 'precio_final_pactado' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['precio_final_pactado']].append(
                    float(c.precio_final_pactado))
            if 'moneda_pactada' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['moneda_pactada']].append(
                    c.moneda_pactada)
            if 'estado' in selected_cols:
                contratos_data[CONTRATO_COLUMNAS['estado']].append(c.estado)

        df_contratos = pl.DataFrame(contratos_data)

        # 3. Generar el archivo Excel (esta parte se queda igual)
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Contratos')

        logo_path = get_logo_path()

        try:
            worksheet.set_background(logo_path)
        except FileNotFoundError:
            print(f"ADVERTENCIA: No se encontró el logo en {logo_path}.")

        header_format = workbook.add_format(
            {'bold': True, 'bg_color': '#F0F0F0', 'border': 1})
        date_format = workbook.add_format({'num_format': 'dd-mm-yyyy'})
        money_format = workbook.add_format({'num_format': '$#,##0.00'})

        worksheet.write_row(0, 0, df_contratos.columns, header_format)

        for i, row in enumerate(df_contratos.iter_rows()):
            for j, value in enumerate(row):
                col_name = df_contratos.columns[j]
                if 'Fecha' in col_name:
                    worksheet.write_datetime(i + 1, j, value, date_format)
                elif 'Precio' in col_name:
                    worksheet.write_number(i + 1, j, value, money_format)
                else:
                    worksheet.write(i + 1, j, value)

        _autoajustar_columnas_excel(worksheet, df_contratos)
        workbook.close()
        output.seek(0)

        # 4. Devolver la respuesta
        response = HttpResponse(
            output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="reporte_contratos.xlsx"'
        return response

    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el Excel: {e}", status=500)

# ==============================================================================
# --- VISTAS PARA GRÁFICAS ---
# ==============================================================================


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanViewDashboard])
def strategic_dashboard_data(request):
    """
    Calcula y devuelve todos los datos para el dashboard estratégico,
    con lógica de fechas inteligente para agrupar por periodo.
    """
    try:
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
    except locale.Error:
        print("ADVERTENCIA: El locale 'es_ES.UTF-8' no está instalado. Se usarán fechas en inglés.")
        
    project_ids_param = request.query_params.get('project_ids')
    timeframe = request.query_params.get('timeframe', 'month')
    morosidad_range = request.query_params.get('morosidad_range', '30')
    por_cobrar_range = request.query_params.get('por_cobrar_range', '30')
    today = date.today()

    if project_ids_param and project_ids_param != 'all':
        project_ids = [int(p) for p in project_ids_param.split(',') if p]
    else:
        project_ids = None

    # 1. Filtra los querysets base por proyecto
    pagos_base = Pago.objects.all()
    contratos_base = Contrato.objects.all()
    plan_pagos_base = PlanDePagos.objects.filter(pagado=False, contrato__estado='Activo')
    upe_queryset = UPE.objects.all()

    if project_ids:
        pagos_base = pagos_base.filter(contrato__upe__proyecto_id__in=project_ids)
        contratos_base = contratos_base.filter(upe__proyecto_id__in=project_ids)
        plan_pagos_base = plan_pagos_base.filter(contrato__upe__proyecto_id__in=project_ids)
        upe_queryset = upe_queryset.filter(proyecto_id__in=project_ids)

    # 2. Determina el rango de fechas global del dataset
    fechas_min = [
        pagos_base.aggregate(d=Min('fecha_pago'))['d'],
        contratos_base.aggregate(d=Min('fecha_venta'))['d'],
        plan_pagos_base.aggregate(d=Min('fecha_vencimiento'))['d'],
    ]
    fechas_max = [
        pagos_base.aggregate(d=Max('fecha_pago'))['d'],
        contratos_base.aggregate(d=Max('fecha_venta'))['d'],
        plan_pagos_base.aggregate(d=Max('fecha_vencimiento'))['d'],
    ]

    earliest_date = min([d for d in fechas_min if d] or [today])
    latest_date = max([d for d in fechas_max if d] or [today])

    if timeframe == 'year':
        trunc_func = TruncYear
        start_date = date(earliest_date.year, 1, 1)
        end_date = date(latest_date.year, 12, 31)
        labels = [str(y) for y in range(start_date.year, end_date.year + 1)]
        date_format = '%Y'
    elif timeframe == 'week':
        trunc_func = TruncWeek
        start_date = earliest_date - timedelta(days=earliest_date.weekday())
        end_date = latest_date + timedelta(days=6 - latest_date.weekday())
        labels = []
        current = start_date
        while current <= end_date:
            labels.append(f"{current.isocalendar().year}-W{current.isocalendar().week:02d}")
            current += timedelta(weeks=1)
        date_format = '%G-W%V'
    else:  # month
        trunc_func = TruncMonth
        start_date = date(earliest_date.year, earliest_date.month, 1)
        end_date = date(latest_date.year, latest_date.month, 1)
        labels = []
        current = start_date
        while current <= end_date:
            labels.append(current.strftime('%b %Y'))
            next_month = (current.replace(day=28) + timedelta(days=4)).replace(day=1)
            current = next_month
        date_format = '%b %Y'

    # 3. Calcula KPIs usando los querysets ya filtrados por proyecto
    valor_mxn_expression = Case(When(moneda_pagada='USD', then=F('monto_pagado') * F('tipo_cambio')), default=F('monto_pagado'), output_field=DecimalField())
    total_recuperado = pagos_base.aggregate(total=Sum(valor_mxn_expression))['total'] or 0
    total_ventas = contratos_base.aggregate(total=Sum('precio_final_pactado'))['total'] or 0
    total_programado = plan_pagos_base.aggregate(total=Sum('monto_programado'))['total'] or 0

    if morosidad_range == 'mas':
        vencido_filter = Q(fecha_vencimiento__lt=today - timedelta(days=90))
    else:
        dias = int(morosidad_range)
        vencido_filter = Q(fecha_vencimiento__lt=today - timedelta(days=dias))
    total_vencido = plan_pagos_base.filter(vencido_filter).aggregate(total=Sum('monto_programado'))['total'] or 0

    if por_cobrar_range == 'mas':
        cobrar_filter = Q(fecha_vencimiento__gt=today + timedelta(days=90))
    else:
        dias_pc = int(por_cobrar_range)
        cobrar_filter = Q(fecha_vencimiento__gt=today, fecha_vencimiento__lte=today + timedelta(days=dias_pc))
    total_por_cobrar = plan_pagos_base.filter(cobrar_filter).aggregate(total=Sum('monto_programado'))['total'] or 0

    # 4. Calcula datos para la gráfica, ahora filtrando por el rango de fechas
    recuperado_q = pagos_base.filter(fecha_pago__range=(start_date, end_date)).annotate(period=trunc_func('fecha_pago')).values('period').annotate(total=Sum(valor_mxn_expression))
    ventas_q = contratos_base.filter(fecha_venta__range=(start_date, end_date)).annotate(period=trunc_func('fecha_venta')).values('period').annotate(total=Sum('precio_final_pactado'))
    programado_q = plan_pagos_base.filter(fecha_vencimiento__range=(start_date, end_date)).annotate(period=trunc_func('fecha_vencimiento')).values('period').annotate(total=Sum('monto_programado'))
    
    # 5. Mapea los resultados a un diccionario para un acceso rápido
    recuperado_map = {item['period'].strftime(date_format): item['total'] for item in recuperado_q if item['period']}
    ventas_map = {item['period'].strftime(date_format): item['total'] for item in ventas_q if item['period']}
    programado_map = {item['period'].strftime(date_format): item['total'] for item in programado_q if item['period']}

    # 6. Construye los datasets finales usando la lista completa de etiquetas
    final_chart_data = {
        'labels': labels,
        'recuperado': [recuperado_map.get(label, 0) for label in labels],
        'ventas': [ventas_map.get(label, 0) for label in labels],
        'programado': [programado_map.get(label, 0) for label in labels],
        'vencido': [total_vencido] * len(labels)
    }

    # 7. Calcular datos de UPEs
    upe_status_data = upe_queryset.values('estado').annotate(total=Count('id')).order_by('-total')

    # 8. Construir la respuesta final
    return Response({
        'kpis': {
            'recuperado': total_recuperado,
            'ventas': total_ventas,
            'por_cobrar': total_por_cobrar,
            'vencido': total_vencido,
            'upes_total': upe_queryset.count(),
            'programado_total': total_programado,
        },
        'chart': final_chart_data,
        'upeStatus': {
            "labels": [item['estado'] for item in upe_status_data],
            "values": [item['total'] for item in upe_status_data]
        }
    })