from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BancoViewSet,
    ProyectoViewSet,
    UPEViewSet,
    ClienteViewSet,
    PagoViewSet,
    MonedaViewSet,
    MetodoPagoViewSet,
    TipoCambioViewSet,
    TipoDeCambioSATViewSet,
    VendedorViewSet,
    FormaPagoViewSet,
    PlanPagoViewSet,
    EsquemaComisionViewSet,
    PresupuestoViewSet,
    ContratoViewSet,
    strategic_dashboard,
)

router = DefaultRouter()
router.register(r"bancos", BancoViewSet)
router.register(r"proyectos", ProyectoViewSet)
router.register(r"upes", UPEViewSet)
router.register(r"clientes", ClienteViewSet)
router.register(r"pagos", PagoViewSet)
router.register(r"monedas", MonedaViewSet)
router.register(r"metodos-pago", MetodoPagoViewSet)
router.register(r"tipos-cambio-manual", TipoCambioViewSet)
router.register(r"tipos-cambio-banxico", TipoDeCambioSATViewSet, basename="tipos-de-cambio")
router.register(r"vendedores", VendedorViewSet)
router.register(r"formas-pago", FormaPagoViewSet)
router.register(r"planes-pago", PlanPagoViewSet)
router.register(r"esquemas-comision", EsquemaComisionViewSet)
router.register(r"presupuestos", PresupuestoViewSet)
router.register(r"contratos", ContratoViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/strategic/", strategic_dashboard),
]
