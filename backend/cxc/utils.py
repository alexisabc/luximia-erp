# backend/cxc/utils.py
import os
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict

import requests
from django.conf import settings

from .models import TipoCambio

BANXICO_SERIE_DOF = "SF60653"
BANXICO_TIMEOUT_SECONDS = 10


def sincronizar_tipo_cambio_banxico(fecha_a_consultar: date) -> Dict[str, Any]:
    """Obtiene el tipo de cambio del DOF y lo registra/actualiza en la base."""

    if not isinstance(fecha_a_consultar, date):
        raise ValueError("fecha_a_consultar debe ser una fecha válida")

    token = os.getenv("BANXICO_TOKEN")
    if not token:
        return {
            "success": False,
            "code": "missing_token",
            "message": "El BANXICO_TOKEN no está configurado.",
        }

    fecha_str = fecha_a_consultar.strftime("%Y-%m-%d")
    url = (
        "https://www.banxico.org.mx/SieAPIRest/service/v1/series/"
        f"{BANXICO_SERIE_DOF}/datos/{fecha_str}/{fecha_str}?token={token}"
    )

    try:
        response = requests.get(url, timeout=BANXICO_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as exc:
        return {
            "success": False,
            "code": "request_error",
            "message": f"Error al contactar la API de Banxico: {exc}",
        }

    try:
        data = response.json()
        serie = data["bmx"]["series"][0]
        datos_serie = serie.get("datos", [])
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        return {
            "success": False,
            "code": "invalid_payload",
            "message": f"Respuesta inesperada de Banxico: {exc}",
        }

    if not datos_serie:
        return {
            "success": False,
            "code": "no_data",
            "message": (
                "No se encontró un tipo de cambio publicado para la fecha "
                f"{fecha_str}."
            ),
            "fecha": fecha_a_consultar,
        }

    dato = datos_serie[0]
    valor_str = dato.get("dato")
    fecha_publicacion = dato.get("fecha")

    try:
        valor = Decimal(valor_str)
    except (InvalidOperation, TypeError):
        return {
            "success": False,
            "code": "invalid_value",
            "message": f"La API de Banxico regresó un valor inválido: {valor_str}",
        }

    try:
        fecha_registro = datetime.strptime(fecha_publicacion, "%d/%m/%Y").date()
    except (TypeError, ValueError):
        fecha_registro = fecha_a_consultar

    tipo_cambio, created = TipoCambio.objects.update_or_create(
        escenario="BANXICO",
        fecha=fecha_registro,
        defaults={"valor": valor},
    )

    return {
        "success": True,
        "code": "created" if created else "updated",
        "message": (
            f"{'Creado' if created else 'Actualizado'} tipo de cambio BANXICO "
            f"para {fecha_registro:%Y-%m-%d}: {valor}"
        ),
        "fecha": fecha_registro,
        "valor": valor,
        "created": created,
        "instance": tipo_cambio,
    }


def obtener_y_guardar_tipo_de_cambio(fecha_a_consultar: date) -> str:
    """Compatibilidad hacia atrás: devuelve solo el mensaje de resultado."""

    resultado = sincronizar_tipo_cambio_banxico(fecha_a_consultar)
    return resultado.get("message", "No fue posible obtener el tipo de cambio.")


def get_logo_path():
    """Devuelve la ruta absoluta al logo corporativo."""
    return os.path.join(settings.ASSETS_PATH, "logo-luximia.png")
