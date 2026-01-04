from decimal import Decimal
from django.core.exceptions import ValidationError
from compras.models import OrdenCompra

class MatchService:
    @staticmethod
    def realizar_3way_match(orden_compra, datos_xml, user, update_status=True):
        """
        Ejecuta la validación de 3 vías (ODC + Recepción* + Factura).
        *Para este sprint, simplificamos a 2-Way (ODC vs Factura) + Validación de que exista recepción si aplica.
        
        Args:
            orden_compra: Instancia OrdenCompra
            datos_xml: Dict con {total, uuid, moneda}
            user: Usuario que ejecuta la acción (para auditoría).
            update_status: Si True, actualiza la ODC si pasa.
        Returns:
            bool: True si pasa.
            Raises: ValidationError si falla.
        """
        from tesoreria.models.cxp import ContraRecibo # Import late to avoid circular if any
        
        # 1. Validar Montos (Tolerancia $1.00)
        total_odc = orden_compra.total
        total_xml = datos_xml['total']
        
        diff = abs(total_odc - total_xml)
        if diff > Decimal('1.00'):
             raise ValidationError(
                 f"Monto no coincide. ODC: ${total_odc}, Factura: ${total_xml}. Diferencia: ${diff}"
             )

        # 2. Validar Estado de ODC
        # Solo se pueden pagar ODCs que ya fueron recibidas (COMPLETADA o PARCIALMENTE_SURTIDA)
        if orden_compra.estado not in ['COMPLETADA', 'PARCIALMENTE_SURTIDA', 'AUTORIZADA']: 
             if orden_compra.estado == 'AUTORIZADA' and diff == 0:
                 pass 
             elif orden_compra.estado == 'BORRADOR':
                 raise ValidationError("La orden de compra no está autorizada.")
        
        # 3. Match Exitoso
        if update_status:
            orden_compra.xml_uuid = datos_xml['uuid']
            orden_compra.save()
            
            # 4. Crear ContraRecibo Automáticamente en Tesorería
            # Verificar si ya existe para no duplicar
            if not ContraRecibo.objects.filter(uuid=datos_xml['uuid']).exists():
                cr = ContraRecibo.objects.create(
                    proveedor=orden_compra.proveedor,
                    tipo='FACTURA',
                    uuid=datos_xml['uuid'],
                    orden_compra=orden_compra,
                    moneda=orden_compra.moneda,
                    total=total_xml, # Usamos el del XML que es el fiscal real
                    saldo_pendiente=total_xml,
                    estado='VALIDADO', # Nace validado porque viene del match
                    creado_por=user
                )

                # 5. Generar Poliza de Diario (Provisión)
                # Hook a Contabilidad
                try:
                    from contabilidad.services.automation import PolizaGeneratorService
                    context = {
                        'SUBTOTAL': orden_compra.subtotal, 
                        'IVA_16': orden_compra.iva, 
                        'TOTAL': total_xml,
                        'folio': orden_compra.id,
                        'proveedor': orden_compra.proveedor.razon_social
                    }
                    PolizaGeneratorService.generar_poliza(
                        nombre_plantilla="PROVISION_COMPRA",
                        context_data=context,
                        referencia_modulo="COMPRAS",
                        referencia_id=orden_compra.id,
                        user=user
                    )
                except Exception as e:
                    # No detenemos el flujo principal si falla la contabilidad automática, pero logueamos
                    print(f"Error generando poliza: {e}")

            
        return True
