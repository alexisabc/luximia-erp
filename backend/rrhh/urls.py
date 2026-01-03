from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartamentoViewSet,
    PuestoViewSet,
    CentroTrabajoViewSet,
    RazonSocialViewSet,
    EmpleadoViewSet,
)
from .views_nomina import NominaViewSet, HistoricoNominaViewSet, ReciboNominaViewSet, ConceptoNominaViewSet, BuzonIMSSViewSet, PTUViewSet
from .views_periodos import PeriodoNominaViewSet
from .views_portal import (
    PortalVacacionesViewSet, PortalPermisosViewSet, PortalIncapacidadViewSet, PortalDocumentosViewSet,
    AdminVacacionesViewSet, AdminPermisosViewSet, AdminIncapacidadViewSet, AdminDocumentosViewSet
)
from .views.asistencia_views import AsistenciaViewSet

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
router.register(r"asistencias", AsistenciaViewSet)
# Portal Empleado
router.register(r"portal-vacaciones", PortalVacacionesViewSet, basename="portal-vacaciones")
router.register(r"portal-permisos", PortalPermisosViewSet, basename="portal-permisos")
router.register(r"portal-incapacidades", PortalIncapacidadViewSet, basename="portal-incapacidades")
router.register(r"portal-documentos", PortalDocumentosViewSet, basename="portal-documentos")

router.register(r"buzon-imss", BuzonIMSSViewSet)
router.register(r"ptu", PTUViewSet, basename='ptu')

# Gestion RH
router.register(r"gestion-vacaciones", AdminVacacionesViewSet, basename="gestion-vacaciones")
router.register(r"gestion-permisos", AdminPermisosViewSet, basename="gestion-permisos")
router.register(r"gestion-incapacidades", AdminIncapacidadViewSet, basename="gestion-incapacidades")
router.register(r"gestion-documentos", AdminDocumentosViewSet, basename="gestion-documentos")

urlpatterns = [
    path("", include(router.urls)),
]
