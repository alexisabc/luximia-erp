import pytest
from datetime import date
from django.test import override_settings
from rrhh.models import Nomina, ReciboNomina, Empleado, RazonSocial, ConceptoNomina, DetalleReciboItem, Departamento, Puesto
from rrhh.services.nomina_orchestrator import NominaOrchestrator
from contabilidad.services.pac.factory import PACFactory

@pytest.mark.django_db
class TestTimbradoMasivo:
    def setup_method(self):
        # Infraestructura mínima
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(username="juan.perez", password="password")
        
        self.depto = Departamento.objects.create(nombre="TI")
        self.puesto = Puesto.objects.create(nombre="Dev", departamento=self.depto)

        self.rs = RazonSocial.objects.create(nombre_o_razon_social="Empresa TDD", rfc="AAA010101AAA")
        
        self.empleado = Empleado.objects.create(
            user=self.user,
            nombres="Juan", apellido_paterno="Perez", 
            razon_social=self.rs, puesto=self.puesto, departamento=self.depto
        )
        
        # Necesario para XML Generator
        from rrhh.models import EmpleadoDocumentacionOficial
        EmpleadoDocumentacionOficial.objects.create(
            empleado=self.empleado,
            rfc="XAXX010101000",
            curp="AAAA010101AAAAAA01"
        )
        
        self.nomina = Nomina.objects.create(
            razon_social=self.rs,
            descripcion="Nomina TDD",
            fecha_inicio=date(2025,1,1),
            fecha_fin=date(2025,1,15),
            fecha_pago=date(2025,1,15),
            estado='CALCULADA'
        )
        
        self.recibo = ReciboNomina.objects.create(
            nomina=self.nomina,
            empleado=self.empleado,
            salario_diario=100,
            sbc=105,
            subtotal=1000,
            descuentos=100,
            neto=900
        )
        
        self.c_sueldo = ConceptoNomina.objects.create(
            codigo="001", nombre="Sueldo", tipo="PERCEPCION", clave_sat="001", cuenta_contable="6001"
        )
        
        DetalleReciboItem.objects.create(
            recibo=self.recibo, concepto=self.c_sueldo, 
            monto_total=1000, monto_gravado=1000, monto_exento=0
        )

    @override_settings(PAC_PROVIDER='MOCK')
    def test_timbrado_nomina_completo(self):
        """
        Prueba de integración: Orquestador -> XMLGenerator -> PAC (Mock) -> BD Update
        """
        # Ejecutar timbrado via Orchestrator
        # Si el método no existe aún, esto fallará (Red Phase)
        NominaOrchestrator.timbrar_nomina(self.nomina.id)
        
        # Validaciones
        self.recibo.refresh_from_db()
        
        # 1. UUID asignado
        assert self.recibo.uuid is not None
        assert "MOCK-UUID" in self.recibo.uuid
        
        # 2. XML Guardado
        assert self.recibo.xml_timbrado is not None
        assert "TimbreFiscalDigital" in self.recibo.xml_timbrado
        
        # 3. Estado de la Nómina (Opcional, si la lógica lo actualiza)
        self.nomina.refresh_from_db()
        assert self.nomina.estado == 'TIMBRADA' or self.nomina.estado == 'PARCIAL'
