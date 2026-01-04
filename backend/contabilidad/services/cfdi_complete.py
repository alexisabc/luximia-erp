"""
Servicio completo de facturación CFDI 4.0
Integra generación XML, sellado digital y timbrado PAC
"""
from django.db import transaction
from contabilidad.models import Factura
from contabilidad.services.cfdi_service import CFDIService
from contabilidad.services.cfdi_signer import CFDISignerService
from contabilidad.services.pac_service import PACFactory


class CFDICompleteService:
    """
    Servicio completo para facturación electrónica CFDI 4.0
    """
    
    @classmethod
    @transaction.atomic
    def generar_factura_completa(cls, factura_id: int, certificado_id: int) -> dict:
        """
        Proceso completo: Genera XML, sella y timbra con PAC
        
        Args:
            factura_id: ID de la factura
            certificado_id: ID del certificado digital
            
        Returns:
            dict: {
                'success': bool,
                'factura_id': int,
                'uuid': str,
                'xml_timbrado': str,
                'pdf_url': str,
                'error': str (opcional)
            }
        """
        try:
            factura = Factura.objects.get(id=factura_id)
            
            # Validar estado
            if factura.estado not in ['BORRADOR', 'ERROR']:
                return {
                    'success': False,
                    'error': f'La factura está en estado {factura.estado}, no se puede timbrar'
                }
            
            # 1. Generar XML
            xml_sin_sello = CFDIService.generar_xml(factura_id)
            
            # 2. Generar cadena original
            cadena_original = CFDIService.generar_cadena_original(xml_sin_sello)
            
            # 3. Sellar digitalmente
            sello_data = CFDISignerService.sellar_cfdi(cadena_original, certificado_id)
            
            # 4. Agregar sello al XML
            xml_sellado = cls._agregar_sello_a_xml(
                xml_sin_sello,
                sello_data['sello'],
                sello_data['certificado'],
                sello_data['numero_certificado']
            )
            
            # 5. Timbrar con PAC
            pac = PACFactory.get_pac_service()
            resultado_timbrado = pac.timbrar(xml_sellado)
            
            if not resultado_timbrado['success']:
                # Marcar factura como error
                factura.estado = 'ERROR'
                factura.save(update_fields=['estado'])
                
                return {
                    'success': False,
                    'error': f"Error al timbrar: {resultado_timbrado.get('error', 'Error desconocido')}"
                }
            
            # 6. Actualizar factura con datos del timbrado
            factura.uuid = resultado_timbrado['uuid']
            factura.xml_timbrado = resultado_timbrado['xml_timbrado']
            factura.fecha_timbrado = resultado_timbrado['fecha_timbrado']
            factura.cadena_original = cadena_original
            factura.sello_digital = sello_data['sello']
            factura.numero_certificado_sat = sello_data['numero_certificado']
            factura.estado = 'TIMBRADA'
            factura.save()
            
            # 7. Generar PDF (opcional)
            pdf_url = cls._generar_pdf(factura)
            
            return {
                'success': True,
                'factura_id': factura.id,
                'uuid': factura.uuid,
                'xml_timbrado': factura.xml_timbrado,
                'pdf_url': pdf_url,
            }
            
        except Factura.DoesNotExist:
            return {
                'success': False,
                'error': 'Factura no encontrada'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error inesperado: {str(e)}'
            }
    
    @classmethod
    def cancelar_factura(cls, factura_id: int, motivo: str, uuid_sustitucion: str = None) -> dict:
        """
        Cancela una factura timbrada
        
        Args:
            factura_id: ID de la factura
            motivo: Código de motivo (01-04)
            uuid_sustitucion: UUID de factura que sustituye (si aplica)
            
        Returns:
            dict: {
                'success': bool,
                'acuse': str,
                'error': str (opcional)
            }
        """
        try:
            factura = Factura.objects.get(id=factura_id)
            
            # Validar que esté timbrada
            if factura.estado != 'TIMBRADA':
                return {
                    'success': False,
                    'error': 'Solo se pueden cancelar facturas timbradas'
                }
            
            # Cancelar con PAC
            pac = PACFactory.get_pac_service()
            resultado = pac.cancelar(str(factura.uuid), motivo, uuid_sustitucion)
            
            if resultado['success']:
                # Actualizar factura
                factura.estado = 'CANCELADA'
                factura.motivo_cancelacion = motivo
                factura.uuid_sustitucion = uuid_sustitucion
                from django.utils import timezone
                factura.fecha_cancelacion = timezone.now()
                factura.save()
            
            return resultado
            
        except Factura.DoesNotExist:
            return {
                'success': False,
                'error': 'Factura no encontrada'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al cancelar: {str(e)}'
            }
    
    @classmethod
    def _agregar_sello_a_xml(cls, xml_string: str, sello: str, certificado: str, numero_cert: str) -> str:
        """
        Agrega el sello digital y certificado al XML
        """
        from lxml import etree
        
        root = etree.fromstring(xml_string.encode('utf-8'))
        root.set('Sello', sello)
        root.set('NoCertificado', numero_cert)
        root.set('Certificado', certificado)
        
        return etree.tostring(
            root,
            pretty_print=True,
            xml_declaration=True,
            encoding='UTF-8'
        ).decode('utf-8')
    
    @classmethod
    def _generar_pdf(cls, factura: Factura) -> str:
        """
        Genera el PDF de la factura
        TODO: Implementar generación de PDF
        """
        return ''


# Ejemplo de uso
"""
from contabilidad.services.cfdi_complete import CFDICompleteService

# Generar factura completa (XML + Sello + Timbrado)
resultado = CFDICompleteService.generar_factura_completa(
    factura_id=1,
    certificado_id=1
)

if resultado['success']:
    print(f"✅ Factura timbrada exitosamente")
    print(f"UUID: {resultado['uuid']}")
    print(f"PDF: {resultado['pdf_url']}")
else:
    print(f"❌ Error: {resultado['error']}")

# Cancelar factura
resultado_cancelacion = CFDICompleteService.cancelar_factura(
    factura_id=1,
    motivo='02'  # Comprobante emitido con errores con relación
)
"""
