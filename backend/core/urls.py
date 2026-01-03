# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')

from .views_pdf import PDFTestView
from .views_dashboard import DashboardViewSet

router.register(r'dashboard', DashboardViewSet, basename='dashboard')

# V2.0: Configuración dinámica
from .views_config import SystemSettingViewSet, FeatureFlagViewSet, PublicConfigView

router.register(r'settings', SystemSettingViewSet, basename='system-setting')
router.register(r'features', FeatureFlagViewSet, basename='feature-flag')

urlpatterns = [
    path('test-pdf/', PDFTestView.as_view(), name='test-pdf'),
    path('config/public/', PublicConfigView.as_view(), name='public-config'),
    path('', include(router.urls)),
]
