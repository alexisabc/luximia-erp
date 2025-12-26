# core/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Empresa
from .serializers import EmpresaSerializer

import openpyxl
from django.db import transaction
from django.apps import apps
from django.db import models

class ExcelImportMixin:
    """
    Mixin para dotar a cualquier ViewSet de capacidad de importación vía Excel.
    Espera un archivo 'file' en el request.
    """
    
    @action(detail=False, methods=['get'], url_path='exportar-plantilla')
    def exportar_plantilla(self, request):
        """
        Genera una plantilla de Excel con los encabezados correctos para la importación.
        """
        import openpyxl
        from django.http import HttpResponse
        
        model = self.get_serializer_class().Meta.model
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Plantilla Importación"
        
        # Obtener campos mapeables
        headers = []
        help_text = []
        
        for field in model._meta.get_fields():
            if field.concrete and not field.is_relation or (field.is_relation and field.many_to_one):
                # Excluir campos autogenerados o system fields
                # Se incluyen variaciones comunes de campos de auditoría
                excluded_fields = [
                    'id', 'created_at', 'updated_at', 'deleted_at', 'deleted_by', 
                    'usuario_creacion', 'usuario_modificacion',
                    'creado_por', 'actualizado_por',
                    'created_by', 'updated_by', 
                    'activo', 'is_active', 'status' # Agregamos activo/is_active según solicitud
                ]
                
                if field.name in excluded_fields:
                    continue
                    
                verbose = getattr(field, 'verbose_name', field.name).upper()
                headers.append(verbose)
                
                # Traducir tipos de dato técnicos a lenguaje usuario
                internal_type = field.get_internal_type()
                
                type_map = {
                    'CharField': 'Texto Corto',
                    'TextField': 'Texto Largo',
                    'IntegerField': 'Número Entero',
                    'BigIntegerField': 'Número Entero',
                    'DecimalField': 'Número Decimal',
                    'FloatField': 'Número Decimal',
                    'BooleanField': 'Sí/No',
                    'DateField': 'Fecha (AAAA-MM-DD)',
                    'DateTimeField': 'Fecha y Hora',
                    'EmailField': 'Correo Electrónico',
                    'URLField': 'Enlace Web',
                }
                
                friendly_type = type_map.get(internal_type, internal_type)
                
                if field.is_relation:
                    # Obtener nombre legible del modelo relacionado
                    related_name = field.related_model._meta.verbose_name
                    friendly_type = f"ID o Nombre de {related_name}"
                
                required = not field.blank and not field.null
                req_text = "*" if required else ""
                
                help_text.append(f"{friendly_type}{req_text}")

        # Escribir Headers
        ws.append(headers)
        
        # Escribir fila de ayuda (opcional, estilo gris)
        ws.append(help_text)
        
        # Estilar headers
        from openpyxl.styles import Font, PatternFill
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid") # Indigo 600
        
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill

        # Ajustar ancho columnas
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter # Get the column name
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            ws.column_dimensions[column].width = adjusted_width

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        filename = f"Plantilla_Importar_{model._meta.verbose_name_plural}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        wb.save(response)
        return response

    @action(detail=False, methods=['post'], url_path='importar-excel')
    def importar_excel(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No se proporcionó archivo'}, status=400)
            
        file_obj = request.FILES['file']
        
        try:
            wb = openpyxl.load_workbook(file_obj, data_only=True)
            ws = wb.active # Tomar primera hoja por defecto
            
            model = self.get_serializer_class().Meta.model
            
            # 1. Detectar Headers (Asumimos fila 1)
            # Todo: Usar lógica más inteligente de búsqueda de header si es necesario
            headers = [cell.value for cell in ws[1]]
            headers_map = {} # {col_idx: field_name}
            
            # Mapa de Campos del Modelo (Normalizados)
            model_fields = {}
            for field in model._meta.get_fields():
                if field.concrete and not field.is_relation or (field.is_relation and field.many_to_one):
                     name = field.name
                     verbose = getattr(field, 'verbose_name', name)
                     
                     model_fields[name.upper()] = field
                     model_fields[verbose.upper()] = field
            
            # Mapeo Columnas Excel -> Campos Modelo
            for idx, header in enumerate(headers):
                if not header: continue
                h_norm = str(header).strip().upper()
                
                # Match directo
                if h_norm in model_fields:
                    headers_map[idx] = model_fields[h_norm]
            
            if not headers_map:
                return Response({'error': 'No se pudieron mapear columnas válidas. Use los nombres de campo o verbose names.'}, status=400)

            created_count = 0
            updated_count = 0
            errors = []
            
            # 2. Procesar Filas
            with transaction.atomic():
                for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                    row_data = {}
                    
                    try:
                        # Construir dict de datos
                        for col_idx, field in headers_map.items():
                            val = row[col_idx] if col_idx < len(row) else None
                            
                            if val is None:
                                continue
                                
                            # Handling Foreign Keys (Simple Name Lookup)
                            if field.is_relation and isinstance(val, str):
                                # Asumimos que el string es el 'nombre' o string representation del FK
                                # Intentamos buscar por 'nombre', 'descripcion', 'codigo' o 'id'
                                rel_model = field.related_model
                                rel_obj = None
                                
                                # Heurística de búsqueda
                                search_fields = ['nombre', 'descripcion', 'codigo', 'slug', 'username']
                                q_filters = models.Q(pk=val) if str(val).isdigit() else models.Q()
                                for sf in search_fields:
                                    if hasattr(rel_model, sf):
                                        q_filters |= models.Q(**{sf + '__iexact': val})
                                        
                                rel_obj = rel_model.objects.filter(q_filters).first()
                                if rel_obj:
                                    row_data[field.name] = rel_obj
                                else:
                                    # Si no encuentra, y es nullable, dejar pasar. Si required, fallará validación.
                                    pass 
                            else:
                                row_data[field.name] = val
                        
                        if not row_data: continue

                        # Identificar registro único (UPDATE vs CREATE)
                        # Usar all_objects para encontrar registros incluso si están inactivos
                        manager = getattr(model, 'all_objects', model.objects)
                        pk_field = model._meta.pk.name
                        instance = None
                        
                        if pk_field in row_data:
                            try:
                                instance = manager.filter(pk=row_data[pk_field]).first()
                            except:
                                pass
                        
                        # Si no hay PK o no se encontró, buscar por campos unique
                        if not instance:
                            unique_fields = [f.name for f in model._meta.get_fields() if getattr(f, 'unique', False) and f.name in row_data]
                            if unique_fields:
                                q = {k: row_data[k] for k in unique_fields}
                                instance = manager.filter(**q).first()

                        if instance:
                            for k, v in row_data.items():
                                setattr(instance, k, v)
                            # Si el modelo tiene campo 'activo', lo restauramos al importar
                            if hasattr(instance, 'activo'):
                                instance.activo = True
                            instance.save()
                            updated_count += 1
                        else:
                            model.objects.create(**row_data)
                            created_count += 1
                            
                    except Exception as e:
                        errors.append(f"Fila {row_idx}: {str(e)}")
            
            return Response({
                'status': 'success',
                'created': created_count,
                'updated': updated_count,
                'errors': errors[:20] # Top 20 errores
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class BaseViewSet(ExcelImportMixin, viewsets.ModelViewSet):
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


