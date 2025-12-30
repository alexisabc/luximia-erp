# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')

from .views_pdf import PDFTestView
from .views_dashboard import DashboardViewSet

router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('test-pdf/', PDFTestView.as_view(), name='test-pdf'),
    path('', include(router.urls)),
]
