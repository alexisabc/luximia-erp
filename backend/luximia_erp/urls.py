# luximia_erp/urls.py
from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('admin/', admin.site.urls),

    # Las rutas de tokens ahora vivirán dentro de 'users.urls'
    path('api/cxc/', include('cxc.urls')),
    path('api/users/', include('users.urls')),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
