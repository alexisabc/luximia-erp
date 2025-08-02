from decimal import Decimal
from django.test import TestCase
from ..models import Proyecto, Cliente, Presupuesto, Contrato


class ContratoModelTests(TestCase):
    def setUp(self):
        self.proyecto = Proyecto.objects.create(nombre="Proyecto X")
        self.cliente = Cliente.objects.create(nombre_completo="Cliente 1")
        self.presupuesto = Presupuesto.objects.create(
            proyecto=self.proyecto,
            cliente=self.cliente,
            monto_total=Decimal('1000.00')
        )
        self.contrato = Contrato.objects.create(presupuesto=self.presupuesto)

    def test_registrar_abono_actualiza_saldo(self):
        self.contrato.registrar_abono(Decimal('200.00'))
        self.contrato.refresh_from_db()
        self.assertEqual(self.contrato.abonos, Decimal('200.00'))
        self.assertEqual(self.contrato.saldo_pendiente, Decimal('800.00'))

    def test_abono_no_excede_saldo(self):
        with self.assertRaises(ValueError):
            self.contrato.registrar_abono(Decimal('2000.00'))
