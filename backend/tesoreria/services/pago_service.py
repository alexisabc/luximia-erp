from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from tesoreria.models.cxp import ContraRecibo, ProgramacionPago, DetalleProgramacion

class PaymentSchedulerService:
    @staticmethod
    def crear_programacion(ids_contrarecibos, fecha_pago, banco_emisor, cuenta_emisora, user):
        """
        Crea un lote de pago (ProgramacionPago) con los contrarecibos seleccionados.
        """
        crs = ContraRecibo.objects.filter(id__in=ids_contrarecibos, estado='VALIDADO')
        if not crs:
            raise ValueError("No se encontraron ContraRecibos validos para programar.")

        total_mxn = Decimal(0)
        
        with transaction.atomic():
            programacion = ProgramacionPago.objects.create(
                fecha_programada=fecha_pago,
                descripcion=f"Pago Proveedores {fecha_pago}",
                banco_emisor=banco_emisor,
                cuenta_emisora=cuenta_emisora,
                autorizado_por=user,
                estado='BORRADOR'
            )
            
            for cr in crs:
                # Validar moneda (asumimos MXN por ahora o conversion simple)
                if cr.moneda.codigo != 'MXN':
                     # TODO: Handle multi-currency 
                     pass 
                
                monto = cr.saldo_pendiente
                DetalleProgramacion.objects.create(
                    programacion=programacion,
                    contra_recibo=cr,
                    monto_a_pagar=monto
                )
                
                total_mxn += monto
                # Actualizar estado del CR para que no se seccione de nuevo
                cr.estado = 'PROGRAMADO'
                cr.save()
            
            programacion.total_mxn = total_mxn
            programacion.save()
            
            return programacion

    @staticmethod
    def generar_layout_banchile(programacion_id):
        """
        Genera un archivo plano (TXT) simulando el layout de BanChile/Citi.
        Formato dummy: CUENTA_DESTINO|MONTO|BENEFICIARIO|REF
        """
        prog = ProgramacionPago.objects.get(pk=programacion_id)
        lines = []
        # Header
        lines.append(f"HEADER|{prog.cuenta_emisora}|{prog.fecha_programada}|{prog.total_mxn}")
        
        for det in prog.detalles.all():
            prov = det.contra_recibo.proveedor
            cuenta_destino = prov.cuenta or prov.clabe or '0000000000'
            monto = det.monto_a_pagar
            beneficiario = prov.razon_social[:30] # Truncate check
            ref = det.contra_recibo.folio
            
            line = f"DETAIL|{cuenta_destino}|{monto}|{beneficiario}|{ref}"
            lines.append(line)
            
        return "\n".join(lines)
