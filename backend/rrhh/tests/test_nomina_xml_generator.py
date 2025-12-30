import pytest
from decimal import Decimal
import xml.etree.ElementTree as ET
from rrhh.models import (
    Nomina, ReciboNomina, DetalleReciboItem, Empleado, RazonSocial, 
    ConceptoNomina, TipoConcepto, Departamento, Puesto, EmpleadoDatosLaborales,
    EmpleadoDocumentacionOficial
)
from rrhh.services.xml_generator import NominaXMLGenerator
from django.contrib.auth import get_user_model

@pytest.mark.django_db
class TestNominaXMLGenerator:
    def test_generar_xml_cfdi_40(self):
        # 1. Setup
        rs = RazonSocial.objects.create(nombre_o_razon_social="Empresa X S.A. de C.V.", rfc="AAA010101AAA")
        dep = Departamento.objects.create(nombre="TI")
        puesto = Puesto.objects.create(nombre="Dev", departamento=dep)
        
        User = get_user_model()
        # Ensure unique username
        username = "xml.test.user"
        if not User.objects.filter(username=username).exists():
           user = User.objects.create(username=username, email="xml@test.com")
        else:
           user = User.objects.get(username=username)

        emp = Empleado.objects.create(
            user=user, 
            nombres="Juan", 
            apellido_paterno="Perez", 
            razon_social=rs, 
            puesto=puesto, 
            departamento=dep, 
            no_empleado="123"
        )
        
        from datetime import date
        # Datos extra requeridos
        EmpleadoDatosLaborales.objects.create(empleado=emp, fecha_ingreso=date(2024, 1, 1), salario_diario=Decimal(300))
        EmpleadoDocumentacionOficial.objects.create(empleado=emp, rfc="PEPJ8001019Q8", curp="PEPJ800101HDFRXX01")
        
        # Nomina
        nomina = Nomina.objects.create(
             descripcion="Nomina Test",
             fecha_inicio=date(2025, 1, 1),
             fecha_fin=date(2025, 1, 15),
             fecha_pago=date(2025, 1, 15),
             razon_social=rs
        )
        
        recibo = ReciboNomina.objects.create(
            nomina=nomina,
            empleado=emp,
            salario_diario=300,
            sbc=320,
            subtotal=5000,
            descuentos=200,
            neto=4800,
            dias_pagados=15
        )
        
        # Detalles
        c_sueldo = ConceptoNomina.objects.create(codigo="P001", nombre="Sueldo", tipo=TipoConcepto.PERCEPCION, clave_sat="001")
        c_isr = ConceptoNomina.objects.create(codigo="D002", nombre="ISR", tipo=TipoConcepto.DEDUCCION, clave_sat="002")
        
        DetalleReciboItem.objects.create(
            recibo=recibo, concepto=c_sueldo, nombre_concepto="Sueldo", 
            monto_gravado=5000, monto_exento=0, monto_total=5000, clave_sat="001"
        )
        DetalleReciboItem.objects.create(
            recibo=recibo, concepto=c_isr, nombre_concepto="ISR", 
            monto_gravado=0, monto_exento=0, monto_total=200, clave_sat="002"
        )
        
        # 2. Execution
        xml_str = NominaXMLGenerator.generar_xml(recibo)
        
        # 3. Validation
        root = ET.fromstring(xml_str)
        
        ns = {
            'cfdi': 'http://www.sat.gob.mx/cfd/4',
            'nomina12': 'http://www.sat.gob.mx/nomina12'
        }
        
        assert root.tag == f"{{{ns['cfdi']}}}Comprobante"
        assert root.attrib['Version'] == "4.0"
        assert root.attrib['TipoDeComprobante'] == "N"
        assert root.attrib['Moneda'] == "MXN"
        assert Decimal(root.attrib['SubTotal']).quantize(Decimal("0.01")) == Decimal('5000.00')
        assert Decimal(root.attrib['Descuento']).quantize(Decimal("0.01")) == Decimal('200.00')
        assert Decimal(root.attrib['Total']).quantize(Decimal("0.01")) == Decimal('4800.00')
        
        # Complemento
        complemento = root.find('cfdi:Complemento', ns)
        assert complemento is not None
        nomina_node = complemento.find('nomina12:Nomina', ns)
        assert nomina_node is not None
        assert nomina_node.attrib['Version'] == "1.2"
        
        # Check Percepciones
        percepciones = nomina_node.find('nomina12:Percepciones', ns)
        assert percepciones is not None
        assert Decimal(percepciones.attrib['TotalSueldos']).quantize(Decimal("0.01")) == Decimal('5000.00')
        
        # Check Deducciones
        deducciones = nomina_node.find('nomina12:Deducciones', ns)
        assert deducciones is not None
        assert Decimal(deducciones.attrib['TotalOtrasDeducciones']).quantize(Decimal("0.01")) == Decimal('0.00')
        # ImpuestosRetenidos usually maps to ISR in TotalImpuestosRetenidos
        assert Decimal(deducciones.attrib['TotalImpuestosRetenidos']).quantize(Decimal("0.01")) == Decimal('200.00')
