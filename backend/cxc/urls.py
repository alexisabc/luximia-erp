# backend/cxc/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProyectoViewSet, ClienteViewSet, DepartamentoViewSet, PuestoViewSet, UPEViewSet, ContratoViewSet, PagoViewSet,
    UserViewSet, GroupViewSet, TipoDeCambioViewSet, AuditLogViewSet, get_all_permissions,
    generar_estado_de_cuenta_pdf, generar_estado_de_cuenta_excel,
    consulta_inteligente, get_latest_tipo_de_cambio, actualizar_tipo_de_cambio_hoy,
    importar_datos_masivos, importar_clientes, importar_upes, importar_contratos,
    importar_pagos_historicos, export_proyectos_excel, export_clientes_excel,
    export_upes_excel, export_contratos_excel,
    strategic_dashboard_data  # <-- Añade la nueva vista del dashboard
)

router = DefaultRouter()
router.register(r'proyectos', ProyectoViewSet, basename='proyecto')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'puestos', PuestoViewSet, basename='puesto')
router.register(r'upes', UPEViewSet, basename='upe')
router.register(r'contratos', ContratoViewSet, basename='contrato')
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'users', UserViewSet, basename='user')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'tipos-de-cambio', TipoDeCambioViewSet)
router.register(r'auditlog', AuditLogViewSet, basename='auditlog')

# ### CAMBIO CLAVE: El orden de esta lista es muy importante ###
urlpatterns = [

    #Rutas de Gráficas
    path('dashboard/strategic/', strategic_dashboard_data,
         name='dashboard-strategic'),

     #Rutas de PDF y Excel
    path('contratos/<int:pk>/pdf/',
         generar_estado_de_cuenta_pdf, name='contrato-pdf'),
    path('contratos/<int:pk>/excel/',
         generar_estado_de_cuenta_excel, name='contrato-excel'),

     #Rutas de Importación
    path('importar-masivo/', importar_datos_masivos, name='importar-masivo'),
    path('importar-clientes/', importar_clientes, name='importar-clientes'),
    path('importar-upes/', importar_upes, name='importar-upes'),
    path('importar-contratos/', importar_contratos, name='importar-contratos'),
    path('importar-pagos-historicos/',
         importar_pagos_historicos, name='importar-pagos'),
    
    #Rutas de Utilerias
    path('permissions/', get_all_permissions, name='get-all-permissions'),
    path('consulta-inteligente/', consulta_inteligente,
         name='consulta-inteligente'),
    path('tipo-de-cambio/latest/', get_latest_tipo_de_cambio,
         name='latest-tipo-de-cambio'),
    path('tipo-de-cambio/actualizar-hoy/',
         actualizar_tipo_de_cambio_hoy, name='actualizar-tc-hoy'),

    # Rutas de Exportación
    path('proyectos/export/', export_proyectos_excel, name='export-proyectos'),
    path('clientes/export/', export_clientes_excel, name='export-clientes'),
    path('upes/export/', export_upes_excel, name='export-upes'),
    path('contratos/export/', export_contratos_excel, name='export-contratos'),
    

    # 2. El router va al final para que capture todo lo demás (CRUDs estándar)
    path('', include(router.urls)),
]
