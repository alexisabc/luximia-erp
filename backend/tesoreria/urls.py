from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContraReciboViewSet,
    ProgramacionPagoViewSet,
    CuentaBancariaViewSet,
    CajaChicaViewSet,
    MovimientoCajaViewSet,
    EgresoViewSet,
)

router = DefaultRouter()
router.register(r'contrarecibos', ContraReciboViewSet)
router.register(r'programaciones-pago', ProgramacionPagoViewSet)
router.register(r'cuentas-bancarias', CuentaBancariaViewSet)
router.register(r'cajas-chicas', CajaChicaViewSet)
router.register(r'movimientos-caja', MovimientoCajaViewSet)
router.register(r'egresos', EgresoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
