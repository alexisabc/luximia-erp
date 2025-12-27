import os
import sys
import django
from decimal import Decimal

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from contabilidad.services.sat_xml import generate_catalogo_xml, generate_balanza_xml
from contabilidad.models import CuentaContable

def test_sat_xml():
    print("Testing SAT XML Generation...")
    
    # 1. Ensure Dummy Data
    CuentaContable.objects.get_or_create(
        codigo="100-01-000", 
        defaults={"nombre": "Caja", "tipo": "ACTIVO", "naturaleza": "DEUDORA", "codigo_agrupador_sat": "100.01"}
    )
    
    # 2. Generate Catalogo
    print("\n--- CATALOGO XML ---")
    xml_cat = generate_catalogo_xml(2023, 1)
    print(xml_cat.decode('utf-8')[:300] + "...") # Print snippet
    
    if b'CodigoAgrupador="100.01"' in xml_cat:
        print("SUCCESS: Catalogo contains correct grouping code.")
    else:
        print("FAILURE: Catalogo missing grouping code.")

    # 3. Generate Balanza
    print("\n--- BALANZA XML ---")
    xml_bal = generate_balanza_xml(2023, 1)
    print(xml_bal.decode('utf-8')[:300] + "...")
    
    if b'NumCta="100-01-000"' in xml_bal:
        print("SUCCESS: Balanza contains account.")
    else:
        print("FAILURE: Balanza missing account.")

if __name__ == "__main__":
    try:
        test_sat_xml()
    except Exception as e:
        print(f"Test Crashed: {e}")
