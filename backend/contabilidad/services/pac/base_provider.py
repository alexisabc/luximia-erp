from abc import ABC, abstractmethod

class PACProvider(ABC):
    """
    Clase abstracta que define el contrato para los proveedores de certificación (PAC).
    Implementa el Patrón Adapter para unificar la interfaz de diversos PACs.
    """

    @abstractmethod
    def timbrar(self, xml_content: str, sello_digital: str = None) -> dict:
        """
        Envía el XML firmado (con sello) al PAC para su timbrado.
        
        Args:
            xml_content (str): El contenido XML del CFDI.
            sello_digital (str, optional): El sello digital si se requiere pasar por separado.
            
        Returns:
            dict: {
                'success': bool,
                'uuid': str | None,
                'xml_timbrado': str | None,
                'error': str | None
            }
            
        Raises:
            NotImplementedError: Si la subclase no implementa este método.
        """
        raise NotImplementedError("El método 'timbrar' debe ser implementado.")

    @abstractmethod
    def cancelar(self, uuid: str, motivo: str, folio_sustitucion: str = None, rfc_receptor: str = None, total: float = 0) -> dict:
        """
        Solicita la cancelación de un CFDI.
        
        Returns:
            dict: {
                'success': bool,
                'acuse': str | None,
                'estatus_cancelacion': str | None, 
                'error': str | None
            }
        """
        raise NotImplementedError("El método 'cancelar' debe ser implementado.")
