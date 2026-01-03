from abc import ABC, abstractmethod
import uuid
import random
import logging

logger = logging.getLogger(__name__)

class PACProvider(ABC):
    @abstractmethod
    def timbrar(self, xml_sellado: str) -> tuple[str, str]:
        """
        Envía el XML sellado al PAC.
        Retorna: (xml_timbrado, uuid)
        """
        pass
        
    @abstractmethod
    def cancelar(self, uuid: str, motivo: str = "02", folio_sustitucion: str = None) -> bool:
        pass

class MockPACProvider(PACProvider):
    def timbrar(self, xml_sellado: str) -> tuple[str, str]:
        logger.info("MOCK PAC: Timbrando XML...")
        from lxml import etree
        
        if isinstance(xml_sellado, str):
            xml_bytes = xml_sellado.encode('utf-8')
        else:
            xml_bytes = xml_sellado
            
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_bytes, parser)
        
        # NS definition
        tfd_ns = "http://www.sat.gob.mx/TimbreFiscalDigital"
        xsi_ns = "http://www.w3.org/2001/XMLSchema-instance"
        
        # Ensure nsmap handles prefix correctly? lxml handles it if we pass nsmap to Element
        # But root already has namespaces.
        
        timbre = etree.Element(f"{{{tfd_ns}}}TimbreFiscalDigital", nsmap={'tfd': tfd_ns})
        timbre.set(f"{{{xsi_ns}}}schemaLocation", f"{tfd_ns} http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd")
        timbre.set("Version", "1.1")
        
        new_uuid = str(uuid.uuid4()).upper()
        timbre.set("UUID", new_uuid)
        import datetime
        timbre.set("FechaTimbrado", datetime.datetime.now().isoformat())
        timbre.set("RfcProvCertif", "SAT970701NN3")
        timbre.set("SelloCFD", root.get("Sello") or "SELLO_NO_ENCONTRADO")
        timbre.set("NoCertificadoSAT", "00001000000504465028")
        timbre.set("SelloSAT", "MOCK_SELLO_SAT_" + "X"*50)
        
        # Find Complemento
        complemento = root.find(f"{{http://www.sat.gob.mx/cfd/4}}Complemento")
        if complemento is None:
            complemento = etree.SubElement(root, f"{{http://www.sat.gob.mx/cfd/4}}Complemento")
            
        complemento.append(timbre)
        
        return etree.tostring(root, encoding='UTF-8').decode('UTF-8'), new_uuid

    def cancelar(self, uuid: str, motivo: str = "02", folio_sustitucion: str = None) -> bool:
        logger.info(f"MOCK PAC: Cancelando UUID {uuid}")
        return True

class SWSapienProvider(PACProvider):
    def __init__(self, token=None, url=None):
        self.token = token
        self.url = url or "https://services.test.sw.com.mx" # URL de pruebas

    def timbrar(self, xml_sellado: str) -> tuple[str, str]:
        # Implementación real con requests
        # ...
        raise NotImplementedError("SW Sapien implementation pending")

    def cancelar(self, uuid: str, motivo: str = "02", folio_sustitucion: str = None) -> bool:
        raise NotImplementedError("SW Sapien implementation pending")
