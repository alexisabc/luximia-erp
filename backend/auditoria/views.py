from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from auditoria.models import AuditLog
from auditoria.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para registros de auditoría.
    Solo accesible para administradores.
    Los logs de auditoría son inmutables.
    """
    queryset = AuditLog.objects.all().select_related(
        'usuario', 'content_type'
    ).order_by('-fecha')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['usuario', 'accion', 'content_type', 'object_id']
    search_fields = ['object_repr', 'descripcion', 'ip_address']
    ordering_fields = ['fecha', 'accion']
    ordering = ['-fecha']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por rango de fechas
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
        
        return queryset
