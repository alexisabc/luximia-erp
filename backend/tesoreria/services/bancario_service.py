from django.db import transaction
from decimal import Decimal
from tesoreria.models import CuentaBancaria, MovimientoBancario
from pos.models import Turno

class MovimientoBancarioService:
    """
    Servicio para gestionar movimientos bancarios con control de saldos.
    Integra con el POS para procesar cortes de caja.
    """

    @staticmethod
    @transaction.atomic
    def registrar_movimiento(
        cuenta_id,
        tipo,
        monto,
        concepto,
        usuario,
        referencia=None,
        beneficiario=None,
        origen_tipo='MANUAL',
        origen_id=None,
        fecha=None
    ):
        """
        Registra un movimiento bancario y actualiza el saldo de la cuenta.
        
        Args:
            cuenta_id: ID de la cuenta bancaria
            tipo: 'INGRESO' o 'EGRESO'
            monto: Monto del movimiento
            concepto: Descripción del movimiento
            usuario: Usuario que registra el movimiento
            referencia: Referencia bancaria opcional
            beneficiario: Nombre del beneficiario/pagador
            origen_tipo: Tipo de origen del movimiento
            origen_id: ID del registro origen
            fecha: Fecha del movimiento (default: hoy)
        
        Returns:
            MovimientoBancario creado
        
        Raises:
            ValueError: Si hay fondos insuficientes para un egreso
        """
        from django.utils import timezone
        
        # Bloquear la cuenta para evitar race conditions
        cuenta = CuentaBancaria.objects.select_for_update().get(pk=cuenta_id)
        
        monto_decimal = Decimal(str(monto))
        
        # Validar fondos suficientes para egresos
        if tipo == 'EGRESO':
            if cuenta.saldo_actual < monto_decimal:
                raise ValueError(
                    f"Fondos insuficientes. Saldo disponible: ${cuenta.saldo_actual}, "
                    f"Monto solicitado: ${monto_decimal}"
                )
        
        # Crear el movimiento bancario
        movimiento = MovimientoBancario.objects.create(
            cuenta=cuenta,
            fecha=fecha or timezone.now().date(),
            tipo=tipo,
            monto=monto_decimal,
            referencia=referencia,
            beneficiario=beneficiario,
            concepto=concepto,
            origen_tipo=origen_tipo,
            origen_id=origen_id,
            registrado_por=usuario
        )
        
        # Actualizar saldo de la cuenta
        if tipo == 'INGRESO':
            cuenta.saldo_actual += monto_decimal
        else:  # EGRESO
            cuenta.saldo_actual -= monto_decimal
        
        cuenta.save()
        
        return movimiento

    @staticmethod
    @transaction.atomic
    def procesar_corte_caja(turno_id, cuenta_id, usuario, imagen_ficha=None):
        """
        Procesa el depósito del corte de caja de un turno del POS.
        
        Args:
            turno_id: ID del turno a procesar
            cuenta_id: ID de la cuenta bancaria donde depositar
            usuario: Usuario que procesa el depósito
            imagen_ficha: Archivo de imagen de la ficha de depósito (opcional)
        
        Returns:
            MovimientoBancario creado
        
        Raises:
            ValueError: Si el turno no está cerrado o ya fue procesado
        """
        # Obtener el turno
        turno = Turno.objects.select_for_update().get(pk=turno_id)
        
        # Validar que el turno esté cerrado
        if turno.estado != 'CERRADA':
            raise ValueError(
                f"El turno debe estar cerrado para procesar el depósito. "
                f"Estado actual: {turno.estado}"
            )
        
        # Validar que no se haya procesado ya
        # (verificar si ya existe un movimiento con este origen)
        movimiento_existente = MovimientoBancario.objects.filter(
            origen_tipo='POS_TURNO',
            origen_id=turno_id
        ).exists()
        
        if movimiento_existente:
            raise ValueError(
                f"El turno {turno.id} ya fue procesado anteriormente"
            )
        
        # Monto a depositar (saldo final calculado del turno)
        monto_deposito = turno.saldo_final_calculado
        
        # Crear referencia descriptiva
        referencia = f"TURNO-{turno.id}-{turno.caja.nombre}"
        concepto = (
            f"Depósito corte de caja - Turno #{turno.id} - "
            f"{turno.caja.nombre} - {turno.usuario.username}"
        )
        
        # Registrar el movimiento bancario
        movimiento = MovimientoBancarioService.registrar_movimiento(
            cuenta_id=cuenta_id,
            tipo='INGRESO',
            monto=monto_deposito,
            concepto=concepto,
            usuario=usuario,
            referencia=referencia,
            beneficiario=turno.usuario.get_full_name() or turno.usuario.username,
            origen_tipo='POS_TURNO',
            origen_id=turno_id,
            fecha=turno.fecha_cierre.date() if turno.fecha_cierre else None
        )
        
        # TODO: Si se agrega campo 'depositado' o 'recolectado' al Turno,
        # actualizarlo aquí
        # turno.depositado = True
        # turno.fecha_deposito = timezone.now()
        # turno.save()
        
        return movimiento

    @staticmethod
    def obtener_saldo_cuenta(cuenta_id):
        """
        Obtiene el saldo actual de una cuenta bancaria.
        
        Args:
            cuenta_id: ID de la cuenta bancaria
        
        Returns:
            Decimal: Saldo actual
        """
        cuenta = CuentaBancaria.objects.get(pk=cuenta_id)
        return cuenta.saldo_actual

    @staticmethod
    def obtener_movimientos(cuenta_id, fecha_desde=None, fecha_hasta=None, conciliados=None):
        """
        Obtiene los movimientos de una cuenta con filtros opcionales.
        
        Args:
            cuenta_id: ID de la cuenta bancaria
            fecha_desde: Fecha inicial del rango (opcional)
            fecha_hasta: Fecha final del rango (opcional)
            conciliados: True/False para filtrar por estado de conciliación (opcional)
        
        Returns:
            QuerySet de MovimientoBancario
        """
        queryset = MovimientoBancario.objects.filter(cuenta_id=cuenta_id)
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
        
        if conciliados is not None:
            queryset = queryset.filter(conciliado=conciliados)
        
        return queryset.order_by('-fecha', '-created_at')
