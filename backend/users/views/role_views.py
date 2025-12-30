from rest_framework import viewsets, permissions, filters
from django.contrib.auth.models import Permission
from users.models import Role
from users.serializers import RoleSerializer, PermissionSerializer
from core.views import BaseViewSet

class RoleViewSet(BaseViewSet):
    """
    ViewSet para la gestión de Roles (RBAC).
    Permite crear, listar, actualizar y eliminar roles.
    Los roles de sistema están protegidos contra eliminación y cambios de nombre básicos.
    """
    queryset = Role.objects.all().prefetch_related('permissions', 'users').order_by('nombre')
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']

    def perform_destroy(self, instance):
        if instance.es_sistema:
            # No permitimos borrar roles clave del sistema
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No se puede eliminar un rol del sistema.")
        return super().perform_destroy(instance)

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lista todos los permisos disponibles en el sistema.
    ReadOnly porque los permisos se crean mediante migraciones de Django.
    """
    queryset = Permission.objects.all().select_related('content_type').order_by('content_type__app_label', 'codename')
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = None # Usualmente son pocos cientos, mejor listarlos todos
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'codename', 'content_type__app_label']
