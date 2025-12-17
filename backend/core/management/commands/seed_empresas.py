from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Empresa

class Command(BaseCommand):
    help = 'Genera datos iniciales de empresas para Luximia ERP'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando generación de Empresas...")
        
        empresas_data = [
            {
                "codigo": "LUX01",
                "razon_social": "LUXIMIA DEVELOPMENTS S.A. DE C.V.",
                "nombre_comercial": "Luximia Developments",
                "rfc": "LDE150101XYZ",
                "regimen_fiscal": "601",
                "codigo_postal": "77500",
                "calle": "Blvd. Kukulcan",
                "numero_exterior": "Km 12",
                "colonia": "Zona Hotelera",
                "municipio": "Cancún",
                "estado": "Quintana Roo",
                "color_primario": "#2563EB", # Azul
                "email": "contacto@luximia.mx"
            },
            {
                "codigo": "LUX02",
                "razon_social": "SHARK TOWER CANCUN S.A. DE C.V.",
                "nombre_comercial": "Shark Tower",
                "rfc": "STC180520ABC",
                "regimen_fiscal": "601",
                "codigo_postal": "77500",
                "calle": "Puerto Cancun",
                "numero_exterior": "Lote 1",
                "colonia": "Zona Hotelera",
                "municipio": "Cancún",
                "estado": "Quintana Roo",
                "color_primario": "#0EA5E9", # Cyan
                "email": "ventas@sharktower.mx"
            },
            {
                "codigo": "LUX03",
                "razon_social": "BEJO WAVES S.A. DE C.V.",
                "nombre_comercial": "Bejo Waves",
                "rfc": "BWA190815DEF",
                "regimen_fiscal": "601",
                "codigo_postal": "77500",
                "calle": "Puerto Cancun",
                "numero_exterior": "Lote 5",
                "colonia": "Zona Hotelera",
                "municipio": "Cancún",
                "estado": "Quintana Roo",
                "color_primario": "#8B5CF6", # Violeta
                "email": "info@bejowaves.com"
            }
        ]

        with transaction.atomic():
            for data in empresas_data:
                empresa, created = Empresa.objects.get_or_create(
                    codigo=data['codigo'],
                    defaults=data
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Creada empresa: {empresa.nombre_comercial}"))
                else:
                    self.stdout.write(f"Empresa ya existe: {empresa.nombre_comercial}")

        self.stdout.write(self.style.SUCCESS('¡Seed de EMPRESAS completado exitosamente!'))
