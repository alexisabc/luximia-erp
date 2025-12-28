from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Empresa

class Command(BaseCommand):
    help = 'Genera datos iniciales de empresas para el Sistema ERP'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("🏢 Iniciando generación de Empresas..."))
        
        empresas_data = [
            {
                "codigo": "ERP01",
                "razon_social": "EMPRESA DEMO S.A. DE C.V.",
                "nombre_comercial": "Empresa Demo",
                "rfc": "EDE150101XYZ",
                "regimen_fiscal": "601",
                "codigo_postal": "01000",
                "calle": "Av. Principal",
                "numero_exterior": "123",
                "colonia": "Centro",
                "municipio": "Ciudad de México",
                "estado": "CDMX",
                "color_primario": "#2563EB",  # Azul
                "email": "contacto@empresademo.mx"
            },
            {
                "codigo": "ERP02",
                "razon_social": "CORPORATIVO EJEMPLO S.A. DE C.V.",
                "nombre_comercial": "Corporativo Ejemplo",
                "rfc": "CEJ180520ABC",
                "regimen_fiscal": "601",
                "codigo_postal": "64000",
                "calle": "Av. Constitución",
                "numero_exterior": "456",
                "colonia": "Centro",
                "municipio": "Monterrey",
                "estado": "Nuevo León",
                "color_primario": "#0EA5E9",  # Cyan
                "email": "info@corporativoejemplo.mx"
            },
            {
                "codigo": "ERP03",
                "razon_social": "SERVICIOS PROFESIONALES MUESTRA S.C.",
                "nombre_comercial": "Servicios Muestra",
                "rfc": "SPM190815DEF",
                "regimen_fiscal": "612",
                "codigo_postal": "44100",
                "calle": "Av. Chapultepec",
                "numero_exterior": "789",
                "colonia": "Americana",
                "municipio": "Guadalajara",
                "estado": "Jalisco",
                "color_primario": "#8B5CF6",  # Violeta
                "email": "contacto@serviciosmuestra.com"
            }
        ]

        with transaction.atomic():
            created_count = 0
            existing_count = 0
            
            for data in empresas_data:
                empresa, created = Empresa.objects.get_or_create(
                    codigo=data['codigo'],
                    defaults=data
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Creada: {empresa.nombre_comercial}"))
                    created_count += 1
                else:
                    self.stdout.write(f"  • Ya existe: {empresa.nombre_comercial}")
                    existing_count += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"✅ Seed de EMPRESAS completado"))
        self.stdout.write(f"   Creadas: {created_count} | Existentes: {existing_count}")
