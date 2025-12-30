import pytest
from rrhh.models import (
    Nomina, ReciboNomina, DetalleReciboItem, Empleado, RazonSocial, 
    ConceptoNomina, TipoConcepto, Departamento, Puesto, EmpleadoDocumentacionOficial
)
from rrhh.services.pdf_generator import NominaPDFService
from decimal import Decimal
from datetime import date
from django.contrib.auth import get_user_model

from unittest.mock import patch, MagicMock

@pytest.mark.django_db
class TestNominaPDFGenerator:
    @patch('rrhh.services.pdf_generator.pisa')
    def test_generar_pdf_bytes(self, mock_pisa):
        # Mock pisaDocument to simulate PDF generation
        def side_effect(source, dest):
            dest.write(b'%PDF-1.4 Mock')
            return MagicMock(err=0)
        
        mock_pisa.pisaDocument.side_effect = side_effect

        # 1. Setup
        rs = RazonSocial.objects.create(nombre_o_razon_social="Empresa PDF S.A.", rfc="AAA010101AAA")
        dep = Departamento.objects.create(nombre="Admin")
        puesto = Puesto.objects.create(nombre="Gerente", departamento=dep)
        
        User = get_user_model()
        username = "pdf.test"
        if not User.objects.filter(username=username).exists():
             user = User.objects.create(username=username)
        else:
             user = User.objects.get(username=username)

        emp = Empleado.objects.create(
            user=user, nombres="Pedro", apellido_paterno="Picapiedra",
            razon_social=rs, puesto=puesto, departamento=dep, no_empleado="999"
        )
        EmpleadoDocumentacionOficial.objects.create(empleado=emp, rfc="PAPI990101AAA")

        nomina = Nomina.objects.create(
            descripcion="Nomina PDF",
            fecha_inicio=date(2025, 2, 1),
            fecha_fin=date(2025, 2, 15),
            fecha_pago=date(2025, 2, 15),
            razon_social=rs
        )

        recibo = ReciboNomina.objects.create(
            nomina=nomina, empleado=emp,
            salario_diario=500, sbc=520, subtotal=7500, descuentos=1000, neto=6500, dias_pagados=15
        )
        
        c1 = ConceptoNomina.objects.create(codigo="PDF_P001", nombre="Sueldo", tipo=TipoConcepto.PERCEPCION)
        c2 = ConceptoNomina.objects.create(codigo="PDF_D002", nombre="ISR", tipo=TipoConcepto.DEDUCCION)
        
        DetalleReciboItem.objects.create(recibo=recibo, concepto=c1, nombre_concepto="Sueldo", monto_total=7500)
        DetalleReciboItem.objects.create(recibo=recibo, concepto=c2, nombre_concepto="ISR", monto_total=1000)

        # 2. Execution
        pdf_bytes = NominaPDFService.generar_pdf(recibo)

        # 3. Validation
        assert pdf_bytes is not None
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b'%PDF')
