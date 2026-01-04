from obras.models import Obra, CentroCosto, PartidaPresupuestal
from obras.services import ObrasService
from core.models import FeatureFlag
from decimal import Decimal

# 1. Activar Feature
FeatureFlag.objects.filter(code='MODULE_OBRAS').update(is_active=True)
print("✅ Feature MODULE_OBRAS activado")

# 2. Crear Obra
obra, created = Obra.objects.get_or_create(
    codigo='TOR-LUX',
    defaults={
        'nombre': 'Torre Corporativa',
        'presupuesto_total': 1000000,
        'fecha_inicio': '2026-01-01'
    }
)
print(f"✅ Obra: {obra.nombre} (ID: {obra.id})")

# 3. Crear Árbol
estructura = [
    {
        'codigo': 'CIM',
        'nombre': 'Cimentación',
        'es_hoja': True,
        'partidas': [
            {'categoria': 'MATERIALES', 'monto': 50000}
        ]
    }
]
ObrasService.crear_arbol_costos(obra.id, estructura)
print("✅ Estructura de costos generada")

# 4. Validar Suficiencia
cc = CentroCosto.objects.get(codigo='CIM', obra=obra)
print(f"   Centro de Costo: {cc.nombre}")

# Caso Exitoso
ok, msg = ObrasService.validar_suficiencia(cc.id, 'MATERIALES', 500)
if ok:
    print(f"✅ Prueba 1 (Compra $500): APROBADA. Mensaje: {msg}")
else:
    print(f"❌ Prueba 1 Falló: {msg}")

# Caso Fallido (Exceso)
ok2, msg2 = ObrasService.validar_suficiencia(cc.id, 'MATERIALES', 60000)
if not ok2:
    print(f"✅ Prueba 2 (Compra $60,000): RECHAZADA CORRECTAMENTE. Mensaje: {msg2}")
else:
    print(f"❌ Prueba 2 Falló (Permitió compra excesiva)")
