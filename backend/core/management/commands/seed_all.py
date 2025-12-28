"""Comando de seed global - Versión ultra-simplificada"""
from django.core.management.base import BaseCommand
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed global simplificado'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 SEED GLOBAL'))
        
        # Core
        from core.models import Empresa
        e, _ = Empresa.objects.get_or_create(
            codigo="ERP01",
            defaults={
                "razon_social": "EMPRESA DEMO S.A. DE C.V.",
                "nombre_comercial": "Empresa Demo",
                "rfc": "EDE150101XYZ",
                "regimen_fiscal": "601",
                "codigo_postal": "01000",
                "calle": "Av. Principal",
                "numero_exterior": "123",
                "colonia": "Centro",
                "municipio": "CDMX",
                "estado": "CDMX",
                "color_primario": "#2563EB",
                "email": "contacto@demo.mx"
            }
        )
        self.stdout.write("✓ Empresas: 1")
        
        # Contabilidad
        from contabilidad.models import Moneda, Banco
        Moneda.objects.get_or_create(codigo="MXN", defaults={"nombre": "Peso Mexicano"})
        Moneda.objects.get_or_create(codigo="USD", defaults={"nombre": "Dólar"})
        Banco.objects.get_or_create(clave="012", defaults={"nombre_corto": "BBVA", "razon_social": "BBVA México S.A."})
        Banco.objects.get_or_create(clave="002", defaults={"nombre_corto": "BANAMEX", "razon_social": "Banamex S.A."})
        self.stdout.write("✓ Contabilidad: 2 Monedas, 2 Bancos")
        
        # RRHH
        from rrhh.models import Departamento, Puesto
        d, _ = Departamento.objects.get_or_create(nombre="Dirección")
        Puesto.objects.get_or_create(nombre="Director", defaults={"descripcion": "Director General", "departamento": d})
        self.stdout.write("✓ RRHH: 1 Departamento, 1 Puesto")
        
        # Compras
        from compras.models import Proveedor
        Proveedor.objects.get_or_create(rfc="PDE010101XYZ", defaults={"razon_social": "PROVEEDOR DEMO S.A."})
        self.stdout.write("✓ Compras: 1 Proveedor")
        
        # Tesorería
        from tesoreria.models import CuentaBancaria
        from contabilidad.models import Banco, Moneda
        banco = Banco.objects.first()
        moneda = Moneda.objects.first()
        if banco and moneda:
            CuentaBancaria.objects.get_or_create(
                numero_cuenta="0123456789",
                banco=banco,
                empresa=e,
                defaults={
                    'tipo_cuenta': 'CHEQUES',
                    'moneda': moneda,
                    'saldo_actual': Decimal('100000'),
                    'saldo_bancario': Decimal('100000'),
                    'activa': True
                }
            )
            self.stdout.write("✓ Tesorería: 1 Cuenta Bancaria")
        
        # POS
        from pos.models import Producto
        Producto.objects.get_or_create(codigo="PROD001", defaults={"nombre": "Producto Demo", "precio_lista": Decimal('100')})
        self.stdout.write("✓ POS: 1 Producto")
        
        # Sistemas
        from sistemas.models import CategoriaEquipo
        CategoriaEquipo.objects.get_or_create(nombre="Computadoras", defaults={"descripcion": "Equipos de cómputo"})
        self.stdout.write("✓ Sistemas: 1 Categoría")
        
        self.stdout.write(self.style.SUCCESS('\n✅ SEED COMPLETADO'))
