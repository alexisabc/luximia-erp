from django.db import transaction
from django.shortcuts import get_object_or_404
from decimal import Decimal
from ..models import (
    Turno, Venta, DetalleVenta, Producto,
    CuentaCliente, MovimientoSaldoCliente, MovimientoCaja
)
from contabilidad.models import Cliente


class CuentaClienteService:
    """
    Servicio para gestionar operaciones de cuentas de cliente.
    """
    
    @staticmethod
    @transaction.atomic
    def registrar_abono(
        cliente_id,
        monto,
        forma_pago,
        turno_id=None,
        comentarios=""
    ):
        """
        Registra un abono/pago del cliente.
        
        Args:
            cliente_id: ID del cliente
            monto: Monto del abono
            forma_pago: Forma de pago (EFECTIVO, TARJETA, etc.)
            turno_id: ID del turno activo (requerido si es EFECTIVO)
            comentarios: Comentarios adicionales
        
        Returns:
            dict: Información del abono registrado
        
        Raises:
            ValueError: Si las validaciones fallan
        """
        cliente = get_object_or_404(Cliente, pk=cliente_id)
        cuenta, _ = CuentaCliente.objects.get_or_create(cliente=cliente)
        
        saldo_previo = cuenta.saldo
        cuenta.saldo += Decimal(str(monto))
        cuenta.save()
        
        # Determinar tipo de movimiento
        if saldo_previo < 0:
            tipo_mov = 'ABONO_PAGO'  # Está pagando una deuda
        else:
            tipo_mov = 'DEPOSITO_ANTICIPO'  # Está depositando anticipo
        
        movimiento = MovimientoSaldoCliente.objects.create(
            cuenta=cuenta,
            tipo=tipo_mov,
            monto=Decimal(str(monto)),
            saldo_anterior=saldo_previo,
            saldo_nuevo=cuenta.saldo,
            comentarios=comentarios
        )
        
        # Si fue en efectivo, afecta la caja del turno activo
        if forma_pago == 'EFECTIVO' and turno_id:
            turno = get_object_or_404(Turno, pk=turno_id)
            MovimientoCaja.objects.create(
                turno=turno,
                tipo='INGRESO',
                monto=Decimal(str(monto)),
                concepto=f"Abono Cliente {cliente.nombre_completo}"
            )
        
        return {
            "detail": "Abono registrado exitosamente",
            "nuevo_saldo": cuenta.saldo,
            "tipo_movimiento": tipo_mov,
            "movimiento_id": movimiento.id
        }
