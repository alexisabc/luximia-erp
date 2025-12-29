from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, CajaViewSet, TurnoViewSet, 
    VentaViewSet, CuentaClienteViewSet,
    # Sistema de Cancelaciones con Autorización
    SolicitudCancelacionViewSet,
    SolicitarCancelacionView,
    CancelacionesPendientesView,
    AutorizarCancelacionView,
    RechazarCancelacionView,
    ConfigurarTOTPAutorizacionView
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'cajas', CajaViewSet)
router.register(r'turnos', TurnoViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'cuentas', CuentaClienteViewSet)
router.register(r'solicitudes-cancelacion', SolicitudCancelacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints de Cancelaciones con Autorización
    path('cancelaciones/solicitar/', SolicitarCancelacionView.as_view(), name='solicitar-cancelacion'),
    path('cancelaciones/pendientes/', CancelacionesPendientesView.as_view(), name='cancelaciones-pendientes'),
    path('cancelaciones/<int:pk>/autorizar/', AutorizarCancelacionView.as_view(), name='autorizar-cancelacion'),
    path('cancelaciones/<int:pk>/rechazar/', RechazarCancelacionView.as_view(), name='rechazar-cancelacion'),
    
    # Configuración de TOTP de Autorización
    path('configurar-totp-autorizacion/', ConfigurarTOTPAutorizacionView.as_view(), name='configurar-totp-autorizacion'),
]
