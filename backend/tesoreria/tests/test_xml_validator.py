import pytest
from decimal import Decimal
from tesoreria.services.xml_validator import XMLValidatorService

class TestXMLValidator:
    def test_parse_cfdi_valid(self):
        # Simular XML CFDI 4.0
        xml_content = b"""<?xml version="1.0" encoding="utf-8"?>
        <cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Total="1000.00" Moneda="MXN">
            <cfdi:Emisor Rfc="TEST010101AAA" Nombre="Empresa Test"/>
            <cfdi:Receptor Rfc="LUX010101BBB" Nombre="Luximia"/>
            <cfdi:Complemento>
                <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" UUID="12345-ABCDE"/>
            </cfdi:Complemento>
        </cfdi:Comprobante>
        """
        
        data = XMLValidatorService.parse_cfdi(xml_content)
        
        assert data['total'] == Decimal('1000.00')
        assert data['rfc_emisor'] == 'TEST010101AAA'
        assert data['uuid'] == '12345-ABCDE'

    def test_parse_invalid_xml(self):
        with pytest.raises(ValueError):
            XMLValidatorService.parse_cfdi(b"Not an XML")
