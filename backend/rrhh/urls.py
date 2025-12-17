from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartamentoViewSet,
    PuestoViewSet,
    CentroTrabajoViewSet,
    RazonSocialViewSet,
    EmpleadoViewSet,
)
from .views_nomina import NominaViewSet

router = DefaultRouter()
router.register(r"departamentos", DepartamentoViewSet)
router.register(r"puestos", PuestoViewSet)
router.register(r"centros-trabajo", CentroTrabajoViewSet)
router.register(r"razones-sociales", RazonSocialViewSet)
router.register(r"empleados", EmpleadoViewSet)
router.register(r"nominas", NominaViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
