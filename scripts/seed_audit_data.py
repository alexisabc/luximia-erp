import os
import django
import sys
from datetime import timedelta
from django.utils import timezone

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Empresa
from obras.models import Obra, CentroCosto, PartidaPresupuestal
from compras.models.productos import Insumo
from compras.models.inventario import Almacen, Existencia
from contabilidad.models.fiscal import CertificadoDigital, EmpresaFiscal
from django.contrib.auth import get_user_model

User = get_user_model()

def seed():
    empresa = Empresa.objects.first()
    if not empresa:
        print("No hay empresas en el sistema.")
        return

    print(f"Seeding data for {empresa.nombre_comercial}...")

    # 1. Alerta de Presupuesto (Obra)
    obra = Obra.objects.filter(empresa=empresa).first()
    if not obra:
        obra = Obra.objects.create(nombre="Obra Test Auditor", empresa=empresa, presupuesto_total=100000)
    
    cc = CentroCosto.objects.filter(obra=obra).first()
    if not cc:
        cc = CentroCosto.objects.create(nombre="CC Auditor", obra=obra, codigo="CC-AUD")
    
    # Partida al 95%
    PartidaPresupuestal.objects.create(
        centro_costo=cc,
        categoria="Materiales Eléctricos",
        monto_estimado=10000,
        monto_ejecutado=9500
    )
    print("Created over-budget PartidaPresupuestal.")

    # 2. Alerta de Stock (Inventario)
    insumo = Insumo.objects.create(
        codigo=f"INS-AUD-{timezone.now().timestamp()}",
        descripcion="Insumo Crítico Test",
        tipo='PRODUCTO',
        stock_minimo=100
    )
    almacen = Almacen.objects.filter(empresa=empresa).first()
    if not almacen:
        almacen = Almacen.objects.create(nombre="Almacén Test", codigo="ALM-TEST", empresa=empresa)
    
    # Existencia 50 (Mínimo 100)
    Existencia.objects.create(
        insumo=insumo,
        almacen=almacen,
        cantidad=50
    )
    print("Created low-stock Insumo.")

    # 3. Alerta Fiscal (Certificado)
    ef = EmpresaFiscal.objects.filter(empresa=empresa).first()
    if not ef:
        # No creamos EmpresaFiscal complejo si no hay, pero intentamos crear el cert
        pass
    
    cert = CertificadoDigital.objects.create(
        nombre="FIEL Expirando",
        rfc=getattr(empresa, 'rfc', 'XAXX010101000'),
        tipo='FIEL',
        fecha_fin_validez=timezone.now() + timedelta(days=15),
        activo=True
    )
    
    if ef:
        ef.certificado_sello = cert
        ef.save()
    else:
        # Mocking EmpresaOwned manually if needed, but CertificadoDigital doesn't inherit from it directly in my code?
        # Wait, let's check CertificadoDigital definition in contabilidad/models/fiscal.py
        pass

    print("Created expiring CertificadoDigital.")

if __name__ == "__main__":
    seed()
