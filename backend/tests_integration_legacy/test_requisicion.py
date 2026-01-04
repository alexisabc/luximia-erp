from compras.services.requisicion_service import RequisicionService
from obras.models import Obra, CentroCosto
from django.contrib.auth import get_user_model

User = get_user_model()

# Obtener usuario existente para evitar crear y disparar auditoria fallida
user = User.objects.first()
if not user:
    print("No hay usuarios. Creando uno sin trigger (usando bulk_create para evitar señales si fuera posible, pero no)")
    # Si no hay usuarios, estamos fritos para el test simple sin mockear auditoría. 
    # Pero segun steps anteriores, el seed corrió.

# Setup Obra
try:
    obra = Obra.objects.get(codigo='TOR-LUX')
    cc = CentroCosto.objects.get(codigo='CIM', obra=obra)
    partida = cc.partidas.first() 

    print(f"Usuario: {user.username}")
    print(f"Partida: {partida.categoria} | Disponible: ${partida.disponible:,.2f}")

    print("\n--- Intento 1: Compra pequeña ($5,000) ---")
    try:
        data = {
            'obra_id': obra.id,
            'centro_costo_id': cc.id,
            'detalles': [{'producto_texto': 'Acero', 'cantidad': 1, 'costo_estimado': 5000}]
        }
        # Nota: Si el servicio usa User para asignar 'created_by', podría fallar si la auditoría intercepta.
        # En una shell sin middleware, AuditLog middleware no corre.
        # Si la auditoria está en save() del modelo obteniendo thread local, fallará.
        # Solución: Mockear thread local o aceptar que en shell falle auditoría si es estricta.
        
        req = RequisicionService.crear_requisicion(data, user)
        print(f"✅ Requisición Creada: {req}")
    except Exception as e:
        print(f"❌ Falló Intento 1: {e}")

    print("\n--- Intento 2: Compra Gigante ($1,000,000) ---")
    try:
        data_big = {
            'obra_id': obra.id,
            'centro_costo_id': cc.id,
            'detalles': [{'producto_texto': 'Mucho Acero', 'cantidad': 1, 'costo_estimado': 1000000}]
        }
        req_big = RequisicionService.crear_requisicion(data_big, user)
        print(f"❌ ERROR: Debería haber fallado pero creó la requisición {req_big.id}")
    except Exception as e:
        print(f"✅ BLOQUEO CORRECTO: {e}")
        
except Exception as e:
    print(f"Error de Setup: {e}")
