from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, F
from django.db import models
from django.http import HttpResponse
import openpyxl
from core.views import ExcelImportMixin

from .models import Proveedor, Insumo, OrdenCompra, DetalleOrdenCompra
from .serializers import (
    ProveedorSerializer, InsumoSerializer, 
    OrdenCompraSerializer, OrdenCompraCreateUpdateSerializer,
    DetalleOrdenCompraSerializer
)

from core.views import ExcelImportMixin
import openpyxl
from django.http import HttpResponse

class ProveedorViewSet(ExcelImportMixin, viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        show_inactive = self.request.query_params.get('show_inactive', 'false') == 'true'
        
        # SoftDeleteModel filtra por defecto. Si queremos inactivos (eliminados), 
        # necesitamos usar el manager que los incluye o filtrar explícitamente.
        # Asumiendo que 'objects' filtra, pero 'all_objects' incluye todo en SoftDeleteModel standard.
        # Si no existe all_objects, usamos active_objects o similar. 
        # Verificando implementación común en Django:
        if show_inactive and hasattr(Proveedor, 'all_objects'):
            queryset = Proveedor.all_objects.all()
        elif show_inactive:
            # Fallback si no hay manager específico, intentamos quitar el filtro default si es posible
            # O simplemente retornamos queryset tal cual si no estaba filtrado
            pass
            
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(razon_social__icontains=search) | 
                models.Q(nombre_comercial__icontains=search) |
                models.Q(rfc__icontains=search) |
                models.Q(email_contacto__icontains=search)
            )
            
        return queryset

    @decorators.action(detail=False, methods=['get'])
    def exportar(self, request):
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="proveedores.xlsx"'
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Proveedores"
        
        headers = ['ID', 'RFC', 'Razón Social', 'Nombre Comercial', 'Tipo', 'Email', 'Teléfono', 'Banco', 'Cuenta', 'CLABE', 'Días Crédito']
        ws.append(headers)
        
        # Usamos el mismo queryset filtrado para respetar búsquedas
        proveedores = self.filter_queryset(self.get_queryset())
        
        for p in proveedores:
            ws.append([
                p.id, p.rfc, p.razon_social, p.nombre_comercial, p.tipo_persona,
                p.email_contacto, p.telefono,
                p.banco_nombre, p.cuenta, p.clabe, p.dias_credito
            ])
            
        wb.save(response)
        return response

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrdenCompraViewSet(viewsets.ModelViewSet):
    queryset = OrdenCompra.objects.all().order_by('-id')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrdenCompraCreateUpdateSerializer
        return OrdenCompraSerializer

    def perform_create(self, serializer):
        serializer.save(solicitante=self.request.user)

    @decorators.action(detail=True, methods=['post'], url_path='solicitar-vobo')
    def solicitar_vobo(self, request, pk=None):
        oc = self.get_object()
        if oc.estado != 'BORRADOR':
            return Response({"detail": "Solo borradores pueden solicitar VoBo"}, status=400)
        
        # Validar que tenga detalles
        if not oc.detalles.exists():
             return Response({"detail": "La orden no tiene insumos"}, status=400)
             
        oc.estado = 'PENDIENTE_VOBO'
        oc.save()
        return Response({"detail": "Solicitud de VoBo enviada"})

    @decorators.action(detail=True, methods=['post'], url_path='dar-vobo')
    def dar_vobo(self, request, pk=None):
        oc = self.get_object()
        # TODO: Check permission 'compras.dar_vobo'
        
        if oc.estado != 'PENDIENTE_VOBO':
            return Response({"detail": "La orden no está esperando VoBo"}, status=400)
            
        oc.estado = 'PENDIENTE_AUTORIZACION'
        oc.vobo_por = request.user
        oc.vobo_fecha = timezone.now()
        oc.save()
        return Response({"detail": "VoBo otorgado. Pendiente de Autorización Final"})

    @decorators.action(detail=True, methods=['post'], url_path='autorizar')
    def autorizar(self, request, pk=None):
        oc = self.get_object()
        # TODO: Check permission 'compras.autorizar_oc'
        
        if oc.estado != 'PENDIENTE_AUTORIZACION':
             return Response({"detail": "La orden no está lista para autorización final"}, status=400)
             
        oc.estado = 'AUTORIZADA'
        oc.autorizado_por = request.user
        oc.autorizado_fecha = timezone.now()
        oc.save()
        return Response({"detail": "Orden de Compra Autorizada exitosamente"})

    @decorators.action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        motivo = request.data.get('motivo')
        if not motivo:
            return Response({"detail": "Se requiere motivo de rechazo"}, status=400)
            
        oc = self.get_object()
        oc.estado = 'RECHAZADA'
        oc.rechazado_por = request.user
        oc.motivo_rechazo = motivo
        oc.save()
        return Response({"detail": "Orden rechazada"})

class DetalleOrdenCompraViewSet(viewsets.ModelViewSet):
    queryset = DetalleOrdenCompra.objects.all()
    serializer_class = DetalleOrdenCompraSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        detalle = serializer.save()
        self._actualizar_totales(detalle.orden)
        
    def perform_update(self, serializer):
        detalle = serializer.save()
        self._actualizar_totales(detalle.orden)
        
    def perform_destroy(self, instance):
        orden = instance.orden
        instance.delete()
        self._actualizar_totales(orden)

    def _actualizar_totales(self, orden):
        # Recalcular totales de la cabecera
        detalles = orden.detalles.all()
        subtotal = sum(d.importe for d in detalles)
        # Simplificación IVA: ASumimos cada linea ya tiene su calculo o lo hacemos global.
        # En el modelo DetalleOC, importe = (cant*precio)-desc. 
        # El impuesto_tasa está a nivel linea.
        
        iva_total = sum(d.importe * d.impuesto_tasa for d in detalles)
        total = subtotal + iva_total
        
        orden.subtotal = subtotal
        orden.iva = iva_total
        orden.total = total
        orden.save()
