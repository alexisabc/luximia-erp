from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CuentaBancariaViewSet,
    MovimientoBancarioViewSet,
    TurnoPorRecolectarView,
    EgresoViewSet,
    ContraReciboViewSet,
    DeudasView,
    RegistrarPagoView
)

router = DefaultRouter()
router.register(r'cuentas', CuentaBancariaViewSet, basename='cuenta-bancaria')
router.register(r'movimientos', MovimientoBancarioViewSet, basename='movimiento-bancario')
router.register(r'egresos', EgresoViewSet, basename='egreso')
router.register(r'contrarecibos', ContraReciboViewSet, basename='contrarecibo')

urlpatterns = [
    path('', include(router.urls)),
    path('turnos-pendientes/', TurnoPorRecolectarView.as_view(), name='turnos-pendientes'),
    path('deudas/', DeudasView.as_view(), name='deudas'),
    path('registrar-pago/', RegistrarPagoView.as_view(), name='registrar-pago'),
]
