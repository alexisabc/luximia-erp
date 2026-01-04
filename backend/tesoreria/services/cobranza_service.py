from decimal import Decimal
from django.db import transaction
from tesoreria.models.cxc import CobroCliente
from obras.models import Estimacion
from contabilidad.models.catalogos import Banco
from contabilidad.services.automation import PolizaGeneratorService

class CobranzaService:
    @staticmethod
    def registrar_cobro(estimacion_id, monto, fecha_cobro, banco_id, referencia, user):
        """
        Registra un cobro a una estimación y genera la contabilidad.
        """
        estimacion = Estimacion.objects.get(pk=estimacion_id)
        banco = Banco.objects.get(pk=banco_id)
        monto = Decimal(monto)
        
        # Validar saldo (Simplificado: Total - Suma de Cobros anteriores)
        cobrado_prev = sum(c.monto for c in estimacion.cobros.all())
        saldo = estimacion.total - cobrado_prev
        
        if monto > saldo + Decimal('0.01'): # Tolerancia
            raise ValueError(f"El monto ${monto} excede el saldo pendiente ${saldo}")

        with transaction.atomic():
            cobro = CobroCliente.objects.create(
                cliente=estimacion.obra.cliente or "Sin Cliente",
                monto=monto,
                fecha_cobro=fecha_cobro,
                estimacion=estimacion,
                banco_destino=banco,
                referencia_bancaria=referencia,
                creado_por=user
            )
            
            # Actualizar Estado Estimacion
            nuevo_cobrado = cobrado_prev + monto
            if abs(estimacion.total - nuevo_cobrado) < Decimal('1.00'):
                estimacion.estado = 'PAGADA'
                estimacion.save()
            elif estimacion.estado != 'PAGADA':
                # Podríamos tener un estado 'PAGADA_PARCIAL'
                pass
                
            # Generar Poliza de Ingreso (Cobro)
            # Template: INGRESO_COBRO
            context = {
                'MONTO': monto,
                'CLIENTE': estimacion.obra.cliente,
                'BANCO': banco.nombre,
                'REFERENCIA': referencia,
                'estimacion': estimacion.folio
            }
            
            PolizaGeneratorService.generar_poliza(
                nombre_plantilla="INGRESO_COBRO",
                context_data=context,
                referencia_modulo="TESORERIA",
                referencia_id=cobro.id,
                user=user
            )
            
            return cobro
