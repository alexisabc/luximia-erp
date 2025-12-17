from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaEquipoViewSet, ModeloEquipoViewSet, ActivoITViewSet,
    AsignacionEquipoViewSet, MovimientoInventarioViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaEquipoViewSet)
router.register(r'modelos', ModeloEquipoViewSet)
router.register(r'activos', ActivoITViewSet)
router.register(r'asignaciones', AsignacionEquipoViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
