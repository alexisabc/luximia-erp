from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from .models import SystemSetting, FeatureFlag
from .serializers_config import (
    SystemSettingSerializer,
    SystemSettingUpdateSerializer,
    PublicSettingsSerializer,
    FeatureFlagSerializer,
    FeatureFlagToggleSerializer,
)
from .services.config_service import ConfigService


class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar configuraciones del sistema.
    
    Endpoints:
    - GET /api/core/settings/ - Listar todas las configuraciones
    - POST /api/core/settings/ - Crear nueva configuración
    - GET /api/core/settings/{id}/ - Obtener configuración específica
    - PUT /api/core/settings/{id}/ - Actualizar configuración completa
    - PATCH /api/core/settings/{id}/ - Actualizar parcialmente
    - DELETE /api/core/settings/{id}/ - Eliminar configuración
    - PATCH /api/core/settings/{id}/update_value/ - Actualizar solo el valor
    """
    queryset = SystemSetting.objects.all().order_by('category', 'key')
    serializer_class = SystemSettingSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filterset_fields = ['category', 'is_public']
    search_fields = ['key', 'description']
    
    def perform_create(self, serializer):
        """Asignar usuario que modifica al crear"""
        serializer.save(modified_by=self.request.user)
    
    def perform_update(self, serializer):
        """Asignar usuario que modifica al actualizar"""
        serializer.save(modified_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_value(self, request, pk=None):
        """
        Actualiza solo el valor de una configuración.
        
        Body:
        {
            "value": <nuevo_valor>
        }
        """
        setting = self.get_object()
        serializer = SystemSettingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        setting.value = serializer.validated_data['value']
        setting.modified_by = request.user
        setting.save()
        
        return Response(
            SystemSettingSerializer(setting).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Actualiza múltiples configuraciones a la vez.
        
        Body:
        {
            "settings": [
                {"key": "POS_ALLOW_NEGATIVE_STOCK", "value": true},
                {"key": "FISCAL_RFC_VALIDATION", "value": false}
            ]
        }
        """
        settings_data = request.data.get('settings', [])
        
        if not settings_data:
            return Response(
                {"detail": "Se requiere el campo 'settings'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated = []
        errors = []
        
        with transaction.atomic():
            for item in settings_data:
                key = item.get('key')
                value = item.get('value')
                
                if not key:
                    errors.append({"error": "Falta 'key' en item", "item": item})
                    continue
                
                try:
                    setting = SystemSetting.objects.get(key=key)
                    setting.value = value
                    setting.modified_by = request.user
                    setting.save()
                    updated.append(key)
                except SystemSetting.DoesNotExist:
                    errors.append({"error": f"Configuración '{key}' no encontrada", "key": key})
        
        return Response({
            "updated": updated,
            "errors": errors,
            "total_updated": len(updated),
            "total_errors": len(errors),
        })


class PublicConfigView(APIView):
    """
    Vista pública para obtener configuraciones que el frontend necesita.
    
    GET /api/core/config/public/
    
    Retorna:
    {
        "settings": {
            "POS_FAST_MODE": false,
            "FISCAL_DEFAULT_TAX_RATE": 0.16,
            ...
        },
        "features": {
            "MODULE_OBRAS": false,
            "FEATURE_AI_ASSISTANT": true,
            ...
        }
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtiene configuraciones públicas y feature flags"""
        settings = ConfigService.get_public_settings()
        features = ConfigService.get_all_features()
        
        serializer = PublicSettingsSerializer(data={
            'settings': settings,
            'features': features,
        })
        serializer.is_valid(raise_exception=True)
        
        return Response(serializer.validated_data)


class FeatureFlagViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar feature flags.
    
    Endpoints:
    - GET /api/core/features/ - Listar todos los features
    - POST /api/core/features/ - Crear nuevo feature
    - GET /api/core/features/{id}/ - Obtener feature específico
    - PUT /api/core/features/{id}/ - Actualizar feature completo
    - PATCH /api/core/features/{id}/ - Actualizar parcialmente
    - DELETE /api/core/features/{id}/ - Eliminar feature
    - POST /api/core/features/{id}/toggle/ - Activar/desactivar feature
    - GET /api/core/features/{id}/check/ - Verificar si está habilitado para el usuario actual
    """
    queryset = FeatureFlag.objects.all().order_by('code')
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    search_fields = ['code', 'name', 'description']
    
    def perform_create(self, serializer):
        """Asignar usuario creador"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """
        Activa o desactiva un feature flag.
        
        Body:
        {
            "is_active": true
        }
        """
        feature = self.get_object()
        serializer = FeatureFlagToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        feature.is_active = serializer.validated_data['is_active']
        feature.save()
        
        return Response(
            FeatureFlagSerializer(feature).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def check(self, request, pk=None):
        """
        Verifica si el feature está habilitado para el usuario actual.
        
        Retorna:
        {
            "code": "MODULE_OBRAS",
            "is_enabled": false,
            "reason": "Feature no activo globalmente"
        }
        """
        feature = self.get_object()
        is_enabled = feature.is_enabled_for_user(request.user)
        
        # Determinar razón
        if not feature.is_active:
            reason = "Feature no activo globalmente"
        elif feature.allowed_users.exists() and not feature.allowed_users.filter(id=request.user.id).exists():
            reason = "Usuario no está en la lista de permitidos"
        elif feature.allowed_roles and not any(role in feature.allowed_roles for role in request.user.roles.values_list('code', flat=True)):
            reason = "Usuario no tiene rol permitido"
        elif feature.rollout_percentage < 100:
            user_hash = hash(f"{feature.code}:{request.user.id}") % 100
            if user_hash >= feature.rollout_percentage:
                reason = f"Usuario fuera del rollout ({feature.rollout_percentage}%)"
            else:
                reason = f"Usuario dentro del rollout ({feature.rollout_percentage}%)"
        else:
            reason = "Feature habilitado"
        
        return Response({
            "code": feature.code,
            "is_enabled": is_enabled,
            "reason": reason,
        })
