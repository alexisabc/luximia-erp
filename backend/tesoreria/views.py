import logging
from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q
from decimal import Decimal

logger = logging.getLogger(__name__)


from .models import (
    ContraRecibo, ProgramacionPago, DetalleProgramacion,
    CuentaBancaria, CajaChica, MovimientoCaja, Egreso
)
from .serializers import (
    ContraReciboSerializer, ProgramacionPagoSerializer, DetalleProgramacionSerializer,
    CuentaBancariaSerializer, CajaChicaSerializer, MovimientoCajaSerializer,
    EgresoSerializer, EgresoCreateSerializer
)

from .services.payment_service import PaymentService

class ContraReciboViewSet(viewsets.ModelViewSet):
    queryset = ContraRecibo.objects.all().order_by('-id')
    

    serializer_class = ContraReciboSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        proveedor_id = self.request.query_params.get('proveedor')
        pendientes = self.request.query_params.get('pendientes')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        if pendientes == 'true':
            queryset = queryset.filter(saldo_pendiente__gt=0)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    @decorators.action(detail=True, methods=['post'])
    def validar(self, request, pk=None):
        """Marca el ContraRecibo como validado y listo para pago"""
        contra_recibo = self.get_object()
        
        if contra_recibo.estado != 'BORRADOR':
            return Response(
                {"detail": "Solo se pueden validar contrarecibos en borrador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contra_recibo.estado = 'VALIDADO'
        contra_recibo.save()
        
        return Response({"detail": "ContraRecibo validado exitosamente"})


class ProgramacionPagoViewSet(viewsets.ModelViewSet):
    queryset = ProgramacionPago.objects.all().order_by('-fecha_programada')
    serializer_class = ProgramacionPagoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @decorators.action(detail=True, methods=['post'])
    def autorizar(self, request, pk=None):
        """Autoriza una programación de pago"""
        if not request.user.has_perm('tesoreria.autorizar_egreso'):
            return Response(
                {"detail": "No tienes permiso para autorizar pagos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        programacion = self.get_object()
        
        if programacion.estado != 'BORRADOR':
            return Response(
                {"detail": "Solo se pueden autorizar programaciones en borrador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        programacion.estado = 'AUTORIZADA'
        programacion.autorizado_por = request.user
        programacion.save()
        
        return Response({"detail": "Programación autorizada exitosamente"})
    
    @decorators.action(detail=True, methods=['post'])
    def generar_layout(self, request, pk=None):
        """Genera el archivo de layout bancario para dispersión"""
        programacion = self.get_object()
        
        if programacion.estado != 'AUTORIZADA':
            return Response(
                {"detail": "La programación debe estar autorizada"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implementar generación de layout según banco
        # Por ahora solo cambiamos el estado
        programacion.estado = 'PROCESADA'
        programacion.save()
        
        return Response({"detail": "Layout generado (mock)"})


class CuentaBancariaViewSet(viewsets.ModelViewSet):
    queryset = CuentaBancaria.objects.all().order_by('-es_principal', 'banco__nombre_corto')
    serializer_class = CuentaBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        activa = self.request.query_params.get('activa')
        empresa_id = self.request.query_params.get('empresa')
        
        if activa is not None:
            queryset = queryset.filter(activa=activa.lower() == 'true')
        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        
        return queryset
    
    @decorators.action(detail=True, methods=['post'])
    def conciliar(self, request, pk=None):
        """Actualiza el saldo bancario para conciliación"""
        if not request.user.has_perm('tesoreria.conciliar_banco'):
            return Response(
                {"detail": "No tienes permiso para conciliar cuentas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuenta = self.get_object()
        saldo_bancario = request.data.get('saldo_bancario')
        
        if saldo_bancario is None:
            return Response(
                {"detail": "Se requiere el saldo bancario"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cuenta.saldo_bancario = Decimal(saldo_bancario)
        cuenta.save()
        
        diferencia = cuenta.saldo_actual - cuenta.saldo_bancario
        
        return Response({
            "detail": "Saldo bancario actualizado",
            "saldo_sistema": cuenta.saldo_actual,
            "saldo_bancario": cuenta.saldo_bancario,
            "diferencia": diferencia
        })


class CajaChicaViewSet(viewsets.ModelViewSet):
    queryset = CajaChica.objects.all().order_by('-fecha_apertura')
    serializer_class = CajaChicaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        responsable_id = self.request.query_params.get('responsable')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if responsable_id:
            queryset = queryset.filter(responsable_id=responsable_id)
        
        return queryset
    
    @decorators.action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Cierra una caja chica"""
        if not request.user.has_perm('tesoreria.cerrar_caja'):
            return Response(
                {"detail": "No tienes permiso para cerrar cajas"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        caja = self.get_object()
        
        if caja.estado != 'ABIERTA':
            return Response(
                {"detail": "La caja ya está cerrada"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        caja.estado = 'CERRADA'
        caja.fecha_cierre = timezone.now().date()
        caja.save()
        
        return Response({
            "detail": "Caja cerrada exitosamente",
            "saldo_final": caja.saldo_actual
        })
    
    @decorators.action(detail=True, methods=['post'])
    def reembolsar(self, request, pk=None):
        """Marca la caja como reembolsada y restaura el fondo"""
        caja = self.get_object()
        
        if caja.estado != 'CERRADA':
            return Response(
                {"detail": "La caja debe estar cerrada para reembolsar"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear movimiento de reembolso
        monto_reembolso = caja.monto_fondo - caja.saldo_actual
        
        if monto_reembolso > 0:
            MovimientoCaja.objects.create(
                caja=caja,
                tipo='REEMBOLSO',
                concepto=f"Reembolso de caja {caja.nombre}",
                monto=monto_reembolso,
                registrado_por=request.user
            )
            
            caja.saldo_actual = caja.monto_fondo
        
        caja.estado = 'REEMBOLSADA'
        caja.save()
        
        return Response({
            "detail": "Caja reembolsada exitosamente",
            "monto_reembolsado": monto_reembolso
        })


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    queryset = MovimientoCaja.objects.all().order_by('-fecha', '-id')
    serializer_class = MovimientoCajaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        caja_id = self.request.query_params.get('caja')
        tipo = self.request.query_params.get('tipo')
        
        if caja_id:
            queryset = queryset.filter(caja_id=caja_id)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        return queryset
    
    def perform_create(self, serializer):
        movimiento = serializer.save(registrado_por=self.request.user)
        
        # Actualizar saldo de la caja
        caja = movimiento.caja
        if movimiento.tipo == 'GASTO':
            caja.saldo_actual -= movimiento.monto
        elif movimiento.tipo == 'REEMBOLSO':
            caja.saldo_actual += movimiento.monto
        caja.save()


class EgresoViewSet(viewsets.ModelViewSet):
    queryset = Egreso.objects.all().order_by('-fecha', '-id')
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EgresoCreateSerializer
        return EgresoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        estado = self.request.query_params.get('estado')
        cuenta_id = self.request.query_params.get('cuenta')
        tipo = self.request.query_params.get('tipo')
        pendientes = self.request.query_params.get('pendientes')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if cuenta_id:
            queryset = queryset.filter(cuenta_bancaria_id=cuenta_id)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if pendientes == 'true':
            queryset = queryset.filter(estado__in=['BORRADOR', 'AUTORIZADO'])
        
        return queryset
    
    @decorators.action(detail=True, methods=['post'])
    def autorizar(self, request, pk=None):
        """Autoriza un egreso"""
        if not request.user.has_perm('tesoreria.autorizar_egreso'):
            return Response(
                {"detail": "No tienes permiso para autorizar egresos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        egreso = self.get_object()
        
        if egreso.estado != 'BORRADOR':
            return Response(
                {"detail": "Solo se pueden autorizar egresos en borrador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        egreso.estado = 'AUTORIZADO'
        egreso.autorizado_por = request.user
        egreso.fecha_autorizacion = timezone.now()
        egreso.save()
        
        return Response({"detail": "Egreso autorizado exitosamente"})
    
    @decorators.action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        """Marca un egreso como pagado y actualiza saldos"""
        if not request.user.has_perm('tesoreria.realizar_pago'):
            return Response(
                {"detail": "No tienes permiso para realizar pagos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        egreso = self.get_object()
        
        try:
            result = PaymentService.process_payment(egreso, request.user)
            return Response(result)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Error procesando pago para egreso {egreso.id}: {str(e)}")
            return Response(
                {"detail": "Error al procesar el pago"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @decorators.action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela un egreso"""
        egreso = self.get_object()
        
        if egreso.estado == 'PAGADO':
            return Response(
                {"detail": "No se puede cancelar un egreso ya pagado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        egreso.estado = 'CANCELADO'
        egreso.save()
        
        return Response({"detail": "Egreso cancelado"})
