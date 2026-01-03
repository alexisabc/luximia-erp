from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import Obra, CentroCosto
from .serializers import ObraSerializer, CentroCostoSerializer
from core.services.config_service import ConfigService

class ObraViewSet(viewsets.ModelViewSet):
    queryset = Obra.objects.all()
    serializer_class = ObraSerializer
    filterset_fields = ['activo']

    def get_queryset(self):
        if not ConfigService.is_feature_enabled('MODULE_OBRAS'):
             raise PermissionDenied("Módulo de Obras inactivo")
        return super().get_queryset()

class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = CentroCosto.objects.all()
    serializer_class = CentroCostoSerializer
    filterset_fields = ['obra', 'nivel', 'es_hoja', 'padre']

    def get_queryset(self):
        if not ConfigService.is_feature_enabled('MODULE_OBRAS'):
             raise PermissionDenied("Módulo de Obras inactivo")
        return super().get_queryset()
