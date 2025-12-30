import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from tesoreria.models import CuentaBancaria
from tesoreria.services.conciliacion_service import ConciliacionService
from contabilidad.models import Banco, Moneda
from core.models import Empresa

User = get_user_model()

@pytest.mark.django_db
class TestConciliacionService:
    @pytest.fixture
    def setup_account(self):
        # Datos de prueba
        user = User.objects.create_user(username='tester_conciliacion', password='password')
        moneda = Moneda.objects.create(codigo='MXN', nombre='Peso')
        banco = Banco.objects.create(clave='002', nombre_corto='BBVA', razon_social='BBVA Bancomer')
        
        empresa = Empresa.objects.create(
            codigo='LUX02', razon_social='Empresa 2', rfc='BBB020202BBB',
            calle='Calle 2', codigo_postal='00000', regimen_fiscal='601',
            nombre_comercial='Empresa 2', colonia='Col', municipio='Mun', estado='Est'
        )
        
        cuenta = CuentaBancaria.objects.create(
            banco=banco, empresa=empresa, numero_cuenta='9876543210',
            moneda=moneda, saldo_actual=Decimal('10000.00'),
            saldo_bancario=Decimal('0.00')
        )
        return cuenta, user

    def test_conciliacion_balance_match(self, setup_account):
        """Verifica que si los saldos coinciden, la diferencia es 0."""
        cuenta, user = setup_account
        service = ConciliacionService()
        
        # Simulamos que el banco reporta el mismo saldo que el sistema (10,000)
        result = service.conciliar_cuenta(cuenta, Decimal('10000.00'), user)
        
        cuenta.refresh_from_db()
        assert cuenta.saldo_bancario == Decimal('10000.00')
        assert result['diferencia'] == Decimal('0.00')
        assert result['conciliada'] is True

    def test_conciliacion_balance_mismatch(self, setup_account):
        """Verifica que se calcula correctamente la diferencia."""
        cuenta, user = setup_account
        service = ConciliacionService()
        
        # El banco reporta menos dinero (9,000)
        result = service.conciliar_cuenta(cuenta, Decimal('9000.00'), user)
        
        cuenta.refresh_from_db()
        assert cuenta.saldo_bancario == Decimal('9000.00')
        # Diferencia: Sistema (10000) - Banco (9000) = 1000
        assert result['diferencia'] == Decimal('1000.00') 
        assert result['conciliada'] is False
