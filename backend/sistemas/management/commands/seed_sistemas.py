from django.core.management.base import BaseCommand
from django.db import transaction
from sistemas.models import CategoriaEquipo, ModeloEquipo, ActivoIT
from rrhh.models import Empleado

class Command(BaseCommand):
    help = 'Semilla de datos iniciales para Inventario de Sistemas'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("🌱 Iniciando Seed de Sistemas..."))

        with transaction.atomic():
            # 1. Categorías
            cat_lap, _ = CategoriaEquipo.objects.get_or_create(nombre="Computo", defaults={"descripcion": "Laptops y Desktops"})
            cat_mon, _ = CategoriaEquipo.objects.get_or_create(nombre="Monitores")
            cat_peri, _ = CategoriaEquipo.objects.get_or_create(nombre="Periféricos", defaults={"descripcion": "Teclados, Mouse, Headsets"})
            cat_acc, _ = CategoriaEquipo.objects.get_or_create(nombre="Accesorios/Consumibles", defaults={"descripcion": "Cables, Hubs, Adaptadores"})

            # 2. Modelos
            # -- Laptops (Inventariable) --
            mod_dell, _ = ModeloEquipo.objects.get_or_create(
                nombre="Latitude 5420",
                defaults={"categoria": cat_lap, "marca": "Dell", "es_inventariable": True, "descripcion": "i5, 16GB RAM"}
            )
            # -- Monitor --
            mod_hp24, _ = ModeloEquipo.objects.get_or_create(
                nombre="E24 G4",
                defaults={"categoria": cat_mon, "marca": "HP", "es_inventariable": True, "descripcion": "Monitor 24 pulg IPS"}
            )
            # -- Consumibles --
            mod_hdmi, _ = ModeloEquipo.objects.get_or_create(
                nombre="Cable HDMI 2m",
                defaults={"categoria": cat_acc, "marca": "Genérico", "es_inventariable": False, "stock_actual_consumible": 50, "stock_minimo": 10}
            )
            mod_hub, _ = ModeloEquipo.objects.get_or_create(
                nombre="Hub USB-C 4 puertos",
                defaults={"categoria": cat_acc, "marca": "Ugreen", "es_inventariable": False, "stock_actual_consumible": 20, "stock_minimo": 5}
            )
            
            # 3. Activos Serializados (Ejemplos stock)
            for i in range(1, 6):
                ActivoIT.objects.get_or_create(
                    numero_serie=f"DELL-LAT-{i}00",
                    defaults={
                        "modelo": mod_dell,
                        "etiqueta_interno": f"LX-PC-{i:03d}",
                        "estado": "DISPONIBLE",
                        "costo": 15000
                    }
                )
            
            # 4. Asignar uno de prueba (si hay empleados)
            empleado = Empleado.objects.first()
            if empleado:
                activo = ActivoIT.objects.first()
                if activo:
                    activo.estado = 'ASIGNADO'
                    activo.empleado_asignado = empleado
                    activo.save()
                    self.stdout.write(f"  + Asignado {activo} a {empleado}")

        self.stdout.write(self.style.SUCCESS("✅ Seed de Sistemas completado."))
