# backend/cxc/management/commands/obtener_tipo_cambio.py

import requests
import os
from datetime import date, datetime  # <--- Importa 'date'
from decimal import Decimal
from django.core.management.base import BaseCommand
from cxc.models import TipoDeCambio


class Command(BaseCommand):
    help = 'Obtiene el tipo de cambio del DOF para una fecha específica desde Banxico.'

    # ### CAMBIO 1: Permitimos pasar una fecha como argumento ###
    def add_arguments(self, parser):
        parser.add_argument(
            '--fecha',
            type=str,
            help='Fecha para obtener el TC en formato YYYY-MM-DD. Si no se especifica, usa la fecha de hoy.'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            "Iniciando la obtención del tipo de cambio de Banxico...")

        # ### CAMBIO 2: Usamos la fecha del argumento o la de hoy ###
        fecha_a_consultar_str = options['fecha'] or date.today().strftime(
            '%Y-%m-%d')
        self.stdout.write(
            f"Consultando tipo de cambio para la fecha: {fecha_a_consultar_str}")

        token = os.getenv('BANXICO_TOKEN')
        if not token:
            # ... (código de error de token sin cambios)
            self.stdout.write(self.style.ERROR(
                "El BANXICO_TOKEN no está configurado."))
            return

        # ### CAMBIO 3: Nueva URL para pedir una fecha específica ###
        id_serie_dof = 'SF60653'
        url = f'https://www.banxico.org.mx/SieAPIRest/service/v1/series/{id_serie_dof}/datos/{fecha_a_consultar_str}/{fecha_a_consultar_str}?token={token}'

        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            # Verificamos si la respuesta contiene datos
            datos_serie = data['bmx']['series'][0]['datos']
            if not datos_serie:
                self.stdout.write(self.style.WARNING(
                    f"No se encontró un tipo de cambio para la fecha {fecha_a_consultar_str}. Es posible que sea un día no hábil."))
                return

            serie_data = datos_serie[0]
            fecha_str = serie_data['fecha']
            valor_str = serie_data['dato']

            fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y').date()
            valor_decimal = Decimal(valor_str)

            tipo_de_cambio, created = TipoDeCambio.objects.update_or_create(
                fecha=fecha_obj,
                defaults={'valor': valor_decimal}
            )

            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Se guardó un nuevo tipo de cambio para {fecha_str}: {valor_str}"))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f"Se actualizó el tipo de cambio para {fecha_str}: {valor_str}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ocurrió un error: {e}"))
