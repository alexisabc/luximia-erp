import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from obras.models import Obra, CentroCosto, PartidaPresupuestal
from compras.models import OrdenCompra
from compras.services.validacion_service import ValidacionPresupuestalService

User = get_user_model()

@pytest.mark.django_db
class TestValidacionPresupuestal:
    @pytest.fixture
    def partida(self):
        obra = Obra.objects.create(nombre="Torre Shark", codigo="SHARK", fecha_inicio="2026-01-01", presupuesto_total=10000)
        cc = CentroCosto.objects.create(obra=obra, nombre="Cimentación", codigo="CIM")
        partida = PartidaPresupuestal.objects.create(
            centro_costo=cc,
            categoria='MATERIALES',
            monto_estimado=1000,
            monto_aditivas=0,
            monto_comprometido=200,
            monto_ejecutado=300
        )
        return partida

    def test_presupuesto_suficiente(self, partida):
        # Disponible = 1000 + 0 - (200 + 300) = 500
        # Gasto = 400
        assert ValidacionPresupuestalService.validar_presupuesto(partida, 400) is True

    def test_presupuesto_insuficiente_lansa_error(self, partida):
        # Disponible = 500
        # Gasto = 600
        with pytest.raises(ValidationError) as exc:
            ValidacionPresupuestalService.validar_presupuesto(partida, 600)
        assert "Excede presupuesto" in str(exc.value)

    def test_aditivas_aumentan_disponible(self, partida):
        partida.monto_aditivas = 200
        partida.save()
        # Disponible = 1000 + 200 - 500 = 700
        # Gasto = 600 -> Should pass
        assert ValidacionPresupuestalService.validar_presupuesto(partida, 600) is True

    def test_override_con_permiso(self, partida):
        user = User.objects.create_user(username='director', password='password')
        
        # Ensure content type and permission exist
        ct = ContentType.objects.get_for_model(OrdenCompra)
        perm, _ = Permission.objects.get_or_create(
            codename='aprobar_sobrecosto',
            content_type=ct,
            defaults={'name': 'Puede aprobar ODC sin presupuesto'}
        )
        user.user_permissions.add(perm)
        
        # Gasto = 600 (Exceeds 500)
        assert ValidacionPresupuestalService.validar_presupuesto(partida, 600, user=user) is True
