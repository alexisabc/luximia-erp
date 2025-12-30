import pytest
from decimal import Decimal
from contabilidad.services.diot_service import DIOTService

class MockProveedor:
    def __init__(self, tipo_tercero, tipo_operacion, rfc, id_fiscal='', nombre='', pais='', nacionalidad=''):
        self.tipo_tercero = tipo_tercero
        self.tipo_operacion = tipo_operacion
        self.rfc = rfc
        self.id_fiscal = id_fiscal or ''
        self.nombre_completo = nombre or '' # Usando nombre_completo como en modelo Vendedor
        self.pais = pais or ''
        self.nacionalidad = nacionalidad or ''

class MockPago:
    def __init__(self, proveedor, monto, tasa_iva=Decimal('0.16')):
        self.proveedor = proveedor
        self.monto = monto
        self.tasa_iva = tasa_iva

class TestDIOTService:
    def test_generate_line_nacional_iva16(self):
        prov = MockProveedor('04', '85', 'AAA010101AAA')
        pago = MockPago(prov, Decimal('1160.00'), tasa_iva=Decimal('0.16'))
        
        # Base = 1160 / 1.16 = 1000. IVA = 160.
        # Layout expected: 04|85|AAA010101AAA|||||1000|...
        
        line = DIOTService.generar_linea_proveedor(pago)
        parts = line.split('|')
        
        assert parts[0] == '04' # Tipo Tercero
        assert parts[1] == '85' # Tipo Operacion
        assert parts[2] == 'AAA010101AAA' # RFC
        assert parts[3] == '' # ID Fiscal
        assert parts[7] == '1000' # Campo 8: Actos 16% (Base)

    def test_generate_line_extranjero(self):
        prov = MockProveedor('05', '85', 'XEXX010101000', id_fiscal='TAXID123', nombre='CORP EXT', pais='USA', nacionalidad='USA')
        # Pagos al extranjero a veces son importación o tasa 0. Asumiremos Importación 16% para variar o Tasa 0.
        # Para simplificar TDD inicial, lo mapeamos a Importación 16% (Campo 9) o similar según lógica servicio.
        # Vamos a asumir Tasa 0% (Campo 12 - Index 11?)
        # Layout: ...|Base16|BaseImp16|Base8|BaseImp8|Base0...
        # 8: 16%, 9: Imp16%, 10: 8%, 11: Imp8%, 12: 0%.
        
        pago = MockPago(prov, Decimal('500.00'), tasa_iva=Decimal('0.00')) 
        
        line = DIOTService.generar_linea_proveedor(pago)
        parts = line.split('|')
        
        assert parts[0] == '05'
        assert parts[3] == 'TAXID123'
        assert parts[4] == 'CORP EXT'
        # Check mapping to 0% column (Index 11? Need to verify column index in implementation)
