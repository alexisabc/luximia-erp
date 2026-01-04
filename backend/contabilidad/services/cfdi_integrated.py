"""
Integración de CFDIService con CFDISignerService
Actualización para incluir sellado digital
"""
from decimal import Decimal
from datetime import datetime
from lxml import etree
from django.conf import settings
from contabilidad.models import Factura, ConceptoFactura, ImpuestoConcepto
from contabilidad.services.cfdi_signer import CFDISignerService


class CFDIServiceIntegrated:
    """
    Servicio integrado para generación y sellado de CFDI 4.0
    """
    
    # Namespaces según SAT
    NAMESPACES = {
        'cfdi': 'http://www.sat.gob.mx/cfd/4',
        'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    }
    
    SCHEMA_LOCATION = 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'
    
    @classmethod
    def generar_y_sellar_cfdi(cls, factura_id: int, certificado_id: int) -> dict:
        """
        Genera el XML CFDI y lo sella digitalmente
        
        Args:
            factura_id: ID de la factura
            certificado_id: ID del certificado digital a usar
            
        Returns:
            dict: {
                'xml_sellado': str,
                'cadena_original': str,
                'sello': str,
                'numero_certificado': str
            }
        """
        from contabilidad.services.cfdi_service import CFDIService
        
        # 1. Generar XML sin sello
        xml_sin_sello = CFDIService.generar_xml(factura_id)
        
        # 2. Generar cadena original
        cadena_original = CFDIService.generar_cadena_original(xml_sin_sello)
        
        # 3. Generar sello digital
        sello_data = CFDISignerService.sellar_cfdi(cadena_original, certificado_id)
        
        # 4. Agregar sello y certificado al XML
        xml_sellado = cls._agregar_sello_a_xml(
            xml_sin_sello,
            sello_data['sello'],
            sello_data['certificado'],
            sello_data['numero_certificado']
        )
        
        # 5. Actualizar factura
        factura = Factura.objects.get(id=factura_id)
        factura.xml_original = xml_sellado
        factura.cadena_original = cadena_original
        factura.sello_digital = sello_data['sello']
        factura.numero_certificado_sat = sello_data['numero_certificado']
        factura.save(update_fields=[
            'xml_original', 'cadena_original', 'sello_digital', 'numero_certificado_sat'
        ])
        
        return {
            'xml_sellado': xml_sellado,
            'cadena_original': cadena_original,
            'sello': sello_data['sello'],
            'numero_certificado': sello_data['numero_certificado'],
        }
    
    @classmethod
    def _agregar_sello_a_xml(cls, xml_string: str, sello: str, certificado: str, numero_cert: str) -> str:
        """
        Agrega el sello digital y certificado al XML
        
        Args:
            xml_string: XML sin sello
            sello: Sello digital en base64
            certificado: Certificado en base64
            numero_cert: Número de certificado
            
        Returns:
            str: XML con sello
        """
        # Parsear XML
        root = etree.fromstring(xml_string.encode('utf-8'))
        
        # Agregar atributos de sello
        root.set('Sello', sello)
        root.set('NoCertificado', numero_cert)
        root.set('Certificado', certificado)
        
        # Convertir de vuelta a string
        xml_sellado = etree.tostring(
            root,
            pretty_print=True,
            xml_declaration=True,
            encoding='UTF-8'
        ).decode('utf-8')
        
        return xml_sellado


# Ejemplo de uso
"""
from contabilidad.services.cfdi_integrated import CFDIServiceIntegrated

# Generar y sellar CFDI
resultado = CFDIServiceIntegrated.generar_y_sellar_cfdi(
    factura_id=1,
    certificado_id=1
)

print("XML Sellado:", resultado['xml_sellado'])
print("Sello:", resultado['sello'])
"""
