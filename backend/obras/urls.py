from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ObraViewSet, CentroCostoViewSet

router = DefaultRouter()
router.register(r'obras', ObraViewSet)
router.register(r'centros-costos', CentroCostoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
