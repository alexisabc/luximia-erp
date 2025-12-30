import time
from .base_provider import PACProvider

class MockPACProvider(PACProvider):
    """
    Simulador de PAC para entornos de desarrollo y testing.
    No realiza conexiones externas.
    """

    def timbrar(self, xml_content: str, sello_digital: str = None) -> dict:
        # Simulación de latencia de red
        time.sleep(0.5)
        
        # Inyectar nodo simulado de TimbreFiscalDigital si no existe
        xml_timbrado = xml_content
        if "TimbreFiscalDigital" not in xml_content:
             # Inserción rústica para simulación
             mock_tfd = (
                 '<cfdi:Complemento>'
                 '<tfd:TimbreFiscalDigital '
                 'xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" '
                 'UUID="12345-MOCK-UUID-67890" '
                 'FechaTimbrado="2025-01-01T12:00:00" '
                 'SelloSAT="MOCK_SELLO_SAT" '
                 'Version="1.1" />'
                 '</cfdi:Complemento>'
             )
             xml_timbrado = xml_content.replace('</cfdi:Comprobante>', f'{mock_tfd}</cfdi:Comprobante>')

        return {
            'success': True,
            'uuid': '12345-MOCK-UUID-67890',
            'xml_timbrado': xml_timbrado,
            'error': None
        }

    def cancelar(self, uuid: str, motivo: str, folio_sustitucion: str = None, rfc_receptor: str = None, total: float = 0) -> dict:
        time.sleep(0.5)
        return {
            'success': True,
            'acuse': f'<AcuseCancelacion UUID="{uuid}" Estatus="Cancelado sin aceptación" />',
            'estatus_cancelacion': 'Cancelado',
            'error': None
        }
