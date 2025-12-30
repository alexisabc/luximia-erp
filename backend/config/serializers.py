from rest_framework import serializers
from .models import ConfiguracionGlobal

class ConfiguracionPublicaSerializer(serializers.ModelSerializer):
    """
    Serializer para datos básicos accesibles sin autenticación.
    Usado en el login para mostrar Branding dinámico.
    """
    class Meta:
        model = ConfiguracionGlobal
        fields = ['nombre_sistema', 'logo_login', 'favicon']

class ConfiguracionAdminSerializer(serializers.ModelSerializer):
    """
    Serializer completo para la administración del ERP.
    Incluye campos fiscales y operativos.
    """
    class Meta:
        model = ConfiguracionGlobal
        fields = '__all__'
        read_only_fields = ['id']
