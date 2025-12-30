import pytest
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
from contabilidad.models import Poliza, CuentaContable
from contabilidad.repositories.poliza_repository import PolizaRepository

@pytest.mark.django_db
class TestPolizaRepository:
    def test_create_poliza_with_details(self):
        # Setup: Create CuentaContable needed for details
        cuenta1 = CuentaContable.objects.create(
            codigo='100-001', nombre='Caja', tipo='ACTIVO', naturaleza='DEUDORA'
        )
        cuenta2 = CuentaContable.objects.create(
            codigo='200-001', nombre='Proveedores', tipo='PASIVO', naturaleza='ACREEDORA'
        )
        
        data = {
            'fecha': '2025-01-01',
            'tipo': 'DIARIO',
            'numero': 1,
            'concepto': 'Poliza Test Repo',
            'detalles': [
                {
                    'cuenta_id': cuenta1.id,
                    'concepto': 'Ingreso Caja',
                    'debe': Decimal('100.00'),
                    'haber': Decimal('0.00')
                },
                {
                    'cuenta_id': cuenta2.id,
                    'concepto': 'Pago Cliente',
                    'debe': Decimal('0.00'),
                    'haber': Decimal('100.00')
                }
            ]
        }
        
        # Action
        poliza = PolizaRepository.create(data)
        
        # Assertions
        assert Poliza.objects.count() == 1
        assert poliza.concepto == 'Poliza Test Repo'
        assert poliza.detalles.count() == 2
        
        # Verificar integridad guardada (El repo debe haber calculado los totales)
        assert poliza.total_debe == Decimal('100.00')
        assert poliza.total_haber == Decimal('100.00')

    def test_get_by_id_exists(self):
        poliza = Poliza.objects.create(
            fecha='2025-01-01', tipo='DIARIO', numero=99, concepto='Test Get'
        )
        found = PolizaRepository.get_by_id(poliza.id)
        assert found.id == poliza.id

    def test_get_by_id_not_found(self):
        with pytest.raises(Exception): # Puede ser ObjectDoesNotExist o custom
            PolizaRepository.get_by_id(999999)

    def test_soft_delete(self):
        poliza = Poliza.objects.create(
            fecha='2025-01-01', tipo='DIARIO', numero=50, concepto='Test Soft Delete'
        )
        assert poliza.activo is True
        
        PolizaRepository.delete(poliza.id)
        
        poliza.refresh_from_db()
        assert poliza.activo is False
        
        # SoftDeleteModel should generally hide standard querysets, 
        # but verify 'is_active' flag explicitly is the requirement.
