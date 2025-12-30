import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from tesoreria.models import CuentaBancaria, MovimientoBancario
from tesoreria.services.bancario_service import MovimientoBancarioService
from pos.models import Caja, Turno
from contabilidad.models import Banco
from core.models import Empresa

User = get_user_model()

@pytest.mark.django_db
class TestMovimientosBancarios:
    def setup_method(self):
        # Setup: Usuario, Empresa, Banco, Cuenta Bancaria
        self.usuario = User.objects.create_user(username="tesorero1", password="password")
        
        # Crear empresa si no existe
        self.empresa, _ = Empresa.objects.get_or_create(
            rfc="AAA010101AAA",
            defaults={
                'razon_social': 'Empresa Test',
                'nombre_comercial': 'Test Corp'
            }
        )
        
        # Crear banco
        self.banco, _ = Banco.objects.get_or_create(
            clave="002",
            defaults={
                'nombre_corto': 'BANAMEX',
                'razon_social': 'Banco Nacional de México S.A.'
            }
        )
        
        # Crear cuenta bancaria con saldo $0
        self.cuenta = CuentaBancaria.objects.create(
            banco=self.banco,
            empresa=self.empresa,
            numero_cuenta="1234567890",
            clabe="012345678901234567",
            moneda='MXN',
            saldo_actual=0
        )
        
        # Crear turno de POS cerrado con saldo final $5,000
        self.caja = Caja.objects.create(nombre="Caja 1")
        self.turno = Turno.objects.create(
            caja=self.caja,
            usuario=self.usuario,
            saldo_inicial=500,
            saldo_final_calculado=5500,
            saldo_final_declarado=5500,
            diferencia=0,
            estado='CERRADA',
            fecha_cierre=timezone.now()
        )

    def test_escenario_1_deposito_simple(self):
        # Escenario 1: Depósito Simple
        movimiento = MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='INGRESO',
            monto=1000,
            concepto='Aportación Inicial',
            usuario=self.usuario
        )
        
        # Assert: Movimiento creado
        assert movimiento is not None
        assert movimiento.tipo == 'INGRESO'
        assert movimiento.monto == 1000
        
        # Assert: Saldo actualizado
        self.cuenta.refresh_from_db()
        assert self.cuenta.saldo_actual == 1000

    def test_escenario_2_deposito_corte_caja(self):
        # Escenario 2: Depósito de Corte de Caja (Integración)
        movimiento = MovimientoBancarioService.procesar_corte_caja(
            turno_id=self.turno.id,
            cuenta_id=self.cuenta.id,
            usuario=self.usuario
        )
        
        # Assert: Movimiento creado con origen correcto
        assert movimiento is not None
        assert movimiento.tipo == 'INGRESO'
        assert movimiento.monto == Decimal('5500')  # saldo_final_calculado
        assert movimiento.origen_tipo == 'POS_TURNO'
        assert movimiento.origen_id == self.turno.id
        
        # Assert: Saldo de cuenta aumentó
        self.cuenta.refresh_from_db()
        assert self.cuenta.saldo_actual == Decimal('5500')

    def test_escenario_3_validacion_fondos_egreso(self):
        # Primero depositar $6,000
        MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='INGRESO',
            monto=6000,
            concepto='Depósito inicial',
            usuario=self.usuario
        )
        
        # Escenario 3: Intentar sacar $10,000 (más de lo disponible)
        with pytest.raises(ValueError, match="Fondos insuficientes"):
            MovimientoBancarioService.registrar_movimiento(
                cuenta_id=self.cuenta.id,
                tipo='EGRESO',
                monto=10000,
                concepto='Pago grande',
                usuario=self.usuario
            )
        
        # Verificar que el saldo no cambió
        self.cuenta.refresh_from_db()
        assert self.cuenta.saldo_actual == 6000

    def test_egreso_valido(self):
        # Depositar $10,000
        MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='INGRESO',
            monto=10000,
            concepto='Depósito',
            usuario=self.usuario
        )
        
        # Retirar $3,000 (válido)
        movimiento = MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='EGRESO',
            monto=3000,
            concepto='Pago a proveedor',
            beneficiario='Proveedor XYZ',
            usuario=self.usuario
        )
        
        assert movimiento.tipo == 'EGRESO'
        assert movimiento.monto == 3000
        
        # Saldo debe ser $7,000
        self.cuenta.refresh_from_db()
        assert self.cuenta.saldo_actual == 7000

    def test_error_turno_no_cerrado(self):
        # Crear turno abierto
        turno_abierto = Turno.objects.create(
            caja=self.caja,
            usuario=self.usuario,
            saldo_inicial=500,
            estado='ABIERTA'
        )
        
        # Intentar procesar corte de caja con turno abierto
        with pytest.raises(ValueError, match="El turno debe estar cerrado"):
            MovimientoBancarioService.procesar_corte_caja(
                turno_id=turno_abierto.id,
                cuenta_id=self.cuenta.id,
                usuario=self.usuario
            )

    def test_multiples_movimientos_saldo_correcto(self):
        # Múltiples operaciones
        MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='INGRESO',
            monto=5000,
            concepto='Depósito 1',
            usuario=self.usuario
        )
        
        MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='INGRESO',
            monto=3000,
            concepto='Depósito 2',
            usuario=self.usuario
        )
        
        MovimientoBancarioService.registrar_movimiento(
            cuenta_id=self.cuenta.id,
            tipo='EGRESO',
            monto=2000,
            concepto='Retiro 1',
            usuario=self.usuario
        )
        
        # Saldo final: 5000 + 3000 - 2000 = 6000
        self.cuenta.refresh_from_db()
        assert self.cuenta.saldo_actual == 6000
        
        # Verificar cantidad de movimientos
        movimientos = MovimientoBancario.objects.filter(cuenta=self.cuenta)
        assert movimientos.count() == 3
