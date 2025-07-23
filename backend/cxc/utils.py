# backend/cxc/utils.py
import requests
import os
from datetime import date, datetime
from decimal import Decimal
from .models import TipoDeCambio


def obtener_y_guardar_tipo_de_cambio(fecha_a_consultar):
    token = os.getenv('BANXICO_TOKEN')
    if not token:
        return "Error: El BANXICO_TOKEN no está configurado."

    fecha_str = fecha_a_consultar.strftime('%Y-%m-%d')
    id_serie_dof = 'SF60653'
    url = f'https://www.banxico.org.mx/SieAPIRest/service/v1/series/{id_serie_dof}/datos/{fecha_str}/{fecha_str}?token={token}'

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        datos_serie = data['bmx']['series'][0]['datos']
        if not datos_serie:
            return f"No se encontró un tipo de cambio para la fecha {fecha_str} (posiblemente día no hábil)."

        valor_str = datos_serie[0]['dato']
        TipoDeCambio.objects.update_or_create(
            fecha=fecha_a_consultar,
            defaults={'valor': Decimal(valor_str)}
        )
        return f"Éxito: Se guardó el tipo de cambio {valor_str} para la fecha {fecha_str}."
    except Exception as e:
        return f"Error al procesar la solicitud a Banxico: {str(e)}"
