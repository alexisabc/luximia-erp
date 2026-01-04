from django.core.management.base import BaseCommand
from contabilidad.models.contabilidad import CuentaContable
from contabilidad.models_automation import PlantillaAsiento, ReglaAsiento
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seeds basic Accounting Templates for Automation'

    def handle(self, *args, **options):
        User = get_user_model()
        admin = User.objects.first()
        
        # 1. Ensure basic Accounts exist
        cta_gasto, _ = CuentaContable.objects.get_or_create(
            codigo="600-01-001", defaults={'nombre': "Gastos Generales", 'tipo': 'GASTOS', 'naturaleza': 'DEUDORA', 'creado_por': admin}
        )
        cta_iva_pend, _ = CuentaContable.objects.get_or_create(
            codigo="119-01-000", defaults={'nombre': "IVA Pendiente de Pago", 'tipo': 'ACTIVO', 'naturaleza': 'DEUDORA', 'creado_por': admin}
        )
        cta_prov, _ = CuentaContable.objects.get_or_create(
            codigo="201-01-000", defaults={'nombre': "Proveedores Nacionales", 'tipo': 'PASIVO', 'naturaleza': 'ACREEDORA', 'creado_por': admin}
        )
        
        # 2. Create Template: PROVISION_COMPRA
        plantilla, created = PlantillaAsiento.objects.get_or_create(
            nombre="PROVISION_COMPRA",
            defaults={
                'tipo_poliza': 'DIARIO', 
                'concepto_patron': "Prov. Compra {folio} - {proveedor}",
                'creado_por': admin
            }
        )
        
        if created:
            # Cargo al Gasto (Subtotal)
            ReglaAsiento.objects.create(
                plantilla=plantilla, cuenta_base=cta_gasto, tipo_movimiento='CARGO', origen_dato='SUBTOTAL', orden=1, creado_por=admin
            )
            # Cargo al IVA (IVA_16)
            ReglaAsiento.objects.create(
                plantilla=plantilla, cuenta_base=cta_iva_pend, tipo_movimiento='CARGO', origen_dato='IVA_16', orden=2, creado_por=admin
            )
            # Abono a Proveedor (Total)
            ReglaAsiento.objects.create(
                plantilla=plantilla, cuenta_base=cta_prov, tipo_movimiento='ABONO', origen_dato='TOTAL', orden=3, creado_por=admin
            )
            self.stdout.write(self.style.SUCCESS("Plantilla PROVISION_COMPRA creada"))
        else:
            self.stdout.write("Plantilla PROVISION_COMPRA ya existe")
            
        # 3. Create Template: PROVISION_NOMINA
        cta_sueldo, _ = CuentaContable.objects.get_or_create(
             codigo="600-02-001", defaults={'nombre': "Sueldos y Salarios", 'tipo': 'GASTOS', 'naturaleza': 'DEUDORA', 'creado_por': admin}
        )
        cta_isr_ret, _ = CuentaContable.objects.get_or_create(
             codigo="205-01-000", defaults={'nombre': "ISR Retenido por Pagar", 'tipo': 'PASIVO', 'naturaleza': 'ACREEDORA', 'creado_por': admin}
        )
        cta_nomina_por_pagar, _ = CuentaContable.objects.get_or_create(
             codigo="201-05-000", defaults={'nombre': "Nómina por Pagar", 'tipo': 'PASIVO', 'naturaleza': 'ACREEDORA', 'creado_por': admin}
        )
        
        plantilla_nom, created_nom = PlantillaAsiento.objects.get_or_create(
            nombre="PROVISION_NOMINA",
            defaults={
                'tipo_poliza': 'DIARIO', 
                'concepto_patron': "Prov. Nomina {periodo}",
                'creado_por': admin
            }
        )
        
        if created_nom:
            # Cargo Gasto (Total Percepciones)
            ReglaAsiento.objects.create(
                plantilla=plantilla_nom, cuenta_base=cta_sueldo, tipo_movimiento='CARGO', origen_dato='PERCEPCIONES', orden=1, creado_por=admin
            )
            # Abono ISR (Deducciones)
            ReglaAsiento.objects.create(
                plantilla=plantilla_nom, cuenta_base=cta_isr_ret, tipo_movimiento='ABONO', origen_dato='RETENCIONES', orden=2, creado_por=admin
            )
            # Abono Neto (A Pagar)
            ReglaAsiento.objects.create(
                plantilla=plantilla_nom, cuenta_base=cta_nomina_por_pagar, tipo_movimiento='ABONO', origen_dato='NETO', orden=3, creado_por=admin
            )
            self.stdout.write(self.style.SUCCESS("Plantilla PROVISION_NOMINA creada"))
