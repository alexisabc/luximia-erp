from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    CategoriaEquipoViewSet, ModeloEquipoViewSet, ActivoITViewSet,
    AsignacionEquipoViewSet, MovimientoInventarioViewSet
)

router = SimpleRouter()
router.register(r'categorias', CategoriaEquipoViewSet, basename='categorias')
router.register(r'modelos', ModeloEquipoViewSet, basename='modelos')
router.register(r'activos', ActivoITViewSet, basename='activos')
router.register(r'asignaciones', AsignacionEquipoViewSet, basename='asignaciones')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimientos')

urlpatterns = [
    path('', include(router.urls)),
]
