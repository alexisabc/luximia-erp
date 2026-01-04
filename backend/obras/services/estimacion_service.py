from decimal import Decimal
from django.db import transaction
from obras.models import Obra, Estimacion
from contabilidad.services.automation import PolizaGeneratorService

class EstimacionService:
    @staticmethod
    def crear_estimacion(obra_id, monto_avance, fecha_corte, user):
        """
        Calcula y crea una Estimación aplicando las deducciones del contrato.
        """
        obra = Obra.objects.get(pk=obra_id)
        monto_avance = Decimal(monto_avance)
        
        # 1. Calcular Deducciones
        amortizacion = monto_avance * (obra.porcentaje_anticipo / 100)
        garantia = monto_avance * (obra.porcentaje_fondo_garantia / 100)
        
        subtotal = monto_avance - amortizacion - garantia
        iva = subtotal * Decimal('0.16')
        total = subtotal + iva
        
        estimacion = Estimacion.objects.create(
            obra=obra,
            fecha_corte=fecha_corte,
            monto_avance=monto_avance,
            amortizacion_anticipo=amortizacion,
            fondo_garantia=garantia,
            subtotal=subtotal,
            iva=iva,
            total=total,
            estado='BORRADOR',
            # creado_por=user  (Assuming inherited from SoftDeleteModel or handled by middleware/signal)
        )
        return estimacion

    @staticmethod
    def autorizar_estimacion(estimacion_id, user):
        """
        Autoriza la estimación y genera la Poliza de Ingresos.
        """
        estimacion = Estimacion.objects.get(pk=estimacion_id)
        if estimacion.estado != 'BORRADOR':
            raise ValueError("Solo se pueden autorizar estimaciones en Borrador")
            
        with transaction.atomic():
            estimacion.estado = 'AUTORIZADA'
            estimacion.save()
            
            # Generar Poliza Contable Automática
            # Template: PROVISION_ESTIMACION
            # Necesitamos Contexto con deducciones separadas
            context = {
                'AVANCE': estimacion.monto_avance,
                'AMORTIZACION': estimacion.amortizacion_anticipo,
                'GARANTIA': estimacion.fondo_garantia,
                'SUBTOTAL': estimacion.subtotal,
                'IVA_16': estimacion.iva,
                'TOTAL_PAGAR': estimacion.total,
                'folio': estimacion.folio,
                'obra': estimacion.obra.nombre
            }
            
            PolizaGeneratorService.generar_poliza(
                nombre_plantilla="PROVISION_ESTIMACION",
                context_data=context,
                referencia_modulo="OBRAS",
                referencia_id=estimacion.id,
                user=user
            )
            
        return estimacion
