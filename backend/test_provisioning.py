import os
import sys
import django
from decimal import Decimal

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from contabilidad.models import Factura, CuentaContable, Moneda
from contabilidad.models_automation import PlantillaAsiento, ReglaAsiento
from contabilidad.services.provisioning import generar_poliza_from_factura

def test_provisioning():
    print("Testing Automatic Provisioning...")
    
    # 1. Setup Data
    Moneda.objects.get_or_create(codigo="MXN", defaults={"nombre": "Peso"})
    cta_gasto, _ = CuentaContable.objects.get_or_create(codigo="600-01", defaults={"nombre": "Gastos Generales", "tipo": "GASTOS", "naturaleza": "DEUDORA"})
    cta_prov, _ = CuentaContable.objects.get_or_create(codigo="200-01", defaults={"nombre": "Proveedores", "tipo": "PASIVO", "naturaleza": "ACREEDORA"})
    
    # 2. Create Factura Mock
    # We create it manually to avoid XML dependency here
    factura = Factura.objects.create(
        uuid="TEST-AUTO-PROV-001",
        fecha_emision="2023-01-01T12:00:00Z",
        total=Decimal("1160.00"),
        subtotal=Decimal("1000.00"),
        impuestos_trasladados=Decimal("160.00"),
        emisor_rfc="TEST",
        emisor_nombre="PROVEEDOR TEST",
        receptor_rfc="ME",
        receptor_nombre="YO",
         rfc_emisor="TEST", rfc_receptor="ME" # Duplicate args to satisfy model required fields
    )
    
    # 3. Create Template
    plantilla = PlantillaAsiento.objects.create(
        nombre="Provision Gastos Generales",
        tipo_poliza="PROVISION",
        concepto_patron="Prov de Gasto {uuid}"
    )
    
    # Rule 1: Charge to Expense (Subtotal)
    ReglaAsiento.objects.create(
        plantilla=plantilla,
        cuenta_base=cta_gasto,
        tipo_movimiento="CARGO",
        origen_dato="SUBTOTAL",
        orden=1
    )
    # Rule 2: Credit to Provider (Total)
    ReglaAsiento.objects.create(
        plantilla=plantilla,
        cuenta_base=cta_prov,
        tipo_movimiento="ABONO",
        origen_dato="TOTAL",
        orden=2
    )
    
    # 4. Run Service
    print("Generating Poliza...")
    poliza = generar_poliza_from_factura(factura, plantilla)
    
    print(f"Poliza generated: {poliza}")
    print(f"Concepto: {poliza.concepto}")
    print(f"Total Debe: {poliza.total_debe}")
    print(f"Total Haber: {poliza.total_haber}")
    
    # 5. Verify
    if poliza.cuadrada == False: # 1000 vs 1160, unbalanced
        print("SUCCESS: Poliza is unbalanced (Expected, as we missed VAT rule)")
    else:
        print("FAILURE: Poliza should be unbalanced")
        
    # Add VAT rule fix and retry?
    # For now just confirming logic works as configured.

if __name__ == "__main__":
    try:
        test_provisioning()
    except Exception as e:
        print(f"Test Crashed: {e}")
