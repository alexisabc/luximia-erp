# core/serializers.py
from rest_framework import serializers
from .models import Empresa


class EmpresaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Empresa.
    """
    direccion_completa = serializers.ReadOnlyField()
    
    class Meta:
        model = Empresa
        fields = [
            'id',
            'codigo',
            'razon_social',
            'nombre_comercial',
            'rfc',
            'regimen_fiscal',
            'codigo_postal',
            'calle',
            'numero_exterior',
            'numero_interior',
            'colonia',
            'municipio',
            'estado',
            'pais',
            'logo',
            'color_primario',
            'telefono',
            'email',
            'sitio_web',
            'serie_factura',
            'folio_inicial',
            'activo',
            'direccion_completa',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'direccion_completa']
