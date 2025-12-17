from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import pyotp
from decimal import Decimal

from core.permissions import HasPermissionForAction
from .models import (
    Producto, Caja, Turno, Venta, DetalleVenta, 
    CuentaCliente, MovimientoSaldoCliente, MovimientoCaja
)
from .serializers import (
    ProductoSerializer, CajaSerializer, TurnoSerializer, 
    VentaSerializer, VentaCancelacionSerializer,
    CuentaClienteSerializer, PagoCuentaSerializer,
    MovimientoSaldoClienteSerializer
)
from contabilidad.models import Cliente

User = get_user_model()

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticated]

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all()
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all().order_by('-fecha_inicio')
    serializer_class = TurnoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['post'])
    def abrir(self, request):
        usuario = request.user
        caja_id = request.data.get('caja')
        saldo_inicial = request.data.get('saldo_inicial', 0)
        
        # Validar si ya tiene turno abierto
        if Turno.objects.filter(usuario=usuario, cerrado=False).exists():
            return Response({"detail": "Ya tienes un turno abierto."}, status=400)
            
        caja = get_object_or_404(Caja, pk=caja_id)
        turno = Turno.objects.create(
            caja=caja,
            usuario=usuario,
            saldo_inicial=saldo_inicial
        )
        return Response(TurnoSerializer(turno).data)

    @decorators.action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        turno = self.get_object()
        if turno.cerrado:
            return Response({"detail": "El turno ya está cerrado."}, status=400)
            
        declarado = Decimal(str(request.data.get('saldo_declarado', 0)))
        
        # Calcular saldo final teórico
        # Saldo Inicial + Ventas Efectivo + Ingresos Caja - Retiros Caja
        ventas_efectivo = Venta.objects.filter(
            turno=turno, 
            estado='PAGADA', 
            metodo_pago_principal='EFECTIVO'
        ).aggregate(total=models.Sum('total'))['total'] or 0

        # Ingresos/Retiros por MovimientoCaja (ej. Abonos)
        ingresos = MovimientoCaja.objects.filter(turno=turno, tipo='INGRESO').aggregate(total=models.Sum('monto'))['total'] or 0
        retiros = MovimientoCaja.objects.filter(turno=turno, tipo='RETIRO').aggregate(total=models.Sum('monto'))['total'] or 0

        calculado = turno.saldo_inicial + ventas_efectivo + ingresos - retiros
        
        turno.saldo_final_calculado = calculado
        turno.saldo_final_declarado = declarado
        turno.diferencia = declarado - calculado
        turno.cerrado = True
        turno.fecha_fin = timezone.now()
        turno.save()
        
        return Response(TurnoSerializer(turno).data)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha')
    serializer_class = VentaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        idata = serializer.validated_data
        
        items = request.data.get('items', [])
        cliente = idata.get('cliente')
        turno = idata.get('turno')
        metodo_principal = idata.get('metodo_pago_principal')
        metodo_secundario = request.data.get('metodo_pago_secundario')
        monto_principal = Decimal(str(request.data.get('monto_metodo_principal', 0)))
        monto_secundario = Decimal(str(request.data.get('monto_metodo_secundario', 0)))
        
        if not items:
            return Response({"detail": "La venta no tiene productos"}, status=400)
        
        # Calcular Total
        total_venta = Decimal(0)
        productos_map = {}
        for item in items:
            prod = get_object_or_404(Producto, pk=item['producto_id'])
            qty = Decimal(str(item['cantidad']))
            line_total = prod.precio_final * qty
            total_venta += line_total
            productos_map[prod.id] = {'prod': prod, 'qty': qty, 'price': prod.precio_final}

        # Validar montos de pago
        if metodo_secundario:
            if monto_principal + monto_secundario != total_venta:
                return Response({"detail": "La suma de los montos debe ser igual al total"}, status=400)
        else:
            monto_principal = total_venta
            monto_secundario = Decimal(0)

        # Obtener cuenta del cliente si existe
        cuenta = None
        if cliente:
            cuenta, _ = CuentaCliente.objects.get_or_create(cliente=cliente)
        
        # Validar disponibilidad para cada método
        def validar_metodo(metodo, monto):
            if metodo in ['CREDITO', 'ANTICIPO'] and not cuenta:
                return False, "Cliente requerido para crédito/anticipo"
            
            if metodo == 'CREDITO' and cuenta.credito_disponible < monto:
                return False, f"Crédito insuficiente. Disponible: ${cuenta.credito_disponible}"
            
            if metodo == 'ANTICIPO' and cuenta.saldo < monto:
                return False, f"Anticipo insuficiente. Disponible: ${cuenta.saldo}"
            
            return True, None
        
        # Validar método principal
        valid, error = validar_metodo(metodo_principal, monto_principal)
        if not valid:
            return Response({"detail": error}, status=400)
        
        # Validar método secundario si existe
        if metodo_secundario:
            valid, error = validar_metodo(metodo_secundario, monto_secundario)
            if not valid:
                return Response({"detail": error}, status=400)

        with transaction.atomic():
            # Crear venta
            venta = Venta.objects.create(
                turno=turno,
                cliente=cliente,
                subtotal=total_venta / Decimal('1.16'),
                impuestos=total_venta - (total_venta / Decimal('1.16')),
                total=total_venta,
                metodo_pago_principal=metodo_principal,
                monto_metodo_principal=monto_principal,
                metodo_pago_secundario=metodo_secundario,
                monto_metodo_secundario=monto_secundario,
                estado='PAGADA'
            )
            
            # Crear detalles
            for pid, info in productos_map.items():
                DetalleVenta.objects.create(
                    venta=venta,
                    producto=info['prod'],
                    cantidad=info['qty'],
                    precio_unitario=info['price'],
                    subtotal=info['price'] * info['qty']
                )
            
            # Aplicar movimientos de cuenta para método principal
            def aplicar_movimiento(metodo, monto):
                if not cuenta or metodo not in ['CREDITO', 'ANTICIPO']:
                    return
                
                saldo_anterior = cuenta.saldo
                
                if metodo == 'CREDITO':
                    cuenta.saldo -= monto
                    tipo_mov = 'CARGO_VENTA'
                elif metodo == 'ANTICIPO':
                    cuenta.saldo -= monto
                    tipo_mov = 'CARGO_USO_ANTICIPO'
                
                cuenta.save()
                
                MovimientoSaldoCliente.objects.create(
                    cuenta=cuenta,
                    tipo=tipo_mov,
                    monto=monto,
                    referencia_venta=venta,
                    saldo_anterior=saldo_anterior,
                    saldo_nuevo=cuenta.saldo,
                    comentarios=f"Pago {metodo} - Venta {venta.folio}"
                )
            
            aplicar_movimiento(metodo_principal, monto_principal)
            if metodo_secundario:
                aplicar_movimiento(metodo_secundario, monto_secundario)

        return Response(VentaSerializer(venta).data, status=201)

    @decorators.action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        venta = self.get_object()
        if venta.estado == 'CANCELADA':
             return Response({"detail": "Ya está cancelada"}, status=400)

        # Autenticación Supervisor
        sup_user = request.data.get('supervisor_username')
        sup_code = request.data.get('supervisor_code')
        motivo = request.data.get('motivo')
        
        try:
            supervisor = User.objects.get(username=sup_user, is_active=True)
            # Solo supervisors o admins? Asumamos is_staff por ahora o permiso especial
            if not supervisor.is_staff: 
                return Response({"detail": "Usuario no autorizado para supervisar"}, status=403)
                
            if not supervisor.totp_secret:
                return Response({"detail": "Supervisor sin TOTP configurado"}, status=400)
                
            totp = pyotp.TOTP(supervisor.totp_secret)
            if not totp.verify(sup_code, valid_window=1):
                return Response({"detail": "Código TOTP inválido"}, status=403)
                
        except User.DoesNotExist:
            return Response({"detail": "Supervisor no encontrado"}, status=404)

        with transaction.atomic():
            venta.estado = 'CANCELADA'
            venta.cancelado_por = supervisor
            venta.motivo_cancelacion = motivo
            venta.save()
            
            # Revertir Movimientos de Saldo si aplica
            if venta.metodo_pago_principal in ['CREDITO', 'ANTICIPO'] and venta.cliente:
                cuenta = CuentaCliente.objects.get(cliente=venta.cliente)
                cuenta.saldo += venta.total # Se regresa el dinero/crédito
                cuenta.save()
                MovimientoSaldoCliente.objects.create(
                    cuenta=cuenta,
                    tipo='CANCELACION',
                    monto=venta.total,
                    referencia_venta=venta,
                    saldo_anterior=cuenta.saldo - venta.total,
                    saldo_nuevo=cuenta.saldo,
                    comentarios=f"Cancelación venta {venta.folio}"
                )

        return Response({"detail": "Venta cancelada exitosamente"})


