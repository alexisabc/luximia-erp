from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import consulta_inteligente
# Importa las nuevas vistas
from .views import (
    ProyectoViewSet, ClienteViewSet, UPEViewSet,
    ContratoViewSet, PagoViewSet, dashboard_stats,
    valor_por_proyecto_chart, generar_estado_de_cuenta_pdf,
    importar_datos_masivos, importar_clientes, importar_upes,
    importar_contratos, UserViewSet, GroupViewSet, get_all_permissions, 
    upe_status_chart, get_latest_tipo_de_cambio, generar_estado_de_cuenta_excel
)

# Creamos un router
router = DefaultRouter()

# Registramos todas nuestras vistas
router.register(r'proyectos', ProyectoViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'upes', UPEViewSet)
router.register(r'contratos', ContratoViewSet)
router.register(r'pagos', PagoViewSet)
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)


# Las URLs de la API son determinadas automáticamente por el router.
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('charts/valor-por-proyecto/', valor_por_proyecto_chart, name='chart-valor-por-proyecto'),
    path('contratos/<int:pk>/pdf/',generar_estado_de_cuenta_pdf, name='contrato-pdf'),
    path('contratos/<int:pk>/excel/',
         generar_estado_de_cuenta_excel, name='contrato-excel'),
    path('importar-masivo/', importar_datos_masivos, name='importar-masivo'),
    path('importar-clientes/', importar_clientes, name='importar-clientes'),
    path('importar-upes/', importar_upes, name='importar-upes'),
    path('importar-contratos/', importar_contratos, name='importar-contratos'),
    path('permissions/', get_all_permissions, name='get-all-permissions'),
    path('consulta-inteligente/', consulta_inteligente,
         name='consulta-inteligente'),
    path('charts/upe-status/', upe_status_chart, name='chart-upe-status'),
    path('tipo-de-cambio/latest/', get_latest_tipo_de_cambio,
         name='latest-tipo-de-cambio'),
]
