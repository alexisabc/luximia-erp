# config/urls.py

from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('admin/', admin.site.urls),

    # ✨ CAMBIO: Eliminamos el prefijo 'api/' de las rutas.
    # El subdominio api.alexisabc.dev ya se encarga de dirigir aquí.
    path('core/', include('core.urls')),
    path('contabilidad/', include('contabilidad.urls')),
    path('rrhh/', include('rrhh.urls')),
    path('auditoria/', include('auditoria.urls')),
    path('sistemas/', include('sistemas.urls')), # Placeholder
    path('tesoreria/', include('tesoreria.urls')), # Placeholder
    path('juridico/', include('juridico.urls')), # Placeholder
    path('compras/', include('compras.urls')),
    path('users/', include('users.urls')),
    path('ia/', include('ia.urls')),
    path('pos/', include('pos.urls')),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]