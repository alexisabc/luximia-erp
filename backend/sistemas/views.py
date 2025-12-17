from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from .models import (
    CategoriaEquipo, ModeloEquipo, ActivoIT, 
    AsignacionEquipo, DetalleAsignacion, MovimientoInventario
)
from .serializers import (
    CategoriaEquipoSerializer, ModeloEquipoSerializer, ActivoITSerializer, 
    AsignacionEquipoSerializer, MovimientoInventarioSerializer
)

# Utils for PDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

class CategoriaEquipoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEquipo.objects.all()
    serializer_class = CategoriaEquipoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ModeloEquipoViewSet(viewsets.ModelViewSet):
    queryset = ModeloEquipo.objects.all()
    serializer_class = ModeloEquipoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ActivoITViewSet(viewsets.ModelViewSet):
    queryset = ActivoIT.objects.all()
    serializer_class = ActivoITSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def disponibles(self, request):
        modelo_id = request.query_params.get('modelo')
        qs = self.queryset.filter(estado='DISPONIBLE')
        if modelo_id:
            qs = qs.filter(modelo_id=modelo_id)
        return Response(self.get_serializer(qs, many=True).data)

class AsignacionEquipoViewSet(viewsets.ModelViewSet):
    queryset = AsignacionEquipo.objects.all().order_by('-fecha_asignacion')
    serializer_class = AsignacionEquipoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        items = request.data.get('items', [])
        if not items:
            return Response({"detail": "Debe incluir items en la asignación"}, status=400)

        with transaction.atomic():
            asignacion = AsignacionEquipo.objects.create(
                empleado=data['empleado'],
                observaciones=data.get('observaciones', ''),
                creado_por=request.user
            )
            
            for item in items:
                # Caso A: Activo Serializado
                if item.get('activo_id'):
                    activo = get_object_or_404(ActivoIT, pk=item['activo_id'])
                    if activo.estado != 'DISPONIBLE':
                        raise ValueError(f"El activo {activo.numero_serie} no está disponible.")
                    
                    activo.estado = 'ASIGNADO'
                    activo.empleado_asignado = asignacion.empleado
                    activo.save()
                    
                    DetalleAsignacion.objects.create(
                        asignacion=asignacion,
                        activo=activo,
                        modelo=activo.modelo,
                        cantidad=1
                    )
                
                # Caso B: Consumible / No Serializado
                elif item.get('modelo_id'):
                    modelo = get_object_or_404(ModeloEquipo, pk=item['modelo_id'])
                    cantidad = int(item.get('cantidad', 1))
                    
                    if not modelo.es_inventariable:
                        if modelo.stock_actual_consumible < cantidad:
                             raise ValueError(f"Stock insuficiente para {modelo.nombre}.")
                        modelo.stock_actual_consumible -= cantidad
                        modelo.save()
                    
                    DetalleAsignacion.objects.create(
                        asignacion=asignacion,
                        modelo=modelo,
                        cantidad=cantidad
                    )

        return Response(AsignacionEquipoSerializer(asignacion).data, status=201)

    @decorators.action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """
        Genera PDF simple de Responsiva
        """
        asignacion = self.get_object()
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        w, h = letter
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, h - 50, "LUXIMIA ERP - CARTA RESPONSIVA")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, h - 80, f"Folio: {asignacion.id}")
        p.drawString(50, h - 100, f"Fecha: {asignacion.fecha_asignacion}")
        p.drawString(50, h - 120, f"Empleado: {asignacion.empleado.nombre_completo}")
        p.drawString(50, h - 140, f"Departamento: {asignacion.empleado.departamento.nombre if asignacion.empleado.departamento else 'N/A'}")

        p.drawString(50, h - 180, "Por medio de la presente recibo para mi resguardo y uso exclusivo de trabajo:")
        
        # Table Header
        y = h - 220
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "CANT")
        p.drawString(100, y, "DESCRIPCION")
        p.drawString(350, y, "SERIE / ID")
        p.drawString(480, y, "ESTADO")
        y -= 20
        p.line(50, y+15, 550, y+15)
        
        # Items
        p.setFont("Helvetica", 10)
        for det in asignacion.detalles.all():
            nombre = det.activo.modelo.nombre if det.activo else det.modelo.nombre
            serie = det.activo.numero_serie if det.activo else "N/A"
            cant = str(det.cantidad)
            
            p.drawString(50, y, cant)
            p.drawString(100, y, nombre[:45]) # Truncate info
            p.drawString(350, y, serie)
            p.drawString(480, y, "BUENO") # Hardcoded for new assignments
            y -= 20
            
            if y < 100:
                p.showPage()
                y = h - 50
        
        # Footer / Firms
        y_firmas = 150
        p.line(80, y_firmas, 250, y_firmas)
        p.line(350, y_firmas, 520, y_firmas)
        
        p.setFont("Helvetica", 9)
        p.drawCentredString(165, y_firmas - 15, asignacion.empleado.nombre_completo.upper())
        p.drawCentredString(165, y_firmas - 30, "RECIBE (EMPLEADO)")
        
        p.drawCentredString(435, y_firmas - 15, "SISTEMAS / ADMINISTRACION")
        p.drawCentredString(435, y_firmas - 30, "ENTREGA")
        
        p.setFont("Helvetica", 8)
        p.drawString(50, 50, "Nota: El usuario es responsable del cuidado del equipo y deberá notificar cualquier falla de inmediato.")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by('-created_at')
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Lógica para actualizar stocks al crear movimiento
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            mov = MovimientoInventario.objects.create(
                tipo=data['tipo'],
                modelo=data['modelo'],
                activo=data.get('activo'),
                cantidad=data['cantidad'],
                observaciones=data.get('observaciones', ''),
                usuario=request.user
            )

            # Si es consumible, mover stock
            if not mov.modelo.es_inventariable:
                mov.modelo.stock_actual_consumible += mov.cantidad
                mov.modelo.save()
            
            # Si es activo serializado, el movimiento es solo bitácora (el estado cambia en ActivoIT)
            # Podríamos añadir lógica para cambiar estado de Activo aquí si el tipo es BAJA
            if mov.activo and mov.tipo == 'BAJA':
                mov.activo.estado = 'BAJA'
                mov.activo.save()
            elif mov.activo and mov.tipo == 'GARANTIA_SALIDA':
                mov.activo.estado = 'GARANTIA'
                mov.activo.save()

        return Response(MovimientoInventarioSerializer(mov).data, status=201)
