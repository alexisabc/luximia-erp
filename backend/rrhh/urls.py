from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartamentoViewSet,
    PuestoViewSet,
    CentroTrabajoViewSet,
    RazonSocialViewSet,
    EmpleadoViewSet,
)
from .views_nomina import NominaViewSet, HistoricoNominaViewSet, ReciboNominaViewSet, ConceptoNominaViewSet
from .views_periodos import PeriodoNominaViewSet

router = DefaultRouter()
router.register(r"departamentos", DepartamentoViewSet)
router.register(r"puestos", PuestoViewSet)
router.register(r"centros-trabajo", CentroTrabajoViewSet)
router.register(r"razones-sociales", RazonSocialViewSet)
router.register(r"empleados", EmpleadoViewSet)
router.register(r"nominas", NominaViewSet)
router.register(r"historico-nomina", HistoricoNominaViewSet)
router.register(r"recibos-nomina", ReciboNominaViewSet)
router.register(r"conceptos-nomina", ConceptoNominaViewSet)
router.register(r"periodos-nomina", PeriodoNominaViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
