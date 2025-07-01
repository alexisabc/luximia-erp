# backend/cxc/views.py

# ==============================================================================
# --- IMPORTS ---
# ==============================================================================

# --- Django & Python Core ---
import traceback
from decimal import Decimal
from datetime import datetime
import os
import json  # <-- 1. AÑADIDO: Importación necesaria
from django.db import transaction
from django.db.models import Sum, F, Case, When, Value, DecimalField, Q, Count
from django.db.models.functions import Coalesce
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.contrib.auth.models import User, Group, Permission
from django.contrib.humanize.templatetags.humanize import intcomma

# --- Librerías Externas ---
import pandas as pd
from weasyprint import HTML
from openai import OpenAI
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

# --- Serializers y Modelos Locales ---
from .models import Proyecto, Cliente, UPE, Contrato, Pago
from .serializers import (
    ProyectoSerializer,
    ClienteSerializer,
    UPESerializer, UPEReadSerializer,
    ContratoWriteSerializer, ContratoReadSerializer,
    PagoWriteSerializer, PagoReadSerializer,
    UserReadSerializer, UserWriteSerializer,
    GroupReadSerializer, GroupWriteSerializer,
    MyTokenObtainPairSerializer
)



# ==============================================================================
# --- VISTAS DE AUTENTICACIÓN ---
# ==============================================================================

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login personalizada que devuelve un token JWT con información extra.
    """
    serializer_class = MyTokenObtainPairSerializer


# ==============================================================================
# --- VIEWSETS PARA MODELOS PRINCIPALES (CRUD) ---
# ==============================================================================

class ProyectoViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para el modelo Proyecto."""
    queryset = Proyecto.objects.all().order_by('nombre')
    serializer_class = ProyectoSerializer

    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        """Endpoint para obtener TODOS los proyectos sin paginación."""
        proyectos = self.get_queryset()
        serializer = self.get_serializer(proyectos, many=True)
        return Response(serializer.data)


class ClienteViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para el modelo Cliente."""
    queryset = Cliente.objects.all().order_by('nombre_completo')
    serializer_class = ClienteSerializer


class UPEViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para el modelo UPE."""
    # El queryset de UPEViewSet DEBE ser optimizado también
    queryset = UPE.objects.select_related('proyecto').all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return UPEReadSerializer
        return UPESerializer

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        upes_disponibles = UPE.objects.select_related(
            'proyecto').filter(estado='Disponible')
        serializer = UPEReadSerializer(upes_disponibles, many=True)
        return Response(serializer.data)


class ContratoViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para el modelo Contrato."""
    queryset = Contrato.objects.select_related(
        'cliente', 'upe__proyecto').prefetch_related('pagos').all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ContratoWriteSerializer
        return ContratoReadSerializer

    @action(detail=True, methods=['get'])
    def pagos(self, request, pk=None):
        contrato = self.get_object()
        pagos_del_contrato = Pago.objects.filter(
            contrato=contrato).order_by('fecha_pago')
        serializer = PagoReadSerializer(pagos_del_contrato, many=True)
        return Response(serializer.data)



class PagoViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para el modelo Pago."""
    queryset = Pago.objects.all().order_by('-fecha_pago')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PagoWriteSerializer
        return PagoReadSerializer


