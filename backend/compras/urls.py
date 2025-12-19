from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'proveedores', views.ProveedorViewSet)
router.register(r'insumos', views.InsumoViewSet)
router.register(r'ordenes', views.OrdenCompraViewSet)
router.register(r'detalles-orden', views.DetalleOrdenCompraViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
