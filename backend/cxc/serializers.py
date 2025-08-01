# backend/cxc/serializers.py

# ==============================================================================
# --- IMPORTS ---
# ==============================================================================
from rest_framework import serializers
from django.contrib.auth.models import User, Group, Permission
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from decimal import Decimal
from django.utils import timezone

# ### CAMBIO: AÑADE ESTA LÍNEA ###
from django.db.models import Sum, F, When, Case, DecimalField

# --- Importaciones de Modelos Locales ---

from .models import Proyecto, Cliente, Departamento, UPE, Contrato, Pago, PlanDePagos, TipoDeCambio, AuditLog


from .models import Proyecto, Cliente, UPE, Contrato, Pago, PlanDePagos, TipoDeCambio, AuditLog, EsquemaComision

from .models import Proyecto, Cliente, UPE, Contrato, Pago, PlanDePagos, TipoDeCambio, AuditLog, Banco



# ==============================================================================
# --- SERIALIZERS DE MODELOS PRINCIPALES ---
# ==============================================================================

class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = '__all__'



class ClienteSerializer(serializers.ModelSerializer):
    proyectos_asociados = serializers.SerializerMethodField()

class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    proyectos_asociados = serializers.SerializerMethodField()


    class Meta:
        model = Cliente
        fields = ['id', 'nombre_completo', 'telefono',
                  'email', 'activo', 'proyectos_asociados']

    def get_proyectos_asociados(self, obj):
        proyectos = obj.contratos.select_related('upe__proyecto').values_list(
            'upe__proyecto__nombre', flat=True).distinct()
        return list(proyectos)


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'


class UPESerializer(serializers.ModelSerializer):
    class Meta:
        model = UPE
        fields = '__all__'


class UPEReadSerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(
        source='proyecto.nombre', read_only=True)

    class Meta:
        model = UPE

        fields = ['id', 'identificador', 'valor_total',
                  'moneda', 'estado', 'proyecto', 'proyecto_nombre']


class EsquemaComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EsquemaComision
        fields = '__all__'


        fields = ['id', 'identificador', 'nivel', 'metros_cuadrados',
                  'estacionamientos', 'valor_total',
                  'moneda', 'estado', 'proyecto', 'proyecto_nombre']



# ==============================================================================
# --- SERIALIZERS DE ESCRITURA Y LECTURA DE MODELOS ---
# ==============================================================================

class PlanDePagosSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar las cuotas del plan de pagos.
    """
    class Meta:
        model = PlanDePagos
        fields = ['id', 'fecha_vencimiento',
                  'monto_programado', 'tipo', 'pagado']


class PagoWriteSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar Pagos.
    """
    class Meta:
        model = Pago
        fields = [
            'contrato', 'concepto', 'monto_pagado', 'moneda_pagada', 'tipo_cambio',
            'fecha_pago', 'fecha_ingreso_cuentas', 'instrumento_pago',
            'ordenante', 'banco_origen', 'num_cuenta_origen',
            'banco_destino', 'cuenta_beneficiaria', 'comentarios'
        ]

    def validate(self, data):
        # ### LÓGICA DE VALIDACIÓN ACTUALIZADA ###
        # Si estamos editando, usamos la instancia actual. Si estamos creando, usamos los datos.
        contrato = data.get('contrato', self.instance.contrato)
        monto_nuevo_pago = data.get('monto_pagado', self.instance.monto_pagado)
        moneda_nuevo_pago = data.get('moneda_pagada', self.instance.moneda_pagada)
        tipo_cambio_nuevo = data.get('tipo_cambio', self.instance.tipo_cambio)

        monto_nuevo_pago_convertido = monto_nuevo_pago
        if moneda_nuevo_pago == 'USD':
             monto_nuevo_pago_convertido = monto_nuevo_pago * tipo_cambio_nuevo

        # Excluimos el pago actual del cálculo si estamos editando
        pagos_anteriores = contrato.pagos.all()
        if self.instance:
            pagos_anteriores = pagos_anteriores.exclude(pk=self.instance.pk)

        total_ya_pagado = pagos_anteriores.aggregate(
            total=Sum(
                Case(
                    When(moneda_pagada='USD', then=F('monto_pagado') * F('tipo_cambio')),
                    default=F('monto_pagado'),
                    output_field=DecimalField()
                )
            )
        )['total'] or 0

        adeudo_actual = contrato.precio_final_pactado - total_ya_pagado

        if monto_nuevo_pago_convertido > (adeudo_actual + Decimal('0.01')):
            raise serializers.ValidationError(
                f"El pago excede el adeudo restante. Adeudo actual: {adeudo_actual:,.2f} {contrato.moneda_pactada}."
            )
        
        return data


class PagoReadSerializer(serializers.ModelSerializer):
    """
    Serializer para leer los detalles de un Pago.
    """
    valor_mxn = serializers.ReadOnlyField()

    # ### LÍNEA AÑADIDA ###
    # Forzamos que este campo conserve sus 4 decimales al ser serializado.
    tipo_cambio = serializers.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        model = Pago
        fields = '__all__'


class ContratoWriteSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar Contratos.
    Ahora incluye los términos del financiamiento.
    """
    class Meta:
        model = Contrato
        fields = [
            'upe', 'cliente', 'fecha_venta', 'estado',
            'precio_final_pactado', 'moneda_pactada',
            'monto_enganche', 'numero_mensualidades', 'tasa_interes_mensual'
        ]


class ContratoReadSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    upe = UPEReadSerializer(read_only=True)
    plan_de_pagos = PlanDePagosSerializer(many=True, read_only=True)

    # ### CAMBIO 1: Reemplazamos 'pagos' con este nuevo campo ###
    historial_con_saldo = serializers.SerializerMethodField()

    total_pagado = serializers.SerializerMethodField()
    adeudo = serializers.SerializerMethodField()
    intereses_generados = serializers.SerializerMethodField()
    adeudo_al_corte = serializers.SerializerMethodField()

    class Meta:
        model = Contrato
        fields = [
            'id', 'upe', 'cliente', 'fecha_venta', 'estado',
            'precio_final_pactado', 'moneda_pactada',
            'total_pagado', 'adeudo', 'intereses_generados', 'adeudo_al_corte',
            'plan_de_pagos',
            # ### CAMBIO 2: Usamos el nuevo nombre del campo ###
            'historial_con_saldo'
        ]

    # ### CAMBIO 3: Añadimos este método para calcular el saldo ###
    def get_historial_con_saldo(self, obj):
        pagos = obj.pagos.order_by('fecha_pago', 'id')
        saldo_actual = obj.precio_final_pactado

        historial = []
        for pago in pagos:
            # Serializamos el pago para tener sus datos base
            pago_data = PagoReadSerializer(pago).data
            # Calculamos el saldo DESPUÉS de este pago
            saldo_actual -= Decimal(pago_data['valor_mxn'])
            pago_data['saldo_despues_del_pago'] = saldo_actual
            historial.append(pago_data)

        return historial


    def get_adeudo(self, obj):
        # El adeudo es simplemente el precio menos lo que ha pagado
        # ### CAMBIO: Nos aseguramos de que precio_final_pactado no sea None ###
        precio_final = obj.precio_final_pactado or Decimal('0.0')
        return precio_final - self.get_total_pagado(obj)

    def get_intereses_generados(self, obj):
        """
        Lógica para calcular intereses sobre saldo vencido, ahora más robusta.
        """
        tasa = obj.tasa_interes_mensual or Decimal('0.0')
        if tasa == 0:
            return Decimal('0.0')

        hoy = timezone.now().date()
        saldo_vencido = Decimal('0.0')

        # ### CAMBIO: Se añade 'fecha_vencimiento__isnull=False' para evitar errores con valores nulos ###
        pagos_vencidos = obj.plan_de_pagos.filter(
            pagado=False,
            fecha_vencimiento__isnull=False,  # <-- ¡ESTA ES LA LÍNEA CLAVE!
            fecha_vencimiento__lt=hoy
        )

        for pago_programado in pagos_vencidos:
            monto = pago_programado.monto_programado or Decimal('0.0')
            saldo_vencido += monto

        intereses = saldo_vencido * tasa
        return round(intereses, 2)

    def get_adeudo_al_corte(self, obj):
        # El adeudo total es el capital pendiente más los intereses generados
        # No necesita cambios, ya que depende de los otros métodos ya corregidos.
        return self.get_adeudo(obj) + self.get_intereses_generados(obj)

    def get_saldo_pendiente_mxn(self, obj):
        """
        Calcula el saldo pendiente total de un contrato, convirtiendo
        todos los montos a MXN para una suma consistente.
        """
        # ### CAMBIO: Se usa el nuevo campo 'fecha_pago' y 'tipo_cambio' ###
        ultimo_pago_usd = Pago.objects.filter(
            moneda_pagada='USD').order_by('-fecha_pago').first()

        tipo_cambio_reciente = ultimo_pago_usd.tipo_cambio if ultimo_pago_usd else Decimal(
            '17.50')

        precio_contrato = obj.precio_final_pactado or Decimal('0.0')

        valor_contrato_en_mxn = precio_contrato
        if obj.moneda_pactada == 'USD':
            valor_contrato_en_mxn = precio_contrato * tipo_cambio_reciente

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
                Decimal('0.0')
            )
        )['total']

        saldo = valor_contrato_en_mxn - total_pagado_mxn
        return round(saldo, 2)

    def get_total_pagado(self, obj):
        """
        Calcula la suma total de los pagos, convirtiendo
        diferentes monedas a un valor consistente.
        """
        total = obj.pagos.aggregate(
            total=Sum(
                Case(
                    When(moneda_pagada='USD', then=F(
                        'monto_pagado') * F('tipo_cambio')),
                    default=F('monto_pagado'),
                    output_field=DecimalField()
                )
            )
        )['total'] or 0
        return total
# ==============================================================================
# --- SERIALIZERS DE AUTENTICACIÓN Y USUARIOS  ---
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
        queryset=Permission.objects.all(), many=True, required=False)

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
        write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(), many=True, required=False)

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
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
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

# ==============================================================================
# --- SERIALIZERS DE UTILIDADES  ---
# ==============================================================================

class TipoDeCambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDeCambio
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'model_name', 'object_id', 'timestamp', 'changes']
