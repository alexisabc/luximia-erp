# core/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Empresa
from .serializers import EmpresaSerializer
from .pagination import CustomPagination  # Importar paginación personalizada

import openpyxl
from django.db import transaction
from django.apps import apps
from django.db import models

# ... (El mixin no cambia)

class BaseViewSet(ExcelImportMixin, viewsets.ModelViewSet):
    """
    ViewSet base con funcionalidades comunes para todos los módulos.
    Proporciona paginación estandarizada, filtrado y permisos.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination  # Estandarización aplicada

    
    def get_queryset(self):
        """
        Permite filtrado básico por 'activo' si el modelo lo tiene.
        Los ViewSets hijos pueden sobrescribir esto para filtrado más específico.
        """
        queryset = super().get_queryset()
        
        # Filtrar por activo si el parámetro existe
        if hasattr(queryset.model, 'activo'):
            # Si el manager por defecto ya filtra, esto refuerza o permite filtrar explícitamente
            activo = self.request.query_params.get('activo', None)
            if activo is not None:
                queryset = queryset.filter(activo=activo.lower() == 'true')
        
        return queryset

    @action(detail=False, methods=['post'], url_path='exportar-excel')
    def exportar_excel(self, request):
        """
        Exporta los datos filtrados a Excel basándose en una lista de columnas.
        Soporta campos dinámicos y relacionales a través del serializador.
        """
        import openpyxl
        from django.http import HttpResponse
        
        columns = request.data.get('columns', [])
        if not columns:
            return Response({"error": "Debe especificar las columnas a exportar."}, status=400)
            
        # 1. Obtener datos filtrados
        queryset = self.filter_queryset(self.get_queryset())
        
        # 2. Preparar el Libro de Excel
        model = self.get_serializer_class().Meta.model
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = getattr(model._meta, 'verbose_name_plural', 'Datos').capitalize()
        
        # 3. Headers (Verbose names o el ID de la columna)
        headers = []
        for col_id in columns:
            try:
                field = model._meta.get_field(col_id.split('__')[0])
                headers.append(getattr(field, 'verbose_name', col_id).upper())
            except:
                headers.append(col_id.replace('_', ' ').upper())
        ws.append(headers)
        
        # 4. Datos (Usando el Serializador para respetar la lógica de negocio/propiedades)
        serializer_class = self.get_serializer_class()
        
        for obj in queryset:
            data = serializer_class(obj).data
            row = []
            for col_id in columns:
                # Soporte para campos anidados (limitado a 1 nivel para este exportador genérico)
                # p.ej: 'cliente__nombre'
                if '__' in col_id:
                    parts = col_id.split('__')
                    val = data
                    for p in parts:
                        val = val.get(p) if isinstance(val, dict) else None
                else:
                    val = data.get(col_id)
                
                # Formateo básico de valores complejos
                if isinstance(val, bool):
                    val = 'SÍ' if val else 'NO'
                elif val is None:
                    val = ''
                
                row.append(str(val))
            ws.append(row)
            
        # 5. Respuesta
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        filename = f"Export_{ws.title}_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        wb.save(response)
        return response

    @action(detail=False, methods=['get'])
    def inactivos(self, request):
        """
        Endpoint común para listar registros inactivos (soft-deleted).
        GET /.../inactivos/
        """
        model = self.get_serializer_class().Meta.model
        if not hasattr(model, 'activo'):
            # Algunos modelos pueden usar 'is_active'
            if hasattr(model, 'is_active'):
                queryset = model.objects.filter(is_active=False)
            else:
                return Response({"error": "Este modelo no soporta borrado lógico con campo 'activo'."}, status=400)
        else:
            # Usamos el manager 'all_objects' para ignorar el filtro por defecto de 'objects'
            if hasattr(model, 'all_objects'):
                queryset = model.all_objects.filter(activo=False)
            else:
                queryset = model.objects.filter(activo=False)
            
        # Soportar búsqueda y otros filtros del ViewSet
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


from .permissions import HasPermissionForAction

class EmpresaViewSet(BaseViewSet):
    """
    ViewSet para gestionar empresas.
    CRUD completo para usuarios con permisos (Admin/Superuser).
    """
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [HasPermissionForAction]

    def get_queryset(self):
        """
        Retorna las empresas permitidas.
        - Superuser: Todas.
        - Normal: Solo asignadas.
        Además aplica filtro de 'activo' estándar.
        """
        user = self.request.user
        if user.is_superuser:
            queryset = Empresa.objects.all()
        else:
            queryset = user.empresas_acceso.all()
        
        # Filtrado por 'activo' (copiado de BaseViewSet para asegurar compatibilidad)
        if hasattr(queryset.model, 'activo'):
            activo = self.request.query_params.get('activo', None)
            if activo is not None:
                queryset = queryset.filter(activo=activo.lower() == 'true')
                
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mis_empresas(self, request):
        """
        Retorna las empresas del usuario y la empresa actual.
        GET /api/empresas/mis_empresas/
        """
        user = request.user
        
        # Obtener empresas con acceso (respetando lógica get_queryset simplificada)
        if user.is_superuser:
            empresas = Empresa.objects.filter(activo=True)
        else:
            empresas = user.empresas_acceso.filter(activo=True)
        
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cambiar(self, request, pk=None):
        """
        Cambia la empresa activa en la sesión del usuario.
        POST /api/empresas/{id}/cambiar/
        """
        # Usamos get_object para que aplique get_queryset y valide acceso
        try:
            empresa = self.get_object()
        except:
             return Response(
                {'detail': 'No tienes acceso a esta empresa o no existe.'},
                status=status.HTTP_403_FORBIDDEN
            )

        user = request.user
        
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


