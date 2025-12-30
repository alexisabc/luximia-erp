
from django.db import transaction
from django.utils import timezone

class PaymentService:
    @staticmethod
    def process_payment(egreso, user=None):
        """
        Procesa el pago de un egreso autorizado.
        Orquesta la actualización de saldos y estados de forma atómica.
        """
        if egreso.estado != 'AUTORIZADO':
            raise ValueError("El egreso debe estar autorizado")
            
        with transaction.atomic():
            # 1. Actualizar estado del egreso
            egreso.estado = 'PAGADO'
            # Podríamos guardar quién ejecutó el pago si el modelo lo soportara (eg. pagado_por)
            # egreso.pagado_por = user 
            egreso.save()
            
            # 2. Actualizar saldo de la cuenta bancaria
            cuenta = egreso.cuenta_bancaria
            cuenta.saldo_actual -= egreso.monto
            cuenta.save()
            
            # 3. Si está vinculado a un ContraRecibo, actualizar su saldo
            if egreso.contra_recibo:
                cr = egreso.contra_recibo
                cr.saldo_pendiente -= egreso.monto
                
                if cr.saldo_pendiente <= 0:
                    cr.estado = 'PAGADO'
                elif cr.saldo_pendiente < cr.total:
                    cr.estado = 'PAGADO_PARCIAL'
                
                cr.save()
                
        return {
            'success': True,
            'message': 'Pago realizado exitosamente',
            'nuevo_saldo_cuenta': cuenta.saldo_actual
        }
