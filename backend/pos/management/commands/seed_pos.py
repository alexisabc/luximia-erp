from django.core.management.base import BaseCommand
from django.db import transaction
from pos.models import Caja, Producto, CuentaCliente
from contabilidad.models import Cliente
from decimal import Decimal

class Command(BaseCommand):
    help = 'Semilla de datos iniciales para el Punto de Venta (POS)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("🌱 Iniciando Seed de POS..."))

        with transaction.atomic():
            # 1. Cajas
            caja1, created = Caja.objects.get_or_create(
                nombre="Caja Principal",
                defaults={"sucursal": "Matriz - Oficinas"}
            )
            caja2, created = Caja.objects.get_or_create(
                nombre="Caja Patio",
                defaults={"sucursal": "Planta Trituradora"}
            )
            self.stdout.write(f"- Cajas verificadas: {caja1}, {caja2}")

            # 2. Productos (Materiales Pétreos)
            productos_data = [
                {
                    "codigo": "GRAVA-34",
                    "nombre": "Grava de 3/4\"",
                    "descripcion": "Grava estándar para concreto estructural.",
                    "unidad": "M3",
                    "precio": 450.00,
                    "color": "#64748b" # Slate
                },
                {
                    "codigo": "GRAVA-12",
                    "nombre": "Grava de 1/2\"",
                    "descripcion": "Grava fina para acabados o block.",
                    "unidad": "M3",
                    "precio": 480.00,
                    "color": "#94a3b8"
                },
                {
                    "codigo": "ARENA-TRIT",
                    "nombre": "Polvo de Piedra (Arena)",
                    "descripcion": "Arena triturada caliza alta calidad.",
                    "unidad": "M3",
                    "precio": 320.00,
                    "color": "#fcd34d" # Amber
                },
                {
                    "codigo": "SELLO-38",
                    "nombre": "Sello 3/8\"",
                    "descripcion": "Gravilla para asfalto o prefabricados.",
                    "unidad": "M3",
                    "precio": 510.00,
                    "color": "#a8a29e"
                },
                {
                    "codigo": "BASE-HID",
                    "nombre": "Base Hidráulica",
                    "descripcion": "Material para terracerías y caminos.",
                    "unidad": "M3",
                    "precio": 240.00,
                    "color": "#78350f" # Brown
                },
                {
                    "codigo": "PIEDRA-BRAZA",
                    "nombre": "Piedra Braza",
                    "descripcion": "Piedra grande para mampostería y cimientos.",
                    "unidad": "M3",
                    "precio": 290.00,
                    "color": "#4b5563"
                },
                {
                    "codigo": "CEMENTO-TOL",
                    "nombre": "Cemento Gris Tolteca 50kg",
                    "descripcion": "Bulto de cemento CPC 30R.",
                    "unidad": "PZA",
                    "precio": 235.00,
                    "color": "#ef4444" # Red
                },
                {
                    "codigo": "FLETE-LOC",
                    "nombre": "Flete Local (Camión 14m3)",
                    "descripcion": "Servicio de entrega zona urbana.",
                    "unidad": "VIAJE",
                    "precio": 1500.00,
                    "color": "#3b82f6" # Blue
                }
            ]

            for p in productos_data:
                prod, created = Producto.objects.update_or_create(
                    codigo=p['codigo'],
                    defaults={
                        "nombre": p['nombre'],
                        "descripcion": p['descripcion'],
                        "unidad_medida": p['unidad'],
                        "precio_lista": p['precio'],
                        "color_ui": p['color']
                    }
                )
                if created:
                    self.stdout.write(f"  + Creado producto: {prod.nombre}")

            # 3. Clientes de Prueba con Cuentas
            client_data = [
                {"nombre": "Constructora del Norte SA de CV", "email": "compras@norte.com", "limite": 50000},
                {"nombre": "Desarrollos Inmobiliarios Maya", "email": "conta@maya.mx", "limite": 150000},
                {"nombre": "Juan Pérez (Maestro Obra)", "email": "juanperez@gmail.com", "limite": 5000}
            ]

            for c in client_data:
                cliente, created = Cliente.objects.get_or_create(
                    email=c['email'],
                    defaults={
                        "nombre_completo": c['nombre'],
                        "telefono": "9991234567"
                    }
                )
                
                cuenta, acc_created = CuentaCliente.objects.get_or_create(
                    cliente=cliente,
                    defaults={"limite_credito": c['limite']}
                )
                if acc_created:
                    self.stdout.write(f"  + Cuenta creada para: {cliente.nombre_completo} (Límite: ${c['limite']})")

        self.stdout.write(self.style.SUCCESS("✅ Seed de POS completado exitosamente."))
