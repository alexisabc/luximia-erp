from django.core.management.base import BaseCommand
from compras.models import Proveedor, Insumo
from contabilidad.models import Moneda

class Command(BaseCommand):
    help = 'Seeds initial data for Compras module'

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding Compras Data...")

        # --- 1. Proveedores ---
        proveedores_data = [
            {
                "razon_social": "Materiales del Caribe S.A. de C.V.",
                "rfc": "MCA900101XYZ",
                "dias_credito": 30,
                "tipo_persona": "MORAL"
            },
            {
                "razon_social": "Servicios Profesionales de TI SC",
                "rfc": "SPT880520ABC",
                "dias_credito": 15,
                "tipo_persona": "MORAL"
            },
            {
                "razon_social": "Juan Pérez Construcciones",
                "rfc": "PEPJ800101H12",
                "dias_credito": 7,
                "tipo_persona": "FISICA"
            },
            {
                "razon_social": "Aceros y Cementos de México",
                "rfc": "ACM990909WW3",
                "dias_credito": 45,
                "tipo_persona": "MORAL"
            }
        ]

        for p_data in proveedores_data:
            prov, created = Proveedor.objects.get_or_create(
                rfc=p_data["rfc"],
                defaults=p_data
            )
            if created:
                self.stdout.write(f"  + Proveedor creado: {prov.razon_social}")

        # --- 2. Insumos ---
        insumos_data = [
            {"codigo": "MAT-001", "descripcion": "Cemento Gris Tolteca 50kg"},
            {"codigo": "MAT-002", "descripcion": "Varilla Corrugada 3/8"},
            {"codigo": "MAT-003", "descripcion": "Arena de Río (m3)"},
            {"codigo": "SERV-001", "descripcion": "Servicio de Limpieza de Obra"},
            {"codigo": "SERV-002", "descripcion": "Renta de Maquinaria Pesada"},
            {"codigo": "TEC-001", "descripcion": "Licencia Software CAD"},
        ]

        for i_data in insumos_data:
            ins, created = Insumo.objects.get_or_create(
                codigo=i_data["codigo"],
                defaults=i_data
            )
            if created:
                self.stdout.write(f"  + Insumo creado: {ins.descripcion}")
                
        # Ensure MXN exists
        Moneda.objects.get_or_create(codigo="MXN", defaults={"nombre": "Peso Mexicano"})
        Moneda.objects.get_or_create(codigo="USD", defaults={"nombre": "Dólar Americano"})

        self.stdout.write(self.style.SUCCESS("✅ Seed Compras Complete!"))
