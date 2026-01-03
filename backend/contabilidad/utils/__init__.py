from .qr_generator import generar_qr_base64
import os
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict

import requests
from django.conf import settings

from ..models import TipoCambio

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


# ============================================================
# Certificate & Key Validation Utilities
# ============================================================

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_der_private_key, load_pem_private_key

def validate_private_key(key_bytes: bytes, password: str) -> bool:
    """
    Intenta cargar la llave privada con el password.
    Retorna True si es exitoso, lanza excepción si falla.
    """
    password_bytes = password.encode('utf-8') if password else None
    try:
        load_der_private_key(key_bytes, password=password_bytes, backend=default_backend())
        return True
    except ValueError:
        # Try PEM
        try:
            load_pem_private_key(key_bytes, password=password_bytes, backend=default_backend())
            return True
        except Exception:
            raise ValueError("Contraseña incorrecta o archivo llave inválido.")
    except Exception as e:
         raise ValueError(f"Error validando llave: {str(e)}")

def parse_certificate(cer_bytes: bytes):
    """
    Lee un certificado (.cer) y extrae metadatos.
    Retorna dict con fecha_inicio, fecha_fin, numero_serie, rfc (subject).
    """
    try:
        # Try DER first (standard SAT)
        cert = x509.load_der_x509_certificate(cer_bytes, default_backend())
    except ValueError:
        # Try PEM
        try:
            cert = x509.load_pem_x509_certificate(cer_bytes, default_backend())
        except Exception:
             raise ValueError("Archivo de certificado inválido o corrupto.")
             
    # Extract data
    metadata = {
        'fecha_inicio': cert.not_valid_before_utc,
        'fecha_fin': cert.not_valid_after_utc,
        'serial': hex(cert.serial_number)[2:].upper(),
        'subject': cert.subject.rfc4514_string()
    }
    
    return metadata
