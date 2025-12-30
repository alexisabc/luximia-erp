from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import viewsets, status
from .models import ConfiguracionGlobal
from .serializers import ConfiguracionPublicaSerializer, ConfiguracionAdminSerializer
from .services import get_global_config

def home(request):
    """Simple root view to avoid 404 warnings."""
    return JsonResponse({"message": "Luximia ERP API", "api": "/api/"})

class ConfiguracionPublicaView(APIView):
    """
    Endpoint público para obtener el branding del ERP.
    Útil para personalizar la pantalla de login antes de que el usuario se autentique.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        config = get_global_config()
        serializer = ConfiguracionPublicaSerializer(config, context={'request': request})
        return Response(serializer.data)

class ConfiguracionAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión total de la configuración por parte de administradores.
    Como es un Singleton, siempre actuamos sobre la misma instancia.
    """
    permission_classes = [IsAdminUser]
    serializer_class = ConfiguracionAdminSerializer
    queryset = ConfiguracionGlobal.objects.all()

    def get_object(self):
        """Siempre retorna la instancia única."""
        return ConfiguracionGlobal.get_solo()

    def list(self, request, *args, **kwargs):
        """Simplifica el list para retornar el objeto directamente en vez de un array."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Redirige la creación a una actualización por el patrón Singleton."""
        return self.update(request, *args, **kwargs)
