from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BancoViewSet,
    ProyectoViewSet,
    UPEViewSet,
    ClienteViewSet,
    PagoViewSet,
    MonedaViewSet,
    DepartamentoViewSet,
    PuestoViewSet,
    EmpleadoViewSet,
    MetodoPagoViewSet,
    PresupuestoViewSet,
    ContratoViewSet,
    TipoCambioViewSet,
    VendedorViewSet,
    FormaPagoViewSet,
    PlanPagoViewSet,
    EsquemaComisionViewSet,
)

router = DefaultRouter()
router.register(r'bancos', BancoViewSet)
router.register(r'proyectos', ProyectoViewSet)
router.register(r'upes', UPEViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'monedas', MonedaViewSet)
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'puestos', PuestoViewSet)
router.register(r'empleados', EmpleadoViewSet)
router.register(r'metodos-pago', MetodoPagoViewSet)
router.register(r'tipos-cambio', TipoCambioViewSet)
router.register(r'vendedores', VendedorViewSet)
router.register(r'formas-pago', FormaPagoViewSet)
router.register(r'planes-pago', PlanPagoViewSet)
router.register(r'esquemas-comision', EsquemaComisionViewSet)
router.register(r'presupuestos', PresupuestoViewSet)
router.register(r'contratos', ContratoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
