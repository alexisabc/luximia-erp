"""
Servicio base para integración con PACs (Proveedores Autorizados de Certificación)
Soporta múltiples PACs: Finkok, SW Sapien, Facturaxion
"""
import requests
import base64
from abc import ABC, abstractmethod
from typing import Optional, Dict
from django.conf import settings
from contabilidad.models import Factura


class PACServiceBase(ABC):
    """
    Clase base abstracta para servicios de PAC
    """
    
    @abstractmethod
    def timbrar(self, xml_sellado: str) -> Dict:
        """
        Envía XML sellado al PAC para timbrado
        
        Args:
            xml_sellado: XML con sello digital
            
        Returns:
            dict: {
                'success': bool,
                'uuid': str,
                'xml_timbrado': str,
                'fecha_timbrado': str,
                'error': str (opcional)
            }
        """
        pass
    
    @abstractmethod
    def cancelar(self, uuid: str, motivo: str, uuid_sustitucion: Optional[str] = None) -> Dict:
        """
        Cancela un CFDI timbrado
        
        Args:
            uuid: UUID del CFDI a cancelar
            motivo: Motivo de cancelación (01-04)
            uuid_sustitucion: UUID del CFDI que sustituye (si aplica)
            
        Returns:
            dict: {
                'success': bool,
                'acuse': str,
                'error': str (opcional)
            }
        """
        pass
    
    @abstractmethod
    def consultar_estatus(self, uuid: str) -> Dict:
        """
        Consulta el estatus de un CFDI
        
        Args:
            uuid: UUID del CFDI
            
        Returns:
            dict: {
                'success': bool,
                'estado': str,
                'es_cancelable': bool,
                'estatus_cancelacion': str
            }
        """
        pass


class FinkokPACService(PACServiceBase):
    """
    Implementación para PAC Finkok
    """
    
    def __init__(self):
        self.username = getattr(settings, 'FINKOK_USERNAME', '')
        self.password = getattr(settings, 'FINKOK_PASSWORD', '')
        self.test_mode = getattr(settings, 'FINKOK_TEST_MODE', True)
        
        # URLs según ambiente
        if self.test_mode:
            self.base_url = 'http://demo-facturacion.finkok.com/servicios/soap'
        else:
            self.base_url = 'https://facturacion.finkok.com/servicios/soap'
    
    def timbrar(self, xml_sellado: str) -> Dict:
        """
        Timbra un CFDI con Finkok
        """
        try:
            # Convertir XML a base64
            xml_base64 = base64.b64encode(xml_sellado.encode('utf-8')).decode('utf-8')
            
            # Preparar SOAP request
            soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:apps="http://apps.services.soap.finkok.com">
   <soapenv:Header/>
   <soapenv:Body>
      <apps:stamp>
         <apps:xml>{xml_base64}</apps:xml>
         <apps:username>{self.username}</apps:username>
         <apps:password>{self.password}</apps:password>
      </apps:stamp>
   </soapenv:Body>
