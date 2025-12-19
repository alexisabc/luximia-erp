from rest_framework import viewsets, permissions, decorators, status
from rest_framework.response import Response
from django.db import transaction

from .models import ContraRecibo, ProgramacionPago, DetalleProgramacion
from .serializers import ContraReciboSerializer, ProgramacionPagoSerializer, DetalleProgramacionSerializer

class ContraReciboViewSet(viewsets.ModelViewSet):
    queryset = ContraRecibo.objects.all().order_by('-fecha_recepcion')
    serializer_class = ContraReciboSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @decorators.action(detail=True, methods=['post'], url_path='validar')
    def validar(self, request, pk=None):
        cr = self.get_object()
        if cr.estado != 'BORRADOR':
             return Response({"detail": "Solo borradores pueden ser validados"}, status=400)
        
        # Validaciones de negocio (XML vs Montos, etc) irían aquí
        
        cr.estado = 'VALIDADO'
        cr.save()
        
        # Trigger automático: Crear Póliza de Provisión (Gasto vs Proveedor)
        # self._generar_poliza_provision(cr)
        
        return Response({"detail": "ContraRecibo validado para pago"})
        
    def _generar_poliza_provision(self, cr):
        # Lógica para llamar al engine contable
        pass

class ProgramacionPagoViewSet(viewsets.ModelViewSet):
    queryset = ProgramacionPago.objects.all().order_by('-fecha_programada')
    serializer_class = ProgramacionPagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=True, methods=['post'], url_path='agregar-cr')
    def agregar_cr(self, request, pk=None):
        """Agrega un ContraRecibo a la programación."""
        prog = self.get_object()
        cr_id = request.data.get('contra_recibo_id')
        monto = request.data.get('monto')
        
        try:
            cr = ContraRecibo.objects.get(id=cr_id)
        except ContraRecibo.DoesNotExist:
            return Response({"detail": "CR no encontrado"}, status=404)
            
        if cr.estado not in ['VALIDADO', 'PAGADO_PARCIAL']:
            return Response({"detail": "CR no elegible para pago"}, status=400)

        # Crear detalle
        DetalleProgramacion.objects.create(
            programacion=prog,
            contra_recibo=cr,
            monto_a_pagar=monto or cr.saldo_pendiente # Default al saldo
        )
        
        # Actualizar estado CR a Programado? Depende de regla de negocio.
        # cr.estado = 'PROGRAMADO'
        # cr.save()
        
        self._recalcular_totales(prog)
        return Response({"detail": "Agregado"})

    @decorators.action(detail=True, methods=['post'], url_path='autorizar')
    def autorizar(self, request, pk=None):
        prog = self.get_object()
        prog.estado = 'AUTORIZADA'
        prog.autorizado_por = request.user
        prog.save()
        return Response({"detail": "Programación autorizada"})
        
    @decorators.action(detail=True, methods=['post'], url_path='generar-layout')
    def generar_layout(self, request, pk=None):
        """Genera TXT para banco."""
        # Factory dependiendo del banco
        return Response({"detail": "Layout generado (Simulación)"})

    def _recalcular_totales(self, prog):
        total = sum(d.monto_a_pagar for d in prog.detalles.all())
        prog.total_mxn = total # Simplificación mono-moneda por ahora
        prog.save()

class DetalleProgramacionViewSet(viewsets.ModelViewSet):
    queryset = DetalleProgramacion.objects.all()
    serializer_class = DetalleProgramacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        prog = instance.programacion
        instance.delete()
        # Recalcular totales parent
        pass # Implementar lógica similar a _recalcular_totales publico
