from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, CajaViewSet, TurnoViewSet, 
    VentaViewSet, CuentaClienteViewSet
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'cajas', CajaViewSet)
router.register(r'turnos', TurnoViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'cuentas', CuentaClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
