from decimal import Decimal, InvalidOperation
from django.utils import timezone
from rest_framework import serializers
from .models import (
    Banco,
    Proyecto,
    UPE,
    Cliente,
    Pago,
    Moneda,
    MetodoPago,
    Presupuesto,
    Contrato,
    TipoCambio,
    Vendedor,
    FormaPago,
    PlanPago,
    EsquemaComision,
)


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = "__all__"


class ProyectoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = "__all__"


class UPESerializer(serializers.ModelSerializer):
    proyecto_nombre = serializers.CharField(source="proyecto.nombre", read_only=True)
    moneda = serializers.CharField(source="moneda.codigo", read_only=True)

    class Meta:
        model = UPE
        fields = "__all__"


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"


class MonedaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Moneda
        fields = "__all__"


class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoPago
        fields = "__all__"


class TipoCambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCambio
        fields = "__all__"


class VendedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendedor
        fields = "__all__"


class FormaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaPago
        fields = "__all__"


class PlanPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPago
        fields = "__all__"


class EsquemaComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EsquemaComision
        fields = "__all__"


class PresupuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presupuesto
        fields = "__all__"

    def validate(self, data):
        upe = data.get("upe")
        cliente = data.get("cliente")
        if upe and cliente and upe.proyecto_id != data.get("upe").proyecto_id:
            pass
        return data


class ContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contrato
        fields = "__all__"


