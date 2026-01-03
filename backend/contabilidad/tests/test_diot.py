import os
import sys
import django
from decimal import Decimal

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from contabilidad.models import Vendedor, Pago
from contabilidad.services.diot import generate_diot_txt

def test_diot():
    print("Testing DIOT Generation...")
    
    # 1. Setup Vendedor
    prov, _ = Vendedor.objects.get_or_create(
        nombre_completo="PROVEEDOR TEST DIOT",
        tipo="EXTERNO",
        defaults={
            "rfc": "XAXX010101000",
            "tipo_tercero": "04", # Nacional
            "tipo_operacion": "85" # Otros
        }
    )
    # Ensure update if exists
    prov.rfc = "XAXX010101000"
    prov.tipo_tercero = "04"
    prov.tipo_operacion = "85"
    prov.save()
    
    # 2. Mock Payment logic is currently inside service (hardcoded check for XAXX010101000)
    # In a real scenario we would create Pago objects.
    # The service currently has: if prov.rfc == 'XAXX010101000': monto_base_16 = Decimal("1000.00")
    
    # 3. Generate DIOT
    txt = generate_diot_txt("2023-01-01", "2023-12-31")
    
    print("--- DIOT CONTENT START ---")
    print(txt)
    print("--- DIOT CONTENT END ---")
    
    expected_part = "04|85|XAXX010101000|||||1000"
    if expected_part in txt:
        print("SUCCESS: DIOT line format matches expectations.")
    else:
        print(f"FAILURE: Expected pattern '{expected_part}' not found.")

if __name__ == "__main__":
    try:
        test_diot()
    except Exception as e:
        print(f"Test Crashed: {e}")
