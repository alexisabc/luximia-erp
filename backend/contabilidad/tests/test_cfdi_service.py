"""
Tests para CFDIService
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from core.models import Empresa
from contabilidad.models import (
    Factura, ConceptoFactura, ImpuestoConcepto,
    Cliente, CFDIFormaPago, CFDIMetodoPago, CFDIClaveProdServ, CFDIUnidad
)
from contabilidad.services.cfdi_service import CFDIService


@pytest.fixture
def empresa(db):
    """Fixture para crear empresa de prueba"""
    return Empresa.objects.create(
        razon_social='Empresa Test SA de CV',
        rfc='ETE010101AAA',
        codigo_postal='01000'
    )


@pytest.fixture
def cliente(db, empresa):
    """Fixture para crear cliente de prueba"""
    return Cliente.objects.create(
        empresa=empresa,
        nombre_completo='Cliente Test',
        rfc='CTE010101BBB',
        codigo_postal='02000'
    )


@pytest.fixture
def catalogos(db):
    """Fixture para crear catálogos SAT"""
    forma_pago = CFDIFormaPago.objects.create(
        clave='03',
        descripcion='Transferencia'
    )
    
    metodo_pago = CFDIMetodoPago.objects.create(
        clave='PUE',
        descripcion='Pago en una exhibición'
    )
    
    clave_prod = CFDIClaveProdServ.objects.create(
        clave='01010101',
        descripcion='Servicio de prueba'
    )
    
    unidad = CFDIUnidad.objects.create(
        clave='E48',
        nombre='Unidad de servicio'
    )
    
    return {
        'forma_pago': forma_pago,
        'metodo_pago': metodo_pago,
        'clave_prod': clave_prod,
        'unidad': unidad
    }


@pytest.fixture
def factura_simple(db, empresa, cliente, catalogos):
    """Fixture para crear factura simple de prueba"""
    factura = Factura.objects.create(
        empresa=empresa,
        cliente=cliente,
        serie='A',
        folio='1',
        fecha=timezone.now(),
        forma_pago=catalogos['forma_pago'],
        metodo_pago=catalogos['metodo_pago'],
        lugar_expedicion='01000',
        moneda='MXN',
        tipo_cambio=Decimal('1.0'),
        subtotal=Decimal('1000.00'),
        descuento=Decimal('0.00'),
        total=Decimal('1160.00'),
        tipo_comprobante='I',
        estado='BORRADOR'
    )
    
    # Crear concepto
    concepto = ConceptoFactura.objects.create(
        factura=factura,
        numero_linea=1,
        clave_prod_serv=catalogos['clave_prod'],
        clave_unidad=catalogos['unidad'],
        descripcion='Servicio de consultoría',
        cantidad=Decimal('1.00'),
        valor_unitario=Decimal('1000.00'),
        importe=Decimal('1000.00'),
        descuento=Decimal('0.00'),
        objeto_imp='02'
    )
    
    # Crear impuesto (IVA 16%)
    ImpuestoConcepto.objects.create(
        concepto=concepto,
        tipo='TRASLADO',
        impuesto='002',  # IVA
        tipo_factor='Tasa',
        tasa_o_cuota=Decimal('0.160000'),
        base=Decimal('1000.00'),
        importe=Decimal('160.00')
    )
    
    return factura


@pytest.mark.django_db
class TestCFDIService:
    """Tests para el servicio de generación de CFDI"""
    
    def test_generar_xml_basico(self, factura_simple):
        """Test de generación de XML básico"""
        # Generar XML
        xml = CFDIService.generar_xml(factura_simple.id)
        
        # Verificaciones
        assert xml is not None
        assert '<?xml' in xml
        assert 'Comprobante' in xml
        assert 'Version="4.0"' in xml
        assert 'Folio="1"' in xml
        assert 'Total="1160.00"' in xml
        assert 'Emisor' in xml
        assert 'Receptor' in xml
        assert 'Conceptos' in xml
        
        # Verificar que se guardó en la factura
        factura_simple.refresh_from_db()
        assert factura_simple.xml_original == xml
    
    def test_calcular_totales_impuestos(self, factura_simple):
        """Test de cálculo de totales de impuestos"""
        # Calcular totales
        totales = CFDIService._calcular_totales_impuestos(factura_simple)
        
        # Verificar
        assert totales['total_traslados'] == Decimal('160.00')
        assert totales['total_retenciones'] == Decimal('0.00')
        assert len(totales['traslados']) == 1
    
    def test_xml_con_multiples_conceptos(self, empresa, cliente, catalogos):
        """Test con múltiples conceptos"""
        factura = Factura.objects.create(
            empresa=empresa,
            cliente=cliente,
            serie='A',
            folio='2',
            fecha=timezone.now(),
            forma_pago=catalogos['forma_pago'],
            metodo_pago=catalogos['metodo_pago'],
            lugar_expedicion='01000',
            moneda='MXN',
            tipo_cambio=Decimal('1.0'),
            subtotal=Decimal('2000.00'),
            total=Decimal('2320.00'),
            tipo_comprobante='I',
            estado='BORRADOR'
        )
        
        # Crear 2 conceptos
        for i in range(2):
            concepto = ConceptoFactura.objects.create(
                factura=factura,
                numero_linea=i+1,
                clave_prod_serv=catalogos['clave_prod'],
                clave_unidad=catalogos['unidad'],
                descripcion=f'Servicio {i+1}',
                cantidad=Decimal('1.00'),
                valor_unitario=Decimal('1000.00'),
                importe=Decimal('1000.00'),
                objeto_imp='02'
            )
            
            ImpuestoConcepto.objects.create(
                concepto=concepto,
                tipo='TRASLADO',
                impuesto='002',
                tipo_factor='Tasa',
                tasa_o_cuota=Decimal('0.160000'),
                base=Decimal('1000.00'),
                importe=Decimal('160.00')
            )
        
        # Generar XML
        xml = CFDIService.generar_xml(factura.id)
        
        # Verificar que tiene 2 conceptos
        assert xml.count('<cfdi:Concepto') == 2
        assert 'Servicio 1' in xml
        assert 'Servicio 2' in xml


@pytest.mark.django_db
class TestCFDIIntegration:
    """Tests de integración completos"""
    
    def test_flujo_completo_factura(self, factura_simple):
        """Test del flujo completo de facturación"""
        # 1. Generar XML
        xml = CFDIService.generar_xml(factura_simple.id)
        assert xml is not None
        
        # 2. Verificar que la factura se actualizó
        factura_simple.refresh_from_db()
        assert factura_simple.xml_original is not None
        
        # 3. Verificar estructura del XML
        assert 'Comprobante' in xml
        assert factura_simple.cliente.rfc in xml
        assert factura_simple.empresa.rfc in xml
