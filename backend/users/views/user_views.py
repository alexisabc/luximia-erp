from rest_framework import viewsets, permissions, filters, status, decorators
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from users.models import EnrollmentToken
from users.utils import build_enrollment_email_context
from core.views import BaseViewSet
import secrets

User = get_user_model()

class UserViewSet(BaseViewSet):
    """
    ViewSet para la gestión de Usuarios.
    Soporta listado, detalle, actualización y soft-delete.
    """
    queryset = User.objects.all().prefetch_related('roles', 'empresas_acceso').order_by('id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['id', 'username', 'last_login']

    def get_queryset(self):
        qs = super().get_queryset()
        # Filtro para ver inactivos si tiene el permiso
        ver_inactivos = self.request.query_params.get('include_inactive', 'false').lower() == 'true'
        if not ver_inactivos:
            qs = qs.filter(is_active=True)
        return qs

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def invite(self, request, pk=None):
        """Genera y envía un token de activación al usuario."""
        user = self.get_object()
        token_val = secrets.token_urlsafe(32)
        
        from django.utils import timezone
        from datetime import timedelta
        
        # Eliminar tokens previos
        EnrollmentToken.objects.filter(user=user).delete()
        
        EnrollmentToken.objects.create(
            user=user,
            token_hash=token_val,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # TODO: Integrar con servicio de Email real
        # Por ahora simulamos
        context = build_enrollment_email_context(user, token_val)
        
        return Response({
            "detail": f"Invitación generada para {user.email}",
            "token": token_val # Solo para desarrollo/test
        })

    @decorators.action(detail=True, methods=['delete'], permission_classes=[permissions.IsAdminUser])
    def hard_delete(self, request, pk=None):
        """Borrado permanente de usuario (Solo para admins con permiso)."""
        if not request.user.has_perm('users.hard_delete_customuser'):
             return Response({"detail": "No tiene permiso para borrado permanente."}, status=403)
             
        user = self.get_object()
        user.delete() # Borrado físico real
        return Response(status=status.HTTP_204_NO_CONTENT)