# ==============================================================================
# --- VIEWSETS PARA USUARIOS Y ROLES ---
# ==============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para los Usuarios del sistema."""
    queryset = User.objects.all().order_by('-date_joined')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserWriteSerializer
        return UserReadSerializer

    # ### NUEVA ACCIÓN ###
    # Esto crea el endpoint /api/users/all/ que no tiene paginación.
    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        """Devuelve todos los usuarios sin paginación."""
        users = self.get_queryset()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class GroupViewSet(viewsets.ModelViewSet):
    """Gestiona las operaciones CRUD para los Grupos (Roles)."""
    queryset = Group.objects.all().order_by('name')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupWriteSerializer
        return GroupReadSerializer

    # ### NUEVA ACCIÓN ###
    # Esto crea el endpoint /api/groups/all/ que no tiene paginación.
    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        """Devuelve todos los grupos sin paginación."""
        groups = self.get_queryset()
        # Es importante usar el serializer de LECTURA aquí
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
    """Calcula y devuelve las estadísticas para el dashboard."""
    proyectos_activos = Proyecto.objects.filter(activo=True).count()
    clientes_totales = Cliente.objects.count()
    ultimo_pago_usd = Pago.objects.filter(
        moneda_pagada='USD').order_by('-fecha_pago').first()
    tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
        '20.0')
    total_contratos_mxn = Contrato.objects.filter(moneda_pactada='MXN').aggregate(
        total=Coalesce(Sum('precio_final_pactado'), Value(0), output_field=DecimalField()))['total']
    total_contratos_usd = Contrato.objects.filter(moneda_pactada='USD').aggregate(
        total=Coalesce(Sum('precio_final_pactado'), Value(0), output_field=DecimalField()))['total']
    valor_total_aproximado_mxn = total_contratos_mxn + \
        (total_contratos_usd * tipo_cambio_reciente)
    stats = {'proyectos_activos': proyectos_activos, 'clientes_totales': clientes_totales,
             'valor_total_contratos_mxn': valor_total_aproximado_mxn}
    return Response(stats)


@api_view(['GET'])
def valor_por_proyecto_chart(request):
    """Calcula y devuelve los datos para la gráfica de valor por proyecto."""
    ultimo_pago_usd = Pago.objects.filter(
        moneda_pagada='USD').order_by('-fecha_pago').first()
    tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
        '20.0')
    chart_data = Contrato.objects.annotate(valor_en_mxn=Case(When(moneda_pactada='USD', then=F('precio_final_pactado') * tipo_cambio_reciente), default=F(
        'precio_final_pactado'), output_field=DecimalField())).values('upe__proyecto__nombre').annotate(total_contratado=Sum('valor_en_mxn')).order_by('-total_contratado')
    formatted_data = [{'label': item['upe__proyecto__nombre'],
                       'value': item['total_contratado']} for item in chart_data]
    return Response(formatted_data)


@api_view(['GET'])
def generar_estado_de_cuenta_pdf(request, pk=None):
    """Genera un PDF del estado de cuenta para un contrato específico."""
    try:
        contrato = get_object_or_404(
            Contrato.objects.select_related('cliente', 'upe__proyecto'), pk=pk)
        pagos = Pago.objects.filter(contrato=contrato).order_by('fecha_pago')
        ultimo_pago_usd = Pago.objects.filter(
            moneda_pagada='USD').order_by('-fecha_pago').first()
        tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
            '20.0')
        precio_contrato = contrato.precio_final_pactado or Decimal('0.0')
        valor_contrato_en_mxn = precio_contrato
        if contrato.moneda_pactada == 'USD':
            valor_contrato_en_mxn = precio_contrato * tipo_cambio_reciente
        total_pagado_mxn = sum(p.monto_en_mxn for p in pagos)
        saldo_pendiente_mxn = valor_contrato_en_mxn - total_pagado_mxn
        valor_contrato_formateado = f"$ {intcomma(round(precio_contrato, 2))} {contrato.get_moneda_pactada_display()}"
        context = {'contrato': contrato, 'pagos': pagos, 'total_pagado_mxn': total_pagado_mxn,
                   'saldo_pendiente_mxn': saldo_pendiente_mxn, 'valor_contrato_string': valor_contrato_formateado}
        html_string = render_to_string(
            'api/estado_de_cuenta.html', context, request=request)
        html = HTML(string=html_string)
        pdf = html.write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response[
            'Content-Disposition'] = f'attachment; filename="estado_de_cuenta_contrato_{contrato.id}.pdf"'
        return response
    except Exception as e:
        traceback.print_exc()
        return HttpResponse(f"Ocurrió un error al generar el PDF: {e}", status=500)


# ==============================================================================
# --- VISTAS PARA IMPORTACIÓN DE DATOS ---
# ==============================================================================

