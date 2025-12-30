
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from tesoreria.models import Egreso, CuentaBancaria, ContraRecibo
from tesoreria.services.payment_service import PaymentService
from contabilidad.models import Banco, Moneda
from core.models import Empresa
from compras.models import Proveedor

User = get_user_model()

@pytest.mark.django_db
class TestPaymentService:
    @pytest.fixture
    def setup_data(self):
        # Create common dependencies
        self.user = User.objects.create_user(username='tester', email='test@example.com', password='password')
        self.moneda = Moneda.objects.create(codigo='MXN', nombre='Peso Mexicano')
        self.banco = Banco.objects.create(clave='001', nombre_corto='Banamex', razon_social='Banco Nacional de Mexico')
        self.empresa = Empresa.objects.create(
            codigo='LUX01',
            razon_social='Mi Empresa', 
            rfc='AAA010101AAA', 
            calle='Calle 1',
            codigo_postal='00000',
            regimen_fiscal='601',
            nombre_comercial='Mi Empresa',
            colonia='Colonia',
            municipio='Municipio',
            estado='Estado'
        )
        self.proveedor = Proveedor.objects.create(razon_social='Proveedor SA', rfc='PRO010101AAA', email_contacto='p@p.com')
        
        # Create Cuenta Bancaria with balance
        self.cuenta = CuentaBancaria.objects.create(
            banco=self.banco,
            empresa=self.empresa,
            numero_cuenta='1234567890',
            moneda=self.moneda,
            saldo_actual=Decimal('10000.00'),
            activa=True
        )
        
        # Create ContraRecibo
        self.contra_recibo = ContraRecibo.objects.create(
            proveedor=self.proveedor,
            moneda=self.moneda,
            total=Decimal('5000.00'),
            saldo_pendiente=Decimal('5000.00'),
            estado='VALIDADO',
            creado_por=self.user
        )
        
    def test_process_payment_success(self, setup_data):
        """
        Verify that processing a payment correctly updates balances and states.
        """
        # Create Authorized Egreso linked to ContraRecibo
        egreso = Egreso.objects.create(
            cuenta_bancaria=self.cuenta,
            monto=Decimal('5000.00'),
            fecha='2025-01-01',
            beneficiario='Proveedor SA',
            concepto='Pago Factura 1',
            estado='AUTORIZADO',
            solicitado_por=self.user,
            contra_recibo=self.contra_recibo
        )
        
        # Execute Service
        service = PaymentService()
        result = service.process_payment(egreso, self.user)
        
        # Reload objects from DB
        egreso.refresh_from_db()
        self.cuenta.refresh_from_db()
        self.contra_recibo.refresh_from_db()
        
        # Assertions
        assert result['success'] is True
        assert egreso.estado == 'PAGADO'
        assert self.cuenta.saldo_actual == Decimal('5000.00')  # 10000 - 5000
        assert self.contra_recibo.saldo_pendiente == Decimal('0.00')
        assert self.contra_recibo.estado == 'PAGADO'

    def test_process_payment_partial(self, setup_data):
        """
        Verify partial payment updates state to 'PAGADO_PARCIAL'.
        """
        # Partial payment of 2000
        egreso = Egreso.objects.create(
            cuenta_bancaria=self.cuenta,
            monto=Decimal('2000.00'),
            fecha='2025-01-01',
            beneficiario='Proveedor SA',
            concepto='Pago Parcial',
            estado='AUTORIZADO',
            solicitado_por=self.user,
            contra_recibo=self.contra_recibo
        )
        
        service = PaymentService()
        service.process_payment(egreso, self.user)
        
        self.contra_recibo.refresh_from_db()
        
        assert self.contra_recibo.saldo_pendiente == Decimal('3000.00') # 5000 - 2000
        assert self.contra_recibo.estado == 'PAGADO_PARCIAL'

    def test_process_payment_invalid_state(self, setup_data):
        """
        Verify that payment fails if Egreso is not AUTHORIZED.
        """
        egreso = Egreso.objects.create(
            cuenta_bancaria=self.cuenta,
            monto=Decimal('5000.00'),
            fecha='2025-01-01',
            beneficiario='Proveedor SA',
            concepto='Intento Pago Borrador',
            estado='BORRADOR', # Not Authorized
            solicitado_por=self.user,
            contra_recibo=self.contra_recibo
        )
        
        service = PaymentService()
        
        with pytest.raises(ValueError, match="El egreso debe estar autorizado"):
            service.process_payment(egreso, self.user)