</soapenv:Envelope>"""
            
            # Enviar request
            headers = {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://apps.services.soap.finkok.com/stamp'
            }
            
            response = requests.post(
                f'{self.base_url}/stamp',
                data=soap_body,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Parsear respuesta SOAP
                return self._parse_stamp_response(response.text)
            else:
                return {
                    'success': False,
                    'error': f'Error HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al timbrar: {str(e)}'
            }
    
    def _parse_stamp_response(self, soap_response: str) -> Dict:
        """
        Parsea la respuesta SOAP de Finkok
        """
        from lxml import etree
        
        try:
            root = etree.fromstring(soap_response.encode('utf-8'))
            
            # Buscar XML timbrado en la respuesta
            namespaces = {
                'soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'apps': 'http://apps.services.soap.finkok.com'
            }
            
            # Verificar si hay error
            fault = root.find('.//soap:Fault', namespaces)
            if fault is not None:
                error_msg = fault.find('.//faultstring').text
                return {
                    'success': False,
                    'error': error_msg
                }
            
            # Extraer XML timbrado
            xml_element = root.find('.//apps:xml', namespaces)
            if xml_element is not None:
                xml_timbrado = base64.b64decode(xml_element.text).decode('utf-8')
                
                # Extraer UUID del XML timbrado
                uuid = self._extract_uuid(xml_timbrado)
                fecha_timbrado = self._extract_fecha_timbrado(xml_timbrado)
                
                return {
                    'success': True,
                    'uuid': uuid,
                    'xml_timbrado': xml_timbrado,
                    'fecha_timbrado': fecha_timbrado
                }
            
            return {
                'success': False,
                'error': 'No se encontró XML timbrado en la respuesta'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al parsear respuesta: {str(e)}'
            }
    
    def _extract_uuid(self, xml_timbrado: str) -> str:
        """
        Extrae el UUID del XML timbrado
        """
        from lxml import etree
        
        root = etree.fromstring(xml_timbrado.encode('utf-8'))
        
        # Buscar complemento TimbreFiscalDigital
        namespaces = {
            'cfdi': 'http://www.sat.gob.mx/cfd/4',
            'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'
        }
        
        timbre = root.find('.//tfd:TimbreFiscalDigital', namespaces)
        if timbre is not None:
            return timbre.get('UUID', '')
        
        return ''
    
    def _extract_fecha_timbrado(self, xml_timbrado: str) -> str:
        """
        Extrae la fecha de timbrado del XML
        """
        from lxml import etree
        
        root = etree.fromstring(xml_timbrado.encode('utf-8'))
        
        namespaces = {
            'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'
        }
        
        timbre = root.find('.//tfd:TimbreFiscalDigital', namespaces)
        if timbre is not None:
            return timbre.get('FechaTimbrado', '')
        
        return ''
    
    def cancelar(self, uuid: str, motivo: str, uuid_sustitucion: Optional[str] = None) -> Dict:
        """
        Cancela un CFDI con Finkok
        """
        try:
            soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:apps="http://apps.services.soap.finkok.com">
   <soapenv:Header/>
   <soapenv:Body>
      <apps:cancel>
         <apps:UUIDS>
            <apps:uuids>{uuid}</apps:uuids>
         </apps:UUIDS>
         <apps:username>{self.username}</apps:username>
         <apps:password>{self.password}</apps:password>
         <apps:taxpayer_id></apps:taxpayer_id>
         <apps:cer></apps:cer>
         <apps:key></apps:key>
      </apps:cancel>
   </soapenv:Body>
</soapenv:Envelope>"""
            
            headers = {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://apps.services.soap.finkok.com/cancel'
            }
            
            response = requests.post(
                f'{self.base_url}/cancel',
                data=soap_body,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'acuse': response.text
                }
            else:
                return {
                    'success': False,
                    'error': f'Error HTTP {response.status_code}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al cancelar: {str(e)}'
            }
    
    def consultar_estatus(self, uuid: str) -> Dict:
        """
        Consulta estatus de un CFDI
        """
        # TODO: Implementar consulta de estatus
        return {
            'success': False,
            'error': 'No implementado'
        }


class PACFactory:
    """
    Factory para crear instancias de servicios PAC
    """
    
    @staticmethod
    def get_pac_service(provider: str = None) -> PACServiceBase:
        """
        Obtiene una instancia del servicio PAC configurado
        
        Args:
            provider: Nombre del proveedor (finkok, sw_sapien, etc.)
                     Si es None, usa el configurado en settings
        
        Returns:
            PACServiceBase: Instancia del servicio PAC
        """
        if provider is None:
            provider = getattr(settings, 'PAC_PROVIDER', 'finkok')
        
        providers = {
            'finkok': FinkokPACService,
            # 'sw_sapien': SWSapienPACService,  # TODO: Implementar
            # 'facturaxion': FacturaxionPACService,  # TODO: Implementar
        }
        
        service_class = providers.get(provider.lower())
        if service_class is None:
            raise ValueError(f'Proveedor PAC no soportado: {provider}')
        
        return service_class()


# Ejemplo de uso
"""
from contabilidad.services.pac_service import PACFactory

# Obtener servicio PAC
pac = PACFactory.get_pac_service('finkok')

# Timbrar CFDI
resultado = pac.timbrar(xml_sellado)

if resultado['success']:
    print(f"UUID: {resultado['uuid']}")
    print(f"Fecha: {resultado['fecha_timbrado']}")
else:
    print(f"Error: {resultado['error']}")
"""
