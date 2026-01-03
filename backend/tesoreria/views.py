from rest_framework import viewsets, status, permissions, decorators, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from .services.deuda_service import DeudaService
from .services.pago_service import PagoService
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import CuentaBancaria, MovimientoBancario, Egreso, ContraRecibo
from .serializers import (
    CuentaBancariaSerializer, MovimientoBancarioSerializer,
    DepositoCorteInputSerializer, ConciliacionInputSerializer,
    EgresoSerializer, ContraReciboSerializer
)
from .services.bancario_service import MovimientoBancarioService
from pos.models import Turno


class CuentaBancariaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de cuentas bancarias.
    """
    queryset = CuentaBancaria.objects.filter(activa=True).order_by('banco__nombre_corto', 'numero_cuenta')
    serializer_class = CuentaBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['banco', 'moneda', 'tipo_cuenta']
    search_fields = ['numero_cuenta', 'clabe']

    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación si tiene movimientos asociados."""
        cuenta = self.get_object()
        if cuenta.movimientos.exists():
            return Response(
                {'detail': 'No se puede eliminar una cuenta con movimientos registrados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class MovimientoBancarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para movimientos bancarios.
    Los movimientos son inmutables una vez creados.
    """
    queryset = MovimientoBancario.objects.all().order_by('-fecha', '-created_at')
    serializer_class = MovimientoBancarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['cuenta', 'tipo', 'conciliado', 'origen_tipo']
    search_fields = ['referencia', 'beneficiario', 'concepto']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
        
        return queryset

    @decorators.action(detail=False, methods=['post'], url_path='procesar-corte')
    def procesar_corte(self, request):
        """
        Procesa el depósito de un corte de caja del POS.
        POST /api/tesoreria/movimientos/procesar-corte/
        """
        serializer = DepositoCorteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        turno_id = serializer.validated_data['turno_id']
        cuenta_id = serializer.validated_data['cuenta_id']
        imagen_ficha = serializer.validated_data.get('imagen_ficha')
        
        try:
            movimiento = MovimientoBancarioService.procesar_corte_caja(
                turno_id=turno_id,
                cuenta_id=cuenta_id,
                usuario=request.user,
                imagen_ficha=imagen_ficha
            )
            
            return Response(
                {
                    'detail': 'Corte de caja procesado exitosamente',
                    'movimiento': MovimientoBancarioSerializer(movimiento).data
                },
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @decorators.action(detail=True, methods=['post'], url_path='conciliar')
    def conciliar(self, request, pk=None):
        """
        Marca un movimiento como conciliado.
        POST /api/tesoreria/movimientos/{id}/conciliar/
        """
        movimiento = self.get_object()
        
        if movimiento.conciliado:
            return Response(
                {'detail': 'Este movimiento ya está conciliado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ConciliacionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from django.utils import timezone
        
        movimiento.conciliado = True
        movimiento.fecha_conciliacion = serializer.validated_data.get('fecha_conciliacion') or timezone.now()
        movimiento.conciliado_por = request.user
        movimiento.save()
        
        return Response(
            {
                'detail': 'Movimiento conciliado exitosamente',
                'movimiento': MovimientoBancarioSerializer(movimiento).data
            }
        )


class TurnoPorRecolectarView(APIView):
    """
    Vista helper para obtener turnos de POS pendientes de depositar.
    GET /api/tesoreria/turnos-pendientes/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Obtener IDs de turnos que ya tienen movimiento bancario
        turnos_depositados = MovimientoBancario.objects.filter(
            origen_tipo='POS_TURNO'
        ).values_list('origen_id', flat=True)
        
        # Obtener turnos cerrados que NO están en la lista de depositados
        turnos_pendientes = Turno.objects.filter(
            estado='CERRADA'
        ).exclude(
            id__in=turnos_depositados
        ).select_related('caja', 'usuario').order_by('-fecha_cierre')
        
        # Serializar manualmente (o crear un TurnoSerializer si es necesario)
        data = []
        for turno in turnos_pendientes:
            data.append({
                'id': turno.id,
                'caja': turno.caja.nombre,
                'usuario': turno.usuario.username,
                'fecha_inicio': turno.fecha_inicio,
                'fecha_cierre': turno.fecha_cierre,
                'saldo_inicial': float(turno.saldo_inicial),
                'saldo_final_calculado': float(turno.saldo_final_calculado),
                'saldo_final_declarado': float(turno.saldo_final_declarado),
                'diferencia': float(turno.diferencia),
                'estado': turno.estado
            })
        
        return Response({
            'count': len(data),
            'results': data
        })


class EgresoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de egresos/pagos.
    """
    queryset = Egreso.objects.all().order_by('-fecha', '-id')
    serializer_class = EgresoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['cuenta_bancaria', 'estado', 'tipo']
    search_fields = ['folio', 'beneficiario', 'concepto', 'referencia']

    def perform_create(self, serializer):
        serializer.save(solicitado_por=self.request.user)


class ContraReciboViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de contra recibos (cuentas por pagar).
    """
    queryset = ContraRecibo.objects.all().order_by('-fecha_recepcion', '-id')
    serializer_class = ContraReciboSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['proveedor', 'estado', 'tipo']
    search_fields = ['folio', 'uuid']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
class DeudasView(APIView):
    """
    Vista para obtener resumen de deudas CXC/CXP.
    GET /api/tesoreria/deudas/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        empresa_id = request.user.empresa_id if hasattr(request.user, 'empresa_id') else 1
        cxp = DeudaService.get_cuentas_por_pagar(empresa_id)
        cxc = DeudaService.get_cuentas_por_cobrar(empresa_id)
        
        return Response({
            'cxc': {
                'total': cxc['total_cxc'],
                'items': [{
                    'id': v.id,
                    'folio': v.folio,
                    'cliente': v.cliente.nombre_completo if v.cliente else 'General',
                    'total': v.total,
                    'fecha': v.fecha
                } for v in cxc['ventas']]
            },
            'cxp': {
                'total': cxp['total_cxp'],
                'items': [{
                    'id': oc.id,
                    'folio': oc.folio,
                    'proveedor': str(oc.proveedor),
                    'total': oc.total,
                    'fecha': oc.fecha_solicitud
                } for oc in cxp['ordenes_compra']]
            }
        })

class RegistrarPagoView(APIView):
    """
    Vista para registrar pagos de clientes.
    POST /api/tesoreria/registrar-pago/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        venta_id = request.data.get('venta_id')
        monto = request.data.get('monto')
        cuenta_id = request.data.get('cuenta_id')
        referencia = request.data.get('referencia')
        
        if not all([venta_id, monto, cuenta_id]):
            return Response({'detail': 'venta_id, monto y cuenta_id son requeridos'}, status=400)
            
        try:
            mov = PagoService.registrar_pago_cliente(venta_id, monto, cuenta_id, referencia)
            return Response({
                'detail': 'Pago registrado exitosamente',
                'movimiento_id': mov.id
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=400)
