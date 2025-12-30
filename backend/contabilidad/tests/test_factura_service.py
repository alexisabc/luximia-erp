import pytest
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from contabilidad.models import Factura, Moneda, MetodoPago
from contabilidad.services.factura_service import FacturaService
# Mocking parse_cfdi call to avoid depending on external XML parser file existence or correctness for this unit test
from unittest.mock import patch

@pytest.mark.django_db
class TestFacturaService:
    @pytest.fixture
    def mock_parsed_data(self):
        return {
            'version': '4.0',
            'uuid': '12345678-1234-1234-1234-123456789012',
            'serie': 'A',
            'folio': '100',
            'fecha_emision': '2023-01-01T12:00:00',
            'fecha_timbrado': '2023-01-01T12:05:00',
            'rfc_emisor': 'AAA010101AAA',
            'nombre_emisor': 'EMPRESA PRUEBA',
            'regimen_emisor': '601',
            'rfc_receptor': 'ZZZ010101ZZZ',
            'nombre_receptor': 'CLIENTE PRUEBA',
            'regimen_receptor': '601',
            'uso_cfdi': 'G03',
            'total': Decimal('1160.00'),
            'subtotal': Decimal('1000.00'),
            'moneda': 'MXN',
            'tipo_cambio': Decimal('1.0'),
            'tipo_comprobante': 'I',
            'metodo_pago': 'PUE'
        }

    # We patch correctly where it is imported in the service
    @patch('contabilidad.services.factura_service.parse_cfdi') 
    def test_process_factura_success(self, mock_parse, mock_parsed_data):
        mock_parse.return_value = mock_parsed_data
        
        # Create dummy file
        xml_content = b"<dummy></dummy>"
        archivo = SimpleUploadedFile("factura.xml", xml_content, content_type="text/xml")
        
        result = FacturaService.procesar_factura(archivo)
        
        assert result['status'] == 'success'
        assert result['uuid'] == '12345678-1234-1234-1234-123456789012'
        
        assert Factura.objects.count() == 1
        factura = Factura.objects.first()
        assert factura.emisor_rfc == 'AAA010101AAA'
        assert factura.total == Decimal('1160.00')

    @patch('contabilidad.services.factura_service.parse_cfdi')
    def test_process_factura_duplicate(self, mock_parse, mock_parsed_data):
        mock_parse.return_value = mock_parsed_data
        
        archivo = SimpleUploadedFile("factura.xml", b"<dummy></dummy>", content_type="text/xml")
        
        # First process
        FacturaService.procesar_factura(archivo)
        
        # Second process (duplicate)
        archivo.seek(0)
        result = FacturaService.procesar_factura(archivo)
        
        assert result['status'] == 'error'
        assert "ya existe" in result['mensaje']
