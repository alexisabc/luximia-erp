from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'contra-recibos', views.ContraReciboViewSet)
router.register(r'programaciones', views.ProgramacionPagoViewSet)
router.register(r'detalles-programacion', views.DetalleProgramacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
