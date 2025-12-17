# core/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Empresa
from .serializers import EmpresaSerializer


class BaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet base con funcionalidades comunes para todos los módulos.
    Proporciona paginación, filtrado y permisos estándar.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Permite filtrado básico por 'activo' si el modelo lo tiene.
        Los ViewSets hijos pueden sobrescribir esto para filtrado más específico.
        """
        queryset = super().get_queryset()
        
        # Filtrar por activo si el parámetro existe
        if hasattr(queryset.model, 'activo'):
            activo = self.request.query_params.get('activo', None)
            if activo is not None:
                queryset = queryset.filter(activo=activo.lower() == 'true')
        
        return queryset


class EmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gestionar empresas.
    Solo lectura para usuarios normales.
    """
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retorna solo las empresas a las que el usuario tiene acceso.
        """
        user = self.request.user
        if user.is_superuser:
            return Empresa.objects.all()
        return user.empresas_acceso.all()

    @action(detail=False, methods=['get'])
    def mis_empresas(self, request):
        """
        Retorna las empresas del usuario y la empresa actual.
        GET /api/empresas/mis_empresas/
        """
        user = request.user
        
        # Obtener empresas con acceso
        if user.is_superuser:
            empresas = Empresa.objects.all()
        else:
            empresas = user.empresas_acceso.all()
        
        # Determinar empresa actual DIRECTAMENTE del usuario (bypass Middleware para JWT)
        # Prioridad 1: Última activa guardada
        empresa_actual = user.ultima_empresa_activa
        
        # Prioridad 2: Principal
        if not empresa_actual:
            empresa_actual = user.empresa_principal
            
        # Prioridad 3: Primera disponible (solo si tiene acceso a alguna)
        if not empresa_actual and empresas.exists():
            empresa_actual = empresas.first()
            
        # Security Check: Asegurar que aún tiene acceso (si no es superuser)
        if empresa_actual and not user.is_superuser:
            if not user.empresas_acceso.filter(id=empresa_actual.id).exists() and \
               user.empresa_principal != empresa_actual:
                empresa_actual = None

        return Response({
            'empresas': EmpresaSerializer(empresas, many=True).data,
            'empresa_actual': EmpresaSerializer(empresa_actual).data if empresa_actual else None,
            'empresa_principal': EmpresaSerializer(user.empresa_principal).data if user.empresa_principal else None,
        })

    @action(detail=True, methods=['post'])
    def cambiar(self, request, pk=None):
        """
        Cambia la empresa activa en la sesión del usuario.
        POST /api/empresas/{id}/cambiar/
        """
        empresa = self.get_object()
        user = request.user
        
        # Verificar que el usuario tiene acceso a esta empresa
        if not user.is_superuser:
            if not user.empresas_acceso.filter(id=empresa.id).exists() and \
               user.empresa_principal != empresa:
                return Response(
                    {'detail': 'No tienes acceso a esta empresa'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Recargar usuario fresco de la BD para asegurar que tenemos la instancia correcta
        User = user.__class__
        user_db = User.objects.get(pk=user.pk)
        
        # Guardar en base de datos para persistencia total
        user_db.ultima_empresa_activa = empresa
        user_db.save(update_fields=['ultima_empresa_activa'])
        
        # Actualizar sesión también (compatibilidad)
        request.session['empresa_id'] = empresa.id
        request.session.save()
        
        # Actualizar el objeto user del request actual para reflejar el cambio inmediato
        request.user.ultima_empresa_activa = empresa
        
        return Response({
            'detail': f'Empresa cambiada a {empresa.nombre_comercial}',
            'empresa': EmpresaSerializer(empresa).data
        })
