from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from obras.models import Obra, Estimacion
from obras.services.closure_service import ClosureService
from tesoreria.models import CuentaBancaria, Egreso
from contabilidad.models import Banco
from core.models.empresa import Empresa

User = get_user_model()

class ClosureServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(username='testadmin', password='password', email='test@test.com')
        
        self.empresa = Empresa.objects.create(
            codigo="LUX01",
            razon_social="Luximia Test S.A. de C.V.",
            nombre_comercial="Luximia",
            rfc="LUX210101AA1",
            regimen_fiscal="601",
            codigo_postal="77500",
            calle="Av. Bonampak",
            numero_exterior="100",
            colonia="Centro",
            municipio="Cancún",
            estado="Quintana Roo"
        )
        
        self.obra = Obra.objects.create(
            empresa=self.empresa,
            nombre="Proyecto Test Cierre",
            codigo="PRJ-TEST-001",
            fecha_inicio="2026-01-01",
            presupuesto_total=Decimal("1000000.00"),
            estado='EJECUCION'
        )
        
        # Create a bank account for the retention release
        self.banco = Banco.objects.create(clave="012", nombre_corto="BBVA", razon_social="BBVA BANCOMER")
        self.cuenta = CuentaBancaria.objects.create(
            empresa=self.empresa,
            numero_cuenta="1234567890",
            banco=self.banco,
            moneda="MXN"
        )

        # Create some estimations with retention
        Estimacion.objects.create(
            obra=self.obra,
            fecha_corte="2026-01-15",
            monto_avance=Decimal("100000.00"),
            fondo_garantia=Decimal("5000.00"),
            subtotal=Decimal("95000.00"),
            iva=Decimal("15200.00"),
            total=Decimal("110200.00"),
            estado='PAGADA'
        )

        Estimacion.objects.create(
            obra=self.obra,
            fecha_corte="2026-01-30",
            monto_avance=Decimal("200000.00"),
            fondo_garantia=Decimal("10000.00"),
            subtotal=Decimal("190000.00"),
            iva=Decimal("30400.00"),
            total=Decimal("220400.00"),
            estado='PAGADA'
        )

    def test_liquidar_fondo_garantia_creates_egreso(self):
        """
        GIVEN: An obra with paid estimations and accumulated retention.
        WHEN: ClosureService.liquidar_fondo_garantia is called.
        THEN: An Egreso should be created in Tesoreria for the total retention amount.
        """
        # Call the method (which will fail initially as it's not fully implemented)
        egreso = ClosureService.liquidar_fondo_garantia(
            obra_id=self.obra.id,
            cuenta_id=self.cuenta.id,
            usuario_id=self.user.id
        )
        
        self.assertIsNotNone(egreso)
        self.assertEqual(egreso.monto, Decimal("15000.00"))
        self.assertEqual(egreso.obra, self.obra)
        self.assertEqual(egreso.estado, 'BORRADOR')
        self.assertIn("Fondo de Garantía", egreso.concepto)
        
        self.assertTrue(Egreso.objects.filter(id=egreso.id).exists())
