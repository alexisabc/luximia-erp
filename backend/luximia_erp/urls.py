# luximia_erp/urls.py

from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('admin/', admin.site.urls),

    # ✨ CAMBIO: Eliminamos el prefijo 'api/' de las rutas.
    # El subdominio api.alexisabc.dev ya se encarga de dirigir aquí.
    path('cxc/', include('cxc.urls')),
    path('users/', include('users.urls')),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]