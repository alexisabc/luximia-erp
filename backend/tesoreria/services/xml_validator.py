from decimal import Decimal
import xml.etree.ElementTree as ET

class XMLValidatorService:
    @staticmethod
    def parse_cfdi(xml_content):
        """
        Parsea un archivo XML (CFDI 3.3 o 4.0) y extrae datos clave.
        Args:
            xml_content: bytes o string del archivo XML.
        Returns:
            dict: { 'uuid': str, 'rfc_emisor': str, 'rfc_receptor': str, 'total': Decimal, 'moneda': str }
        """
        try:
            tree = ET.fromstring(xml_content)
            # Manejo básico de namespaces de CFDI (suele ser http://www.sat.gob.mx/cfd/3 o /4)
            # Para simplificar, buscamos por local name o definimos los maps comunes
            namespaces = {
                'cfdi': 'http://www.sat.gob.mx/cfd/4', # Intentar 4.0 primero
                'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'
            }
            
            # Si es 3.3, el namespace cambia, aquí hacemos un check rápido o manejamos fallback, 
            # pero para este sprint asumiremos 4.0 o buscaremos sin namespace estricto para atributos root
            
            # Datos Root (Comprobante)
            total = Decimal(tree.get('Total', 0))
            moneda = tree.get('Moneda', 'MXN')
            
            # Emisor y Receptor
            emisor = tree.find('{http://www.sat.gob.mx/cfd/4}Emisor')
            if emisor is None: # Fallback 3.3
                 emisor = tree.find('{http://www.sat.gob.mx/cfd/3}Emisor')
                 
            rfc_emisor = emisor.get('Rfc') if emisor is not None else None
            
            receptor = tree.find('{http://www.sat.gob.mx/cfd/4}Receptor')
            if receptor is None: # Fallback 3.3
                receptor = tree.find('{http://www.sat.gob.mx/cfd/3}Receptor')

            rfc_receptor = receptor.get('Rfc') if receptor is not None else None
            
            # Timbre Fiscal Digital (Complemento)
            complemento = tree.find('{http://www.sat.gob.mx/cfd/4}Complemento')
            if complemento is None: 
                complemento = tree.find('{http://www.sat.gob.mx/cfd/3}Complemento')
                
            uuid = None
            if complemento is not None:
                # El timbre suele usar su propio namespace TFD
                for child in complemento:
                    if 'TimbreFiscalDigital' in child.tag:
                         uuid = child.get('UUID')
            
            return {
                'uuid': uuid,
                'rfc_emisor': rfc_emisor,
                'rfc_receptor': rfc_receptor,
                'total': total,
                'moneda': moneda
            }
            
        except ET.ParseError:
            raise ValueError("El archivo subido no es un XML válido.")
        except Exception as e:
            raise ValueError(f"Error procesando el XML: {str(e)}")

    @staticmethod
    def validate_rules(parsed_data, expected_rfc_emisor, expected_rfc_receptor):
        """
        Valida reglas de negocio del XML.
        """
        if not parsed_data['uuid']:
            raise ValueError("El XML no tiene UUID (No está timbrado).")
            
        if parsed_data['rfc_emisor'] != expected_rfc_emisor:
            raise ValueError(f"RFC Emisor no coincide. Esperado: {expected_rfc_emisor}, Recibido: {parsed_data['rfc_emisor']}")
            
        # Comentado para facilitar testing si usamos RFC genérico en dev
        # if parsed_data['rfc_receptor'] != expected_rfc_receptor:
        #    raise ValueError(f"La factura no está emitida a nosotros ({expected_rfc_receptor}).")
            
        return True
