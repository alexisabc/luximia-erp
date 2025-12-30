from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notificacion
from .serializers import NotificacionSerializer
from .services import NotificacionService

class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para que el usuario consulte y gestione sus notificaciones.
    """
    serializer_class = NotificacionSerializer

    def get_queryset(self):
        """El usuario solo ve sus propias notificaciones."""
        return Notificacion.objects.filter(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def marcar_leidas(self, request):
        """
        Marca notificaciones como leídas.
        Acepta una lista de ids o 'all'.
        """
        ids = request.data.get('ids', 'all')
        success = NotificacionService.marcar_como_leida(request.user.id, ids)
        return Response({'status': 'ok', 'updated_count': success})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Retorna el conteo de no leídas para el badge del frontend.
        """
        count = NotificacionService.obtener_conteo_no_leidas(request.user.id)
        return Response({'count': count})
