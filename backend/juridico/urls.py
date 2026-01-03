from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlantillaLegalViewSet, DocumentoFirmadoViewSet

router = DefaultRouter()
router.register(r'plantillas', PlantillaLegalViewSet, basename='plantilla-legal')
router.register(r'documentos', DocumentoFirmadoViewSet, basename='documento-firmado')

urlpatterns = [
    path('', include(router.urls)),
]
