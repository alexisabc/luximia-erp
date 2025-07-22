# backend/cxc/views.py

# ==============================================================================
# --- IMPORTS ---
# ==============================================================================
import traceback
from decimal import Decimal
from datetime import date, datetime
import os
import json
import polars as pl
import io
import xlsxwriter
from django.db import transaction
from django.db.models import Sum, F, Case, When, Value, DecimalField, Q, Count
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.contrib.auth.models import User, Group, Permission
from django.contrib.humanize.templatetags.humanize import intcomma
from django.utils import timezone
from django.conf import settings
from .pagination import CustomPagination
from openai import OpenAI
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from weasyprint import HTML
from .models import Proyecto, Cliente, UPE, Contrato, Pago, PlanDePagos, TipoDeCambio
from .serializers import (
    ProyectoSerializer, ClienteSerializer, UPESerializer, UPEReadSerializer,
    ContratoWriteSerializer, ContratoReadSerializer, PagoWriteSerializer, PagoReadSerializer,
    UserReadSerializer, UserWriteSerializer, GroupReadSerializer, GroupWriteSerializer,
    MyTokenObtainPairSerializer
)

# ==============================================================================
# --- VISTAS ---
# ==============================================================================


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.all().order_by('nombre')
    serializer_class = ProyectoSerializer
    pagination_class = CustomPagination

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        proyectos = self.get_queryset()
        serializer = self.get_serializer(proyectos, many=True)
        return Response(serializer.data)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.prefetch_related(
        'contratos__upe__proyecto').order_by('nombre_completo')
    serializer_class = ClienteSerializer
    pagination_class = CustomPagination


class UPEViewSet(viewsets.ModelViewSet):
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


class ContratoViewSet(viewsets.ModelViewSet):
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

    def perform_destroy(self, instance):
        contrato_afectado = instance.contrato
        instance.delete()
        contrato_afectado.actualizar_plan_de_pagos()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserWriteSerializer
        return UserReadSerializer

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        users = self.get_queryset()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('name')
    pagination_class = CustomPagination

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupWriteSerializer
        return GroupReadSerializer

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        groups = self.get_queryset()
        serializer = GroupReadSerializer(groups, many=True)
        return Response(serializer.data)


# ==============================================================================
# --- VISTAS PERSONALIZADAS (Endpoints Únicos) ---
# ==============================================================================

@api_view(['GET'])
def get_all_permissions(request):
    """Devuelve una lista de todos los permisos relevantes."""
    apps_a_excluir = ['admin', 'auth', 'contenttypes', 'sessions']
    permissions = Permission.objects.exclude(content_type__app_label__in=apps_a_excluir).order_by(
        'content_type__model').values('id', 'name', 'codename')
    return Response(permissions)


@api_view(['GET'])
def dashboard_stats(request):
    """Calcula y devuelve las estadísticas para el dashboard con la nueva lógica."""
    today = timezone.now().date()
    # KPIs de conteo
    proyectos_activos = Proyecto.objects.filter(activo=True).count()
    clientes_totales = Cliente.objects.count()
    upes_totales = UPE.objects.count()
    contratos_activos = Contrato.objects.filter(estado='Activo').count()

    # KPIs financieros
    total_pagado_query = Pago.objects.aggregate(total=Sum('monto_pagado'))
    total_pagado = total_pagado_query['total'] or 0
    total_contratado_query = Contrato.objects.filter(
        estado='Activo').aggregate(total=Sum('precio_final_pactado'))
    total_contratado = total_contratado_query['total'] or 0
    total_adeudado = total_contratado - total_pagado

    # Saldo vencido
    saldo_vencido_query = PlanDePagos.objects.filter(
        fecha_vencimiento__lt=today, pagado=False, contrato__estado='Activo').aggregate(total=Sum('monto_programado'))
    saldo_vencido = saldo_vencido_query['total'] or 0

    stats = {
        'proyectos_activos': proyectos_activos, 'clientes_totales': clientes_totales,
        'upes_totales': upes_totales, 'contratos_activos': contratos_activos,
        'total_adeudado': total_adeudado, 'saldo_vencido': saldo_vencido,
    }
    return Response(stats)


@api_view(['GET'])
def valor_por_proyecto_chart(request):
    """Calcula los datos para la gráfica de valor por proyecto."""
    # ### CORREGIDO: Se usa el campo 'tipo_cambio' correcto ###
    ultimo_pago_usd = Pago.objects.filter(
        moneda_pagada='USD').order_by('-fecha_pago').first()
    tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
        '17.50')

    chart_data = Contrato.objects.annotate(
        valor_en_mxn=Case(
            When(moneda_pactada='USD', then=F(
                'precio_final_pactado') * tipo_cambio_reciente),
            default=F('precio_final_pactado'),
            output_field=DecimalField()
        )
    ).values('upe__proyecto__nombre').annotate(total_contratado=Sum('valor_en_mxn')).order_by('-total_contratado')

    formatted_data = [{'label': item['upe__proyecto__nombre'],
                       'value': item['total_contratado']} for item in chart_data]
    return Response(formatted_data)


