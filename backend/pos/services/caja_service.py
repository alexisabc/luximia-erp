from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal
from ..models import Caja, Turno

class CajaService:
    """
    Servicio para gestionar la apertura y cierre de turnos de caja.
    """

    @staticmethod
    @transaction.atomic
    def abrir_turno(caja_id, usuario, saldo_inicial):
        """
        Abre un nuevo turno en una caja.
        Valida que no exista otro turno abierto en la misma caja.
        """
        caja = Caja.objects.select_for_update().get(pk=caja_id)
        
        # Validar que no haya otro turno abierto en esta caja
        turno_abierto = Turno.objects.filter(caja=caja, estado='ABIERTA').exists()
        if turno_abierto:
            raise ValueError(f"Ya existe un turno abierto en esta caja: {caja.nombre}")
        
        # Crear el nuevo turno
        turno = Turno.objects.create(
            caja=caja,
            usuario=usuario,
            saldo_inicial=Decimal(str(saldo_inicial)),
            estado='ABIERTA'
        )
        
        return turno

    @staticmethod
    @transaction.atomic
    def cerrar_turno(turno_id, saldo_declarado):
        """
        Cierra un turno calculando el saldo final y la diferencia.
        """
        turno = Turno.objects.select_for_update().get(pk=turno_id)
        
        if turno.estado != 'ABIERTA':
            raise ValueError(f"El turno {turno_id} no está abierto")
        
        # Calcular saldo final basado en movimientos
        # Saldo Inicial + Ventas en Efectivo - Retiros + Ingresos
        from ..models import Venta, MovimientoCaja
        
        ventas_efectivo = Venta.objects.filter(
            turno=turno,
            estado='PAGADA'
        ).filter(
            metodo_pago='EFECTIVO'
        ).aggregate(
            total=models.Sum('total')
        )['total'] or Decimal(0)
        
        # Movimientos de caja (ingresos y retiros)
        ingresos = MovimientoCaja.objects.filter(
            turno=turno,
            tipo='INGRESO'
        ).aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal(0)
        
        retiros = MovimientoCaja.objects.filter(
            turno=turno,
            tipo='RETIRO'
        ).aggregate(
            total=models.Sum('monto')
        )['total'] or Decimal(0)
        
        saldo_final_calculado = turno.saldo_inicial + ventas_efectivo + ingresos - retiros
        saldo_declarado_dec = Decimal(str(saldo_declarado))
        diferencia = saldo_declarado_dec - saldo_final_calculado
        
        # Actualizar turno
        turno.saldo_final_calculado = saldo_final_calculado
        turno.saldo_final_declarado = saldo_declarado_dec
        turno.diferencia = diferencia
        turno.estado = 'CERRADA'
        turno.fecha_cierre = timezone.now()
        turno.save()
        
        return turno
