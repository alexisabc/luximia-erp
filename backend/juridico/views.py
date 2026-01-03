from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from .models import PlantillaLegal, DocumentoFirmado
from .serializers import PlantillaLegalSerializer, DocumentoFirmadoSerializer, FirmarDocumentoSerializer
from .services import FirmaService


class PlantillaLegalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar plantillas legales.
    CRUD completo para administradores.
    """
    queryset = PlantillaLegal.objects.all()
    serializer_class = PlantillaLegalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por activas si se solicita"""
        qs = super().get_queryset()
        solo_activas = self.request.query_params.get('activas', None)
        
        if solo_activas == 'true':
            qs = qs.filter(activo=True)
        
        return qs


class DocumentoFirmadoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar documentos firmados.
    Solo lectura: list y retrieve.
    """
    queryset = DocumentoFirmado.objects.all()
    serializer_class = DocumentoFirmadoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por tipo de objeto o estado"""
        qs = super().get_queryset()
        
        # Filtrar por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            qs = qs.filter(estado=estado)
        
        # Filtrar por tipo de contenido
        content_type_id = self.request.query_params.get('content_type', None)
        if content_type_id:
            qs = qs.filter(content_type_id=content_type_id)
        
        # Filtrar por objeto específico
        object_id = self.request.query_params.get('object_id', None)
        if object_id:
            qs = qs.filter(object_id=object_id)
        
        return qs
    
    @decorators.action(detail=True, methods=['post'])
    def verificar(self, request, pk=None):
        """
        Verifica la integridad de un documento firmado.
        """
        documento = self.get_object()
        resultado = FirmaService.verificar_documento(documento)
        
        return Response(resultado)
    
    @decorators.action(detail=False, methods=['post'])
    def firmar(self, request):
        """
        Genera y firma un nuevo documento legal.
        
        Body esperado:
        {
            "plantilla_id": 1,
            "content_type": "rrhh.empleado",
            "object_id": 5,
            "datos_contexto": {
                "nombre": "Juan Pérez",
                "puesto": "Desarrollador",
                ...
            },
            "datos_meta": {
                "ip": "192.168.1.1",
                "user_agent": "Mozilla/5.0..."
            }
        }
        """
        serializer = FirmarDocumentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Obtener plantilla
        plantilla = get_object_or_404(PlantillaLegal, pk=data['plantilla_id'])
        
        # Obtener ContentType
        try:
            app_label, model = data['content_type'].split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            return Response(
                {"detail": "content_type inválido. Formato: 'app.modelo'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener objeto vinculado
        model_class = content_type.model_class()
        try:
            objeto = model_class.objects.get(pk=data['object_id'])
        except model_class.DoesNotExist:
            return Response(
                {"detail": f"No se encontró {content_type} con ID {data['object_id']}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generar y firmar documento
        try:
            documento = FirmaService.firmar_documento(
                plantilla=plantilla,
                objeto=objeto,
                usuario_firmante=request.user,
                datos_contexto=data['datos_contexto'],
                datos_meta=data.get('datos_meta', {})
            )
            
            return Response(
                DocumentoFirmadoSerializer(documento).data,
                status=status.HTTP_201_CREATED
            )
        
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