class PagoSerializer(serializers.ModelSerializer):
    """Serializer que traduce las llaves usadas en el frontend al modelo."""

    concepto = serializers.CharField(write_only=True, required=False, allow_blank=True)
    fecha_ingreso_cuentas = serializers.DateField(write_only=True, required=False)
    monto_pagado = serializers.DecimalField(
        write_only=True, required=False, allow_null=True, max_digits=14, decimal_places=2
    )
    moneda_pagada = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tipo_cambio_valor = serializers.DecimalField(
        write_only=True, required=False, allow_null=True, max_digits=12, decimal_places=4
    )
    ordenante = serializers.CharField(write_only=True, required=False, allow_blank=True)
    num_cuenta_origen = serializers.CharField(write_only=True, required=False, allow_blank=True)
    cuenta_beneficiaria = serializers.CharField(write_only=True, required=False, allow_blank=True)

    metodo_pago_nombre = serializers.SerializerMethodField(read_only=True)
    banco_origen_nombre = serializers.SerializerMethodField(read_only=True)
    banco_destino_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Pago
        fields = [
            "id",
            "activo",
            "creado",
            "actualizado",
            "contrato",
            "tipo_pago",
            "concepto",
            "fecha_pago",
            "fecha_ingreso",
            "fecha_ingreso_cuentas",
            "metodo_pago",
            "metodo_pago_nombre",
            "monto",
            "monto_pagado",
            "moneda",
            "moneda_pagada",
            "tipo_cambio",
            "tipo_cambio_valor",
            "valor_mxn",
            "cuenta_origen",
            "num_cuenta_origen",
            "banco_origen",
            "banco_origen_nombre",
            "titular_origen",
            "ordenante",
            "cuenta_destino",
            "cuenta_beneficiaria",
            "banco_destino",
            "banco_destino_nombre",
            "comentarios",
        ]
        extra_kwargs = {
            "tipo_pago": {"required": False},
            "fecha_ingreso": {"required": False},
            "metodo_pago": {"required": True},
            "monto": {"required": False},
            "moneda": {"required": False},
            "tipo_cambio": {"required": False},
            "valor_mxn": {"required": False},
            "cuenta_origen": {"required": False, "allow_blank": True, "allow_null": True},
            "titular_origen": {"required": False, "allow_blank": True, "allow_null": True},
            "cuenta_destino": {"required": False, "allow_blank": True, "allow_null": True},
            "banco_origen": {"required": False, "allow_null": True},
            "banco_destino": {"required": False, "allow_null": True},
            "comentarios": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def to_internal_value(self, data):
        # Permite que "tipo_cambio" llegue como valor decimal en lugar de un ID.
        mutable_data = data.copy()
        raw_tipo_cambio = mutable_data.get("tipo_cambio")
        if raw_tipo_cambio not in (None, "", "null"):
            raw_str = str(raw_tipo_cambio)
            if not raw_str.isdigit():
                try:
                    Decimal(raw_str)
                except (InvalidOperation, TypeError):
                    pass
                else:
                    mutable_data = mutable_data.copy()
                    mutable_data["tipo_cambio_valor"] = raw_tipo_cambio
                    mutable_data.pop("tipo_cambio", None)
        elif "tipo_cambio" in mutable_data:
            mutable_data = mutable_data.copy()
            mutable_data.pop("tipo_cambio")

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        normalized = self._normalize_payload(validated_data)
        return super().create(normalized)

    def update(self, instance, validated_data):
        normalized = self._normalize_payload(validated_data, partial=True)
        return super().update(instance, normalized)

    # ----- Helpers de normalización -----

    def _normalize_payload(self, validated_data, partial=False):
        data = validated_data.copy()

        concepto = data.pop("concepto", serializers.empty)
        fecha_ingreso_cuentas = data.pop("fecha_ingreso_cuentas", serializers.empty)
        monto_pagado = data.pop("monto_pagado", serializers.empty)
        moneda_pagada = data.pop("moneda_pagada", serializers.empty)
        tipo_cambio_valor = data.pop("tipo_cambio_valor", serializers.empty)
        ordenante = data.pop("ordenante", serializers.empty)
        num_cuenta_origen = data.pop("num_cuenta_origen", serializers.empty)
        cuenta_beneficiaria = data.pop("cuenta_beneficiaria", serializers.empty)

        if concepto is not serializers.empty:
            data["tipo_pago"] = concepto or "PAGO"
        elif not partial and not data.get("tipo_pago"):
            data["tipo_pago"] = "PAGO"

        if fecha_ingreso_cuentas is not serializers.empty:
            data["fecha_ingreso"] = fecha_ingreso_cuentas
        elif not partial and not data.get("fecha_ingreso"):
            data["fecha_ingreso"] = data.get("fecha_pago") or timezone.now().date()

        if monto_pagado is not serializers.empty:
            data["monto"] = monto_pagado

        if moneda_pagada is not serializers.empty:
            data["moneda"] = self._resolve_moneda(moneda_pagada)

        if tipo_cambio_valor is not serializers.empty:
            data["tipo_cambio"] = self._resolve_tipo_cambio(
                tipo_cambio_valor, data.get("fecha_pago"), data.get("moneda")
            )
        elif not data.get("tipo_cambio") and not partial:
            data["tipo_cambio"] = self._resolve_tipo_cambio(
                None, data.get("fecha_pago"), data.get("moneda")
            )

        if not data.get("valor_mxn") and data.get("monto"):
            data["valor_mxn"] = self._compute_valor_mxn(
                data["monto"], data.get("moneda"), data.get("tipo_cambio")
            )

        if ordenante is not serializers.empty:
            data["titular_origen"] = ordenante or None
        if num_cuenta_origen is not serializers.empty:
            data["cuenta_origen"] = num_cuenta_origen or None
        if cuenta_beneficiaria is not serializers.empty:
            data["cuenta_destino"] = cuenta_beneficiaria or None

        self._clean_optional_strings(data, [
            "cuenta_origen",
            "titular_origen",
            "cuenta_destino",
            "comentarios",
        ])
        self._clean_optional_nullables(data, ["banco_origen", "banco_destino"])

        return data

    def _resolve_moneda(self, value):
        if isinstance(value, Moneda):
            return value
        if value in (None, ""):
            raise serializers.ValidationError({"moneda_pagada": "Este campo es requerido."})

        if isinstance(value, dict):
            candidate = value.get("id") or value.get("codigo")
        else:
            candidate = value

        candidate_str = str(candidate)
        if candidate_str.isdigit():
            try:
                return Moneda.objects.get(pk=int(candidate_str))
            except Moneda.DoesNotExist as exc:
                raise serializers.ValidationError({"moneda_pagada": "Moneda inválida."}) from exc

        try:
            return Moneda.objects.get(codigo=candidate_str.upper())
        except Moneda.DoesNotExist as exc:
            raise serializers.ValidationError({"moneda_pagada": "Moneda inválida."}) from exc

    def _resolve_tipo_cambio(self, value, fecha_pago, moneda):
        moneda_obj = None
        if isinstance(moneda, Moneda):
            moneda_obj = moneda
        elif moneda not in (None, serializers.empty, ""):
            try:
                moneda_obj = Moneda.objects.get(pk=int(moneda))
            except (ValueError, Moneda.DoesNotExist):
                moneda_obj = None

        if value in (serializers.empty, None, ""):
            base_value = Decimal("1.0") if self._is_moneda_mxn(moneda_obj) else None
        else:
            try:
                base_value = Decimal(str(value))
            except (InvalidOperation, TypeError) as exc:
                raise serializers.ValidationError({"tipo_cambio": "Valor inválido."}) from exc

        reference_date = fecha_pago or timezone.now().date()
        if base_value is None:
            raise serializers.ValidationError({"tipo_cambio": "Proporciona un tipo de cambio válido."})

        tipo_cambio, created = TipoCambio.objects.get_or_create(
            escenario="PACTADO",
            fecha=reference_date,
            defaults={"valor": base_value},
        )
        if not created and tipo_cambio.valor != base_value:
            tipo_cambio.valor = base_value
            tipo_cambio.save(update_fields=["valor"])

        return tipo_cambio

    def _compute_valor_mxn(self, monto, moneda, tipo_cambio):
        monto_value = Decimal(monto)
        moneda_obj = moneda if isinstance(moneda, Moneda) else None
        if not moneda_obj and isinstance(moneda, int):
            try:
                moneda_obj = Moneda.objects.get(pk=moneda)
            except Moneda.DoesNotExist:
                moneda_obj = None

        if self._is_moneda_mxn(moneda_obj):
            return monto_value.quantize(Decimal("0.01"))

        tipo_cambio_val = tipo_cambio.valor if isinstance(tipo_cambio, TipoCambio) else Decimal(tipo_cambio)
        return (monto_value * tipo_cambio_val).quantize(Decimal("0.01"))

    @staticmethod
    def _is_moneda_mxn(moneda):
        return bool(moneda) and moneda.codigo.upper() == "MXN"

    @staticmethod
    def _clean_optional_strings(data, keys):
        for key in keys:
            if key in data and data[key] == "":
                data[key] = None

    @staticmethod
    def _clean_optional_nullables(data, keys):
        for key in keys:
            if key in data and data[key] in ("", None):
                data[key] = None

    # ----- Representación de salida -----

    def to_representation(self, instance):
        rep = super().to_representation(instance)

        rep["tipo_cambio_id"] = rep.get("tipo_cambio")
        rep["tipo_cambio"] = (
            str(instance.tipo_cambio.valor) if instance.tipo_cambio else rep.get("tipo_cambio")
        )
        rep["tipo_cambio_valor"] = rep.get("tipo_cambio")

        rep["moneda_id"] = rep.get("moneda")
        rep["moneda"] = instance.moneda.codigo if instance.moneda else rep.get("moneda")
        rep["moneda_pagada"] = rep["moneda"]

        rep["concepto"] = rep.get("tipo_pago")
        rep["fecha_ingreso_cuentas"] = rep.get("fecha_ingreso")
        rep["monto_pagado"] = rep.get("monto")
        rep["ordenante"] = rep.get("titular_origen")
        rep["num_cuenta_origen"] = rep.get("cuenta_origen")
        rep["cuenta_beneficiaria"] = rep.get("cuenta_destino")

        if instance.metodo_pago:
            rep["metodo_pago_nombre"] = instance.metodo_pago.get_nombre_display()

        if instance.banco_origen:
            rep["banco_origen_nombre"] = instance.banco_origen.nombre_corto
        if instance.banco_destino:
            rep["banco_destino_nombre"] = instance.banco_destino.nombre_corto

        return rep

    def get_metodo_pago_nombre(self, obj):
        return obj.metodo_pago.get_nombre_display() if obj.metodo_pago else None

    def get_banco_origen_nombre(self, obj):
        return obj.banco_origen.nombre_corto if obj.banco_origen else None

    def get_banco_destino_nombre(self, obj):
        return obj.banco_destino.nombre_corto if obj.banco_destino else None
