from rest_framework import serializers
from django.db import transaction
from .models import (
    Departamento,
    Puesto,
    Empleado,
    CentroTrabajo,
    RazonSocial,
    EmpleadoDetallePersonal,
    EmpleadoDocumentacionOficial,
    EmpleadoDatosLaborales,
    EmpleadoNominaBancaria,
    EmpleadoCreditoInfonavit,
    EmpleadoContactoEmergencia,
)


class CentroTrabajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentroTrabajo
        fields = "__all__"


class RazonSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RazonSocial
        fields = "__all__"


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"


class PuestoSerializer(serializers.ModelSerializer):
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)

    class Meta:
        model = Puesto
        fields = "__all__"


class EmpleadoDetallePersonalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoDetallePersonal
        exclude = ('empleado',)


class EmpleadoDocumentacionOficialSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoDocumentacionOficial
        exclude = ('empleado',)


class EmpleadoDatosLaboralesSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoDatosLaborales
        exclude = ('empleado',)


class EmpleadoNominaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoNominaBancaria
        exclude = ('empleado',)


class EmpleadoCreditoInfonavitSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoCreditoInfonavit
        exclude = ('empleado',)


class EmpleadoContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpleadoContactoEmergencia
        exclude = ('empleado',)


class EmpleadoSerializer(serializers.ModelSerializer):
    detalle_personal = EmpleadoDetallePersonalSerializer(required=False)
    documentacion_oficial = EmpleadoDocumentacionOficialSerializer(required=False)
    datos_laborales = EmpleadoDatosLaboralesSerializer(required=False)
    nomina_bancaria = EmpleadoNominaBancariaSerializer(required=False)
    creditos_infonavit = EmpleadoCreditoInfonavitSerializer(many=True, required=False)
    contactos_emergencia = EmpleadoContactoEmergenciaSerializer(many=True, required=False)

    # Campos de solo lectura para display en frontend
    user_username = serializers.CharField(source='user.username', read_only=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True)
    puesto_nombre = serializers.CharField(source='puesto.nombre', read_only=True)
    centro_trabajo_nombre = serializers.CharField(source='centro_trabajo.nombre', read_only=True)
    razon_social_nombre = serializers.CharField(source='razon_social.nombre_o_razon_social', read_only=True)

    class Meta:
        model = Empleado
        fields = "__all__"

    @transaction.atomic
    def create(self, validated_data):
        detalle_personal_data = validated_data.pop('detalle_personal', None)
        documentacion_oficial_data = validated_data.pop('documentacion_oficial', None)
        datos_laborales_data = validated_data.pop('datos_laborales', None)
        nomina_bancaria_data = validated_data.pop('nomina_bancaria', None)
        creditos_infonavit_data = validated_data.pop('creditos_infonavit', [])
        contactos_emergencia_data = validated_data.pop('contactos_emergencia', [])

        empleado = Empleado.objects.create(**validated_data)

        if detalle_personal_data:
            EmpleadoDetallePersonal.objects.create(empleado=empleado, **detalle_personal_data)
        if documentacion_oficial_data:
            EmpleadoDocumentacionOficial.objects.create(empleado=empleado, **documentacion_oficial_data)
        if datos_laborales_data:
            EmpleadoDatosLaborales.objects.create(empleado=empleado, **datos_laborales_data)
        if nomina_bancaria_data:
            EmpleadoNominaBancaria.objects.create(empleado=empleado, **nomina_bancaria_data)

        for credito_data in creditos_infonavit_data:
            EmpleadoCreditoInfonavit.objects.create(empleado=empleado, **credito_data)

        for contacto_data in contactos_emergencia_data:
            EmpleadoContactoEmergencia.objects.create(empleado=empleado, **contacto_data)

        return empleado

    @transaction.atomic
    def update(self, instance, validated_data):
        detalle_personal_data = validated_data.pop('detalle_personal', None)
        documentacion_oficial_data = validated_data.pop('documentacion_oficial', None)
        datos_laborales_data = validated_data.pop('datos_laborales', None)
        nomina_bancaria_data = validated_data.pop('nomina_bancaria', None)
        creditos_infonavit_data = validated_data.pop('creditos_infonavit', None)
        contactos_emergencia_data = validated_data.pop('contactos_emergencia', None)

        # Update Main Fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update Relations
        if detalle_personal_data:
            EmpleadoDetallePersonal.objects.update_or_create(empleado=instance, defaults=detalle_personal_data)
        
        if documentacion_oficial_data:
            EmpleadoDocumentacionOficial.objects.update_or_create(empleado=instance, defaults=documentacion_oficial_data)
            
        if datos_laborales_data:
            EmpleadoDatosLaborales.objects.update_or_create(empleado=instance, defaults=datos_laborales_data)

        if nomina_bancaria_data:
            EmpleadoNominaBancaria.objects.update_or_create(empleado=instance, defaults=nomina_bancaria_data)

        if creditos_infonavit_data is not None:
            instance.creditos_infonavit.all().delete()
            for credito_data in creditos_infonavit_data:
                EmpleadoCreditoInfonavit.objects.create(empleado=instance, **credito_data)

        if contactos_emergencia_data is not None:
            instance.contactos_emergencia.all().delete()
            for contacto_data in contactos_emergencia_data:
                EmpleadoContactoEmergencia.objects.create(empleado=instance, **contacto_data)

        return instance
