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

def test_currency_prov():
    print("Testing Multi-Currency Provisioning...")
    
    # 1. Setup Data
    mxn, _ = Moneda.objects.get_or_create(codigo="MXN", defaults={"nombre": "Peso"})
    usd, _ = Moneda.objects.get_or_create(codigo="USD", defaults={"nombre": "Dolar"})
    
    # Create Template
    plantilla, _ = PlantillaAsiento.objects.get_or_create(
        nombre="Provision USD Test",
        defaults={"tipo_poliza": "PROVISION", "concepto_patron": "Prov USD"}
    )
    
    # Create Rule (Use Total)
    cta, _ = CuentaContable.objects.get_or_create(codigo="200-99", defaults={"nombre": "Prov Extranjeros", "tipo": "PASIVO", "naturaleza": "ACREEDORA"})
    
    ReglaAsiento.objects.get_or_create(
        plantilla=plantilla,
        cuenta_base=cta,
        tipo_movimiento="ABONO",
        origen_dato="TOTAL",
        orden=1
    )
    
    # 2. Create USD Factura
    # 100 USD at 18.50 TC
    factura = Factura.objects.create(
        uuid="TEST-USD-001",
        fecha_emision="2023-05-01T12:00:00Z",
        total=Decimal("100.00"),
        subtotal=Decimal("100.00"),
        moneda=usd,
        tipo_cambio=Decimal("18.5000"),
        emisor_rfc="TEST", receptor_rfc="TEST", emisor_nombre="US CORP", receptor_nombre="ME"
    )
    
    # 3. Generate Poliza
    print(f"Generando poliza para Factura: {factura.total} {factura.moneda.codigo} @ {factura.tipo_cambio}")
    poliza = generar_poliza_from_factura(factura, plantilla)
    
    # 4. Verify Amount
    # Should be 100 * 18.50 = 1850.00
    detalle = poliza.detalles.first()
    print(f"Detalle Haber: {detalle.haber}")
    
    if detalle.haber == Decimal("1850.00"):
        print("SUCCESS: Currency converted successfully (100 USD -> 1850 MXN).")
    else:
        print(f"FAILURE: Expected 1850.00 but got {detalle.haber}")

if __name__ == "__main__":
    try:
        test_currency_prov()
    except Exception as e:
        print(f"Test Crashed: {e}")
