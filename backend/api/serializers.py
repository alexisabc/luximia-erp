# ==============================================================================
# --- IMPORTS ---
# ==============================================================================
from rest_framework import serializers
from django.contrib.auth.models import User, Group, Permission
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from decimal import Decimal
# ### CAMBIO: Añadimos las herramientas para hacer la consulta a nivel de DB ###
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import Coalesce

# --- Importaciones de Modelos Locales ---
from .models import Proyecto, Cliente, UPE, Contrato, Pago


# ==============================================================================
# --- SERIALIZERS DE MODELOS PRINCIPALES ---
# ==============================================================================

class ProyectoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Proyecto. Usado para todas las operaciones CRUD."""
    class Meta:
        model = Proyecto
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Cliente. Usado para todas las operaciones CRUD."""
    class Meta:
        model = Cliente
        fields = '__all__'


# --- Serializers para UPE (Unidad Privativa Enajenable) ---

class UPESerializer(serializers.ModelSerializer):
    """Serializer para ESCRIBIR (crear/actualizar) datos de UPEs."""
    class Meta:
        model = UPE
        fields = '__all__'


class UPEReadSerializer(serializers.ModelSerializer):
    """
    Serializer para LEER datos de UPEs.
    Añade campos de solo lectura para facilitar su uso en el frontend.
    """
    proyecto_nombre = serializers.CharField(
        source='proyecto.nombre',
        read_only=True,
        allow_null=True  # Previene un crash si no hay proyecto.
    )

    class Meta:
        model = UPE
        fields = [
            'id',
            'identificador',
            'valor_total',
            'moneda',
            'estado',
            'proyecto',
            'proyecto_nombre'
        ]


# --- Serializers para Contrato ---

class ContratoWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRIBIR (crear/actualizar) datos de Contratos."""
    class Meta:
        model = Contrato
        fields = '__all__'


class ContratoReadSerializer(serializers.ModelSerializer):
    """
    Serializer para LEER datos de Contratos con información anidada de sus relaciones.
    Ideal para las vistas de detalle y listado.
    """
    cliente = ClienteSerializer(read_only=True)
    upe = UPEReadSerializer(read_only=True)
    saldo_pendiente_mxn = serializers.SerializerMethodField()

    class Meta:
        model = Contrato
        fields = [
            'id',
            'upe',
            'cliente',
            'fecha_venta',
            'precio_final_pactado',
            'moneda_pactada',
            'saldo_pendiente_mxn'
        ]

    def get_saldo_pendiente_mxn(self, obj):
        """
        Calcula el saldo pendiente total de un contrato, convirtiendo
        todos los montos a MXN para una suma consistente.
        """
        ultimo_pago_usd = Pago.objects.filter(
            moneda_pagada='USD').order_by('-fecha_pago').first()
        tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
            '17.50')

        precio_contrato = obj.precio_final_pactado or Decimal('0.0')

        valor_contrato_en_mxn = precio_contrato
        if obj.moneda_pactada == 'USD':
            valor_contrato_en_mxn = precio_contrato * tipo_cambio_reciente

        # ### CAMBIO CLAVE ###
        # Replicamos la lógica de la @property a nivel de base de datos.
        # Esto es lo que se ejecutará en SQL, por lo que es muy eficiente.
        total_pagado_mxn = obj.pagos.aggregate(
            total=Coalesce(
                Sum(
                    Case(
                        When(moneda_pagada='USD', then=F(
                            'monto_pagado') * F('tipo_cambio')),
                        default=F('monto_pagado'),
                        output_field=DecimalField()
                    )
                ),
                Decimal('0.0')  # Valor por defecto si no hay pagos
            )
        )['total']

        saldo = valor_contrato_en_mxn - total_pagado_mxn
        return round(saldo, 2)


# --- Serializers para Pago ---

class PagoWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRIBIR (crear/actualizar) datos de Pagos."""
    class Meta:
        model = Pago
        fields = '__all__'


class PagoReadSerializer(serializers.ModelSerializer):
    """
    Serializer para LEER datos de Pagos.
    Incluye el ID del contrato y el monto calculado en MXN.
    """
    contrato_id = serializers.IntegerField(
        source='contrato.id', read_only=True)
    monto_en_mxn = serializers.ReadOnlyField()

    class Meta:
        model = Pago
        fields = [
            'id',
            'contrato_id',
            'fecha_pago',
            'monto_pagado',
            'moneda_pagada',
            'tipo_cambio',
            'monto_en_mxn'
        ]


# ==============================================================================
# --- SERIALIZERS DE AUTENTICACIÓN Y USUARIOS ---
# (Esta sección no ha cambiado)
# ==============================================================================

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']


class GroupReadSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class GroupWriteSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class UserReadSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name',
                  'last_name', 'is_active', 'groups']


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'}
    )
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), many=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password',
                  'first_name', 'last_name', 'is_active', 'groups']

    def create(self, validated_data):
        groups_data = validated_data.pop('groups', None)
        user = User.objects.create_user(**validated_data)
        if groups_data:
            user.groups.set(groups_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        groups_data = validated_data.pop('groups', None)
        super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        if groups_data is not None:
            instance.groups.set(groups_data)
        return instance


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['permissions'] = list(user.get_all_permissions())
        token['is_superuser'] = user.is_superuser
        return token