@api_view(['GET'])
def upe_status_chart(request):
    """Calcula el número de UPEs por cada estado."""
    query_data = UPE.objects.values('estado').annotate(
        total=Count('id')).order_by('-total')
    data = {
        "labels": [item['estado'] for item in query_data],
        "values": [item['total'] for item in query_data]
    }
    return Response(data)


@api_view(['GET'])
def generar_estado_de_cuenta_pdf(request, pk=None):
    """
    Genera un PDF del estado de cuenta para un contrato específico.
    """
    try:
        # ### CORRECCIÓN ###
        # Reemplazamos '...' con la consulta correcta al modelo Contrato.
        contrato = get_object_or_404(
            Contrato.objects.select_related(
                'cliente', 'upe__proyecto').prefetch_related('plan_de_pagos'),
            pk=pk
        )

        pagos_qs = Pago.objects.filter(
            contrato=contrato).order_by('fecha_pago', 'id')

        saldo_actual = contrato.precio_final_pactado
        pagos_con_saldo = []
        for pago in pagos_qs:
            saldo_actual -= pago.valor_mxn
            pagos_con_saldo.append({
                'pago': pago,
                'saldo_despues_del_pago': saldo_actual
            })

        serializer = ContratoReadSerializer(instance=contrato)
        datos_financieros = serializer.data

        context = {
            'contrato': contrato,
            'pagos_con_saldo': pagos_con_saldo,
            'plan_de_pagos': contrato.plan_de_pagos.all(),
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
        logo_path = os.path.join(
            settings.BASE_DIR, 'static', 'assets', 'logo-luximia.png')

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
            ws_plan.autofit()

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
            ws_historial.autofit()

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
# --- VISTAS PARA IMPORTACIÓN DE DATOS ---
# ==============================================================================


@api_view(['POST'])
@transaction.atomic
def importar_datos_masivos(request):
    """Importa todos los datos desde un único archivo CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        # LÍNEA CORREGIDA: Usamos pl.read_csv para leer el archivo en memoria
        df = pl.read_csv(archivo_csv.read(),
                         encoding='latin-1', null_values=[''])

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
                fecha_obj = datetime.strptime(
                    str(row['contrato_fecha_venta']), '%d/%m/%Y')

                # Preparamos los datos del contrato
                defaults_contrato = {
                    'cliente': cliente,
                    'fecha_venta': fecha_obj.strftime('%Y-%m-%d'),
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
@transaction.atomic
def importar_clientes(request):
    """Importa o actualiza clientes desde un CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response(...)
    try:
        # LÍNEA CORREGIDA
        df = pl.read_csv(archivo_csv.read(),
                         encoding='latin-1', null_values=[''])
        registros_creados, registros_actualizados = 0, 0

        # LÍNEA CORREGIDA
        for row in df.iter_rows(named=True):
            email = row.get('email')
            if not email:
                continue

            defaults_cliente = {
                'nombre_completo': str(row.get('nombre_completo', '')).strip(),
                'telefono': str(row.get('telefono', ''))
            }
            cliente, creado = Cliente.objects.update_or_create(
                email=email.strip().lower(), defaults=defaults_cliente)
            if creado:
                registros_creados += 1
            else:
                registros_actualizados += 1
        return Response({"mensaje": "Importación de clientes completada.", "clientes_creados": registros_creados, "clientes_actualizados": registros_actualizados}, status=status.HTTP_200_OK)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
def importar_upes(request):
    """Importa o actualiza UPEs desde un CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response(...)
    try:
        # LÍNEA CORREGIDA
        df = pl.read_csv(archivo_csv.read(),
                         encoding='latin-1', null_values=[''])
        registros_creados, registros_actualizados = 0, 0

        # LÍNEA CORREGIDA
        for index, row in enumerate(df.iter_rows(named=True)):
            proyecto_nombre_csv = str(
                row.get('proyecto_nombre', '')).strip().upper()
            if not proyecto_nombre_csv:
                raise Exception(
                    f"Fila {index + 2}: El campo 'proyecto_nombre' no puede estar vacío.")
            try:
                proyecto = Proyecto.objects.get(nombre=proyecto_nombre_csv)
            except Proyecto.DoesNotExist:
                raise Exception(
                    f"Fila {index + 2}: El proyecto '{proyecto_nombre_csv}' no existe en la base de datos.")
            upe, creado = UPE.objects.update_or_create(proyecto=proyecto, identificador=str(row['identificador']).strip(), defaults={
                                                       'valor_total': row['valor_total'], 'moneda': str(row['moneda']).strip(), 'estado': str(row['estado']).strip()})
            if creado:
                registros_creados += 1
            else:
                registros_actualizados += 1
        return Response({"mensaje": "Importación de UPEs completada.", "upes_creadas": registros_creados, "upes_actualizadas": registros_actualizados}, status=status.HTTP_200_OK)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@transaction.atomic
def importar_contratos(request):
    """Importa o actualiza Contratos desde un CSV usando Polars."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        # 1. Leemos el CSV con Polars. Usamos .read() para leer el archivo en memoria.
        df = pl.read_csv(archivo_csv.read(),
                         encoding='latin-1', null_values=[''])

        registros_creados, registros_actualizados = 0, 0

        # 2. Iteramos sobre las filas usando la sintaxis de Polars.
        for index, row in enumerate(df.iter_rows(named=True)):
            cliente_email = str(row.get('cliente_email', '')).strip().lower()
            if not cliente_email:
                raise Exception(
                    f"Fila {index + 2}: El campo 'cliente_email' no puede estar vacío.")

            try:
                cliente = Cliente.objects.get(email=cliente_email)
            except Cliente.DoesNotExist:
                raise Exception(
                    f"Fila {index + 2}: El cliente con email '{cliente_email}' no existe.")

            proyecto_nombre = str(
                row.get('proyecto_nombre', '')).strip().upper()
            upe_identificador = str(row.get('upe_identificador', '')).strip()
            if not proyecto_nombre or not upe_identificador:
                raise Exception(
                    f"Fila {index + 2}: 'proyecto_nombre' y 'upe_identificador' son obligatorios.")

            try:
                upe = UPE.objects.get(
                    proyecto__nombre=proyecto_nombre, identificador=upe_identificador)
            except UPE.DoesNotExist:
                raise Exception(
                    f"Fila {index + 2}: La UPE '{upe_identificador}' en el proyecto '{proyecto_nombre}' no existe.")

            fecha_obj = datetime.strptime(str(row['fecha_venta']), '%d/%m/%Y')

            defaults_data = {
                'cliente': cliente,
                'fecha_venta': fecha_obj.strftime('%Y-%m-%d'),
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

        return Response({
            "mensaje": "Importación de Contratos completada.",
            "contratos_creados": registros_creados,
            "contratos_actualizados": registros_actualizados
        }, status=status.HTTP_200_OK)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
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

        # ### CAMBIO ###: Ampliamos el prompt con la información de Proyecto y UPE
        system_prompt = """
        Eres un asistente experto en el CRM de Luximia. Tu trabajo es convertir la pregunta de un usuario en un objeto JSON para consultar la base de datos.
        El JSON debe tener la siguiente estructura: {"modelo": "nombre_del_modelo", "filtros": {}, "agregacion": "tipo_de_agregacion"}.
        
        Modelos disponibles: 'Contrato', 'Cliente', 'UPE', 'Proyecto'.
        Agregaciones disponibles: 'count' (contar resultados) o 'none' (listar resultados).
        
        Campos para filtrar en 'Contrato': cliente__nombre_completo__icontains, upe__identificador__iexact, upe__proyecto__nombre__icontains, upe__estado__iexact.
        Campos para filtrar en 'Cliente': nombre_completo__icontains, email__iexact.
        Campos para filtrar en 'UPE': identificador__iexact, proyecto__nombre__icontains, estado__iexact (Valores: 'Disponible', 'Vendida', 'Pagada', 'Bloqueada').
        Campos para filtrar en 'Proyecto': nombre__icontains, activo (Valores: true o false).

        Ejemplo 1: "cuantos contratos tiene el proyecto shark tower" -> {"modelo": "Contrato", "filtros": {"upe__proyecto__nombre__icontains": "shark tower"}, "agregacion": "count"}
        Ejemplo 2: "lista los clientes con el nombre javier" -> {"modelo": "Cliente", "filtros": {"nombre_completo__icontains": "javier"}, "agregacion": "none"}
        Ejemplo 3: "mostrar upes disponibles en nido" -> {"modelo": "UPE", "filtros": {"proyecto__nombre__icontains": "nido", "estado__iexact": "Disponible"}, "agregacion": "none"}
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

        else:
            return Response({"error": "Modelo no reconocido por la IA."}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error al procesar la consulta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def upe_status_chart(request):
    """
    Calcula el número de UPEs por cada estado para la gráfica de dona.
    """
    # Agrupamos por 'estado' y contamos cuántas hay en cada grupo
    query_data = UPE.objects.values('estado').annotate(
        total=Count('id')).order_by('-total')

    # Formateamos los datos para que Chart.js los entienda fácilmente
    data = {
        "labels": [item['estado'] for item in query_data],
        "values": [item['total'] for item in query_data]
    }
    return Response(data)


@api_view(['POST'])
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
        df = pl.read_csv(archivo_csv.read(), encoding='latin-1',
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


@api_view(['GET'])
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
