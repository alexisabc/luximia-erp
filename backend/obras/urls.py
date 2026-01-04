from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ObraViewSet, CentroCostoViewSet, 
    ActividadProyectoViewSet, DependenciaActividadViewSet,
    AsignacionRecursoViewSet, OrdenCambioViewSet
)

router = DefaultRouter()
router.register(r'obras', ObraViewSet)
router.register(r'centros-costos', CentroCostoViewSet)
router.register(r'actividades', ActividadProyectoViewSet)
router.register(r'dependencias', DependenciaActividadViewSet)
router.register(r'recursos', AsignacionRecursoViewSet)
router.register(r'ordenes-cambio', OrdenCambioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
