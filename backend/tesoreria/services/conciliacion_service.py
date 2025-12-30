from decimal import Decimal

class ConciliacionService:
    @staticmethod
    def conciliar_cuenta(cuenta, saldo_bancario, user=None):
        """
        Concilia el saldo de la cuenta bancaria con el reporte del banco.
        Actualiza el saldo_bancario en el sistema y calcula la diferencia.
        """
        # Actualizar saldo bancario
        cuenta.saldo_bancario = Decimal(saldo_bancario)
        cuenta.save()
        
        # Calcular diferencia
        diferencia = cuenta.saldo_actual - cuenta.saldo_bancario
        conciliada = diferencia == Decimal('0.00')
        
        return {
            'conciliada': conciliada,
            'saldo_sistema': cuenta.saldo_actual,
            'saldo_bancario': cuenta.saldo_bancario,
            'diferencia': diferencia,
            'mensaje': 'Cuenta conciliada' if conciliada else 'Diferencia detectada'
        }