class CuentaClienteViewSet(viewsets.ModelViewSet):
    queryset = CuentaCliente.objects.all()
    serializer_class = CuentaClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['post'])
    def abonar(self, request):
        """
        Registra un pago del cliente (Abono).
        Si tiene deuda (Negativo), la disminuye.
        Si está en 0 o positivo, aumenta su saldo a favor (Anticipo).
        """
        serializer = PagoCuentaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        cliente_id = data['cliente_id']
        monto = data['monto']
        forma_pago = data['forma_pago']
        turno_id = data['turno_id']
        
        with transaction.atomic():
            cliente = get_object_or_404(Cliente, pk=cliente_id)
            cuenta, _ = CuentaCliente.objects.get_or_create(cliente=cliente)
            
            saldo_previo = cuenta.saldo
            cuenta.saldo += monto
            cuenta.save()
            
            MovimientoSaldoCliente.objects.create(
                cuenta=cuenta,
                tipo='ABONO_PAGO' if saldo_previo < 0 else 'DEPOSITO_ANTICIPO',
                monto=monto,
                saldo_anterior=saldo_previo,
                saldo_nuevo=cuenta.saldo,
                comentarios=data.get('comentarios', '')
            )
            
            # Si fue en efectivo, afecta la caja del turno activo
            if forma_pago == 'EFECTIVO':
                turno = get_object_or_404(Turno, pk=turno_id)
                MovimientoCaja.objects.create(
                    turno=turno,
                    tipo='INGRESO',
                    monto=monto,
                    concepto=f"Abono Cliente {cliente.nombre_completo}"
                )
                
        return Response({"detail": "Abono registrado", "nuevo_saldo": cuenta.saldo})

    @decorators.action(detail=True, methods=['get'])
    def estado_cuenta(self, request, pk=None):
        """Reporte personalizado historial."""
        cuenta = self.get_object()
        movimientos = MovimientoSaldoCliente.objects.filter(cuenta=cuenta).order_by('-created_at')[:50]
        return Response(MovimientoSaldoClienteSerializer(movimientos, many=True).data)

