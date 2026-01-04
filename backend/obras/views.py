from django.http import HttpResponse
from core.services.pdf_service import PDFService
from rest_framework import viewsets, decorators, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import (
    Obra, CentroCosto, ActividadProyecto, 
    DependenciaActividad, AsignacionRecurso, OrdenCambio
)
from .serializers import (
    ObraSerializer, CentroCostoSerializer, 
    ActividadProyectoSerializer, DependenciaActividadSerializer,
    AsignacionRecursoSerializer, OrdenCambioSerializer
)
from core.services.config_service import ConfigService
from .services.scheduling_service import SchedulingService
from .services.cost_control_service import CostControlService
from .services.change_service import ChangeManagementService
from .services.closure_service import ClosureService

class ObraViewSet(viewsets.ModelViewSet):
    queryset = Obra.objects.all()
    serializer_class = ObraSerializer
    filterset_fields = ['activo', 'estado']

    def get_queryset(self):
        if not ConfigService.is_feature_enabled('MODULE_OBRAS'):
             raise PermissionDenied("Módulo de Obras inactivo")
        return super().get_queryset()

    @decorators.action(detail=True, methods=['get'], url_path='evm-metrics')
    def get_evm_metrics(self, request, pk=None):
        metrics = CostControlService.get_evm_metrics(pk)
        return Response(metrics)

    @decorators.action(detail=True, methods=['get'], url_path='closure-report')
    def get_closure_report(self, request, pk=None):
        profitability = ClosureService.get_final_profitability(pk)
        retentions = ClosureService.get_retention_summary(pk)
        return Response({
            "profitability": profitability,
            "retentions": retentions
        })

    @decorators.action(detail=True, methods=['get'], url_path='closure-pdf')
    def get_closure_pdf(self, request, pk=None):
        obra = self.get_object()
        profitability = ClosureService.get_final_profitability(pk)
        retentions = ClosureService.get_retention_summary(pk)
        
        context = {
            'profitability': profitability,
            'retentions': retentions,
            'obra_codigo': obra.codigo,
            'obra_estado': obra.get_estado_display()
        }
        
        pdf_bytes = PDFService.generate_pdf('reports/closure_report.html', context)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Cierre_{obra.codigo}.pdf"'
        return response

    @decorators.action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_obra(self, request, pk=None):
        try:
            obra = ClosureService.cerrar_obra(pk, request.user.id)
            return Response(self.get_serializer(obra).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['post'], url_path='liquidar-retenciones')
    def liquidar_retenciones(self, request, pk=None):
        cuenta_id = request.data.get('cuenta_id')
        if not cuenta_id:
            return Response({"detail": "cuenta_id es requerido"}, status=400)
            
        try:
            egreso = ClosureService.liquidar_fondo_garantia(pk, cuenta_id, request.user.id)
            return Response({"detail": f"Egreso de liquidación creado: {egreso.folio}"})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = CentroCosto.objects.all()
    serializer_class = CentroCostoSerializer
    filterset_fields = ['obra', 'nivel', 'es_hoja', 'padre']

class ActividadProyectoViewSet(viewsets.ModelViewSet):
    queryset = ActividadProyecto.objects.all()
    serializer_class = ActividadProyectoSerializer
    filterset_fields = ['obra', 'es_critica', 'estado']

class DependenciaActividadViewSet(viewsets.ModelViewSet):
    queryset = DependenciaActividad.objects.all()
    serializer_class = DependenciaActividadSerializer

class AsignacionRecursoViewSet(viewsets.ModelViewSet):
    queryset = AsignacionRecurso.objects.all()
    serializer_class = AsignacionRecursoSerializer
    filterset_fields = ['actividad', 'tipo_recurso', 'actividad__obra']

class OrdenCambioViewSet(viewsets.ModelViewSet):
    queryset = OrdenCambio.objects.all()
    serializer_class = OrdenCambioSerializer
    filterset_fields = ['obra', 'estado', 'tipo']

    def perform_create(self, serializer):
        serializer.save(solicitado_por=self.request.user)

    @decorators.action(detail=True, methods=['post'], url_path='autorizar')
    def autorizar(self, request, pk=None):
        try:
            orden = ChangeManagementService.autorizar_orden_cambio(pk, request.user.id)
            return Response(self.get_serializer(orden).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        try:
            orden = ChangeManagementService.rechazar_orden_cambio(pk, request.user.id)
            return Response(self.get_serializer(orden).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
