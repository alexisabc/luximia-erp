from compras.models import Requisicion, OrdenCompra, Proveedor
from compras.services.requisicion_service import RequisicionService
from compras.services.conversion_service import ConversionService
from django.contrib.auth import get_user_model
from obras.models import Obra, CentroCosto, PartidaPresupuestal
from decimal import Decimal

User = get_user_model()
user = User.objects.first()

# Setup Moneda
from contabilidad.models import Moneda
if not Moneda.objects.exists():
     Moneda.objects.create(codigo="MXN", nombre="Peso Mexicano")

print("\n--- 1. Preparar Requisición ---")
# Buscar una req pendiente o crearla
req = Requisicion.objects.filter(estado='PENDIENTE').first()
if not req:
    print("Creando Req Pendiente...")
    obra = Obra.objects.first()
    cc = CentroCosto.objects.filter(es_hoja=True, obra=obra).first()
    if not cc:
         print("No hay centro costo hoja. Abortando.")
         exit()
         
    data = {'obra_id': obra.id, 'centro_costo_id': cc.id, 'detalles': [{'producto_texto': 'Ladrillo Test', 'cantidad': 100, 'costo_estimado': 10}]}
    req = RequisicionService.crear_requisicion(data, user)

print(f"Req ID: {req.id} | Estado: {req.estado}")

print("\n--- 2. Aprobar Requisición ---")
# Verificar saldo antes de aprobar (el aprobar compromete)
try:
    req = RequisicionService.aprobar_requisicion(req.id, user)
    print(f"Req Aprobada. Estado: {req.estado}")
except Exception as e:
    print(f"Error aprobando: {e}")
    # Si ya estaba aprobada o fallo presupuesto, intentamos seguir

print("\n--- 3. Convertir a OC ---")
try:
    # Obtener un proveedor
    prov = Proveedor.objects.first()
    if not prov:
        print("Creando proveedor (bulk)...")
        Proveedor.objects.bulk_create([
             Proveedor(razon_social="Proveedor Test", rfc="XEXX010101000", tipo_persona="MORAL")
        ])
        prov = Proveedor.objects.filter(rfc="XEXX010101000").first()
    
    detalles_precios = [
        {'producto_id': None, 'producto_texto': d.producto_texto, 'cantidad': float(d.cantidad), 'precio_unitario': 12.50} 
        for d in req.detalles.all()
    ]
    
    # Convertir
    # Ojo: req debe estar APROBADA.
    
    oc = ConversionService.convertir_req_a_oc(req.id, prov.id, detalles_precios, user)
    print(f"✅ OC Generada: {oc.folio} | Total: ${oc.total}")
    
    # Verificar Req actualizada
    req.refresh_from_db()
    print(f"Estado Req Final: {req.estado}")
    print(f"Link en OC -> Req: {oc.requisicion}")
    
except Exception as e:
    print(f"❌ Error Conversión: {e}") 
    import traceback
    traceback.print_exc()