@api_view(['POST'])
@transaction.atomic
def importar_datos_masivos(request):
    """Importa todos los datos desde un único archivo CSV."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        df = pd.read_csv(archivo_csv, encoding='latin-1')
        df = df.where(pd.notna(df), None)
        registros_creados = {'proyectos': 0,
                             'clientes': 0, 'upes': 0, 'contratos': 0}
        registros_actualizados = {'proyectos': 0,
                                  'clientes': 0, 'upes': 0, 'contratos': 0}
        for _, row in df.iterrows():
            if pd.isna(row.get('proyecto_nombre')):
                continue
            proyecto, creado = Proyecto.objects.update_or_create(
                nombre=row['proyecto_nombre'].strip().upper(), defaults={})
            if creado:
                registros_creados['proyectos'] += 1
            else:
                registros_actualizados['proyectos'] += 1
            cliente = None
            if row.get('cliente_email') and str(row.get('cliente_email')).strip():
                cliente, creado = Cliente.objects.update_or_create(email=str(row.get('cliente_email')).strip().lower(), defaults={
                                                                   'nombre_completo': str(row.get('cliente_nombre', '')).strip(), 'telefono': str(row.get('cliente_telefono', ''))})
                if creado:
                    registros_creados['clientes'] += 1
                else:
                    registros_actualizados['clientes'] += 1
            upe, creado = UPE.objects.update_or_create(proyecto=proyecto, identificador=str(row['upe_identificador']).strip(), defaults={
                                                       'valor_total': row['upe_valor_total'], 'moneda': str(row['upe_moneda']).strip(), 'estado': str(row['upe_estado']).strip()})
            if creado:
                registros_creados['upes'] += 1
            else:
                registros_actualizados['upes'] += 1
            if cliente and row.get('contrato_fecha_venta'):
                fecha_obj = datetime.strptime(
                    str(row['contrato_fecha_venta']), '%d/%m/%Y')
                fecha_formateada = fecha_obj.strftime('%Y-%m-%d')
                contrato, creado = Contrato.objects.update_or_create(upe=upe, defaults={
                                                                     'cliente': cliente, 'fecha_venta': fecha_formateada, 'precio_final_pactado': row['contrato_precio_pactado'], 'moneda_pactada': row['contrato_moneda']})
                if creado:
                    registros_creados['contratos'] += 1
                else:
                    registros_actualizados['contratos'] += 1
        return Response({"mensaje": "Importación completada.", "registros_creados": registros_creados, "registros_actualizados": registros_actualizados}, status=status.HTTP_200_OK)
    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@transaction.atomic
def importar_clientes(request):
    """Importa o actualiza clientes desde un CSV."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        df = pd.read_csv(archivo_csv, encoding='latin-1')
        df = df.where(pd.notna(df), None)
        registros_creados, registros_actualizados = 0, 0
        for _, row in df.iterrows():
            email = str(row.get('email', '')).strip().lower()
            if not email:
                continue
            cliente, creado = Cliente.objects.update_or_create(email=email, defaults={'nombre_completo': str(
                row.get('nombre_completo', '')).strip(), 'telefono': str(row.get('telefono', ''))})
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
    """Importa o actualiza UPEs desde un CSV."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        df = pd.read_csv(archivo_csv, encoding='latin-1')
        df = df.where(pd.notna(df), None)
        registros_creados, registros_actualizados = 0, 0
        for index, row in df.iterrows():
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
    """Importa o actualiza Contratos desde un CSV."""
    archivo_csv = request.FILES.get('file')
    if not archivo_csv:
        return Response({"error": "No se proporcionó ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        df = pd.read_csv(archivo_csv, encoding='latin-1')
        df = df.where(pd.notna(df), None)
        registros_creados, registros_actualizados = 0, 0
        for index, row in df.iterrows():
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
            fecha_formateada = fecha_obj.strftime('%Y-%m-%d')
            contrato, creado = Contrato.objects.update_or_create(upe=upe, defaults={
                                                                 'cliente': cliente, 'fecha_venta': fecha_formateada, 'precio_final_pactado': row['contrato_precio_pactado'], 'moneda_pactada': str(row['moneda_pactada']).strip()})
            if creado:
                registros_creados += 1
            else:
                registros_actualizados += 1
        return Response({"mensaje": "Importación de Contratos completada.", "contratos_creados": registros_creados, "contratos_actualizados": registros_actualizados}, status=status.HTTP_200_OK)
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
