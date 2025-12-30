import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rrhh.models import (
    Nomina, ReciboNomina, Empleado, RazonSocial, Departamento, Puesto,
    EmpleadoDatosLaborales, ConceptoNomina, TipoConcepto
)
from rrhh.services.nomina_orchestrator import NominaOrchestrator

@pytest.mark.django_db
class TestNominaOrchestrator:
    def test_procesar_nomina_masiva(self):
        # 1. Setup Data
        rs = RazonSocial.objects.create(nombre_o_razon_social="Empresa Test", rfc="AAA010101AAA")
        dep = Departamento.objects.create(nombre="TI")
        puesto = Puesto.objects.create(nombre="Dev", departamento=dep)
        
        # Conceptos necesarios (Mock Catalog)
        c_sueldo = ConceptoNomina.objects.create(codigo="P001", nombre="Sueldo", tipo=TipoConcepto.PERCEPCION)
        c_isr = ConceptoNomina.objects.create(codigo="D002", nombre="ISR", tipo=TipoConcepto.DEDUCCION)
        c_imss = ConceptoNomina.objects.create(codigo="D001", nombre="IMSS", tipo=TipoConcepto.DEDUCCION)
        
        # Empleados
        emp1 = self._create_employee("Juan", "Perez", rs, puesto, Decimal('10000'))
        emp2 = self._create_employee("Maria", "Gomez", rs, puesto, Decimal('12000'))
        
        # Nomina Header
        nomina = Nomina.objects.create(
            descripcion="Nomina Ene Q1 2025",
            fecha_inicio="2025-01-01",
            fecha_fin="2025-01-15",
            fecha_pago="2025-01-15",
            razon_social=rs
        )
        
        # 2. Execution
        NominaOrchestrator.procesar_nomina(nomina.id)
        
        # 3. Assertions
        # Verificar que se crearon 2 recibos
        assert ReciboNomina.objects.filter(nomina=nomina).count() == 2
        
        # Verificar Recibo 1 (Juan)
        recibo1 = ReciboNomina.objects.get(nomina=nomina, empleado=emp1)
        # 10k mensual -> 5k quincenal (aprox 4999-5001)
        # CalculoService returns Sueldo Bruto.
        assert recibo1.subtotal >= Decimal('4999.00')
        assert recibo1.neto < recibo1.subtotal # Deducciones aplicadas
        assert recibo1.detalles.count() >= 3 # Sueldo, ISR, IMSS
        
        # Verificar Totales Nomina Header
        nomina.refresh_from_db()
        total_recibos_neto = recibo1.neto + ReciboNomina.objects.get(empleado=emp2).neto
        assert nomina.total_neto == total_recibos_neto
        assert nomina.estado == 'CALCULADA'
    
    def _create_employee(self, nombre, apellido, rs, puesto, mensual_bruto):
        User = get_user_model()
        username = f"{nombre}.{apellido}".lower()
        if not User.objects.filter(username=username).exists():
            user = User.objects.create(username=username, email=f"{nombre}@test.com")
        else:
            user = User.objects.get(username=username)
            
        emp = Empleado.objects.create(
            user=user, nombres=nombre, apellido_paterno=apellido,
            razon_social=rs, puesto=puesto, departamento=puesto.departamento
        )
        
        EmpleadoDatosLaborales.objects.create(
            empleado=emp,
            ingresos_mensuales_brutos=mensual_bruto,
            salario_diario=mensual_bruto / 30,
            salario_diario_integrado=(mensual_bruto / 30) * Decimal('1.0452'),
            periodicidad_pago="Quincenal"
        )
        return emp
