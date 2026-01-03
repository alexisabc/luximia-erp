from django.core.management.base import BaseCommand
from django.core.management import call_command
from contabilidad.models import EmpresaFiscal, SATRegimenFiscal, SATUsoCFDI, SATFormaPago, Cliente, CertificadoDigital
from core.models import Empresa, SystemSetting, FeatureFlag
from pos.models import Venta, DetalleVenta, Producto, Turno, Caja
from contabilidad.services.facturacion_service import FacturacionService
from core.encryption import encrypt_data, encrypt_text
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
import subprocess
import os

class Command(BaseCommand):
    help = 'Demo generation of CFDI 4.0 XML with Signing and Stamping Mock'

    def handle(self, *args, **kwargs):
        self.stdout.write("Configuring Fiscal Settings (Mock)...")
        SystemSetting.objects.update_or_create(key="FISCAL_PAC_PROVIDER", defaults={'value': '"MOCK"', 'description': 'Demo Provider'})
        FeatureFlag.objects.update_or_create(code="FISCAL_SANDBOX_MODE", defaults={'is_active': True, 'name': 'Sandbox Fiscal', 'description': 'Demo Sandbox'})

        self.stdout.write("Cleaning up previous demo data...")
        Venta.objects.filter(folio='FDEMO-001').delete()

        self.stdout.write("1. Loading SAT catalogs...")
        call_command('loaddata', 'cat_sat_initial.json')
        
        self.stdout.write("2. Setup Fiscal Data...")
        regimen = SATRegimenFiscal.objects.get(pk="601")
        
        empresa, _ = Empresa.objects.get_or_create(
            codigo="DEMO",
            defaults={
                'razon_social': 'EMPRESA DEMO SA DE CV',
                'rfc': 'EKU9003173C9', # RFC Prueba SAT
                'regimen_fiscal': '601',
                'codigo_postal': '20100',
                'calle': 'Av. Universidad', # Mock address
                'numero_exterior': '123',
                'colonia': 'Centro',
                'municipio': 'Aguascalientes',
                'estado': 'Aguascalientes'
            }
        )
        
        empresa_fiscal, _ = EmpresaFiscal.objects.update_or_create(
            empresa=empresa,
            defaults={
                'regimen_fiscal': regimen,
                'codigo_postal': '20100'
            }
        )
        
        self.stdout.write("3. Setup Certificate (OpenSSL Mock)...")
        # Generate dummy certs if not present
        if not os.path.exists("key.pem"):
             try:
                 subprocess.run([
                     "openssl", "req", "-x509", "-newkey", "rsa:2048", 
                     "-keyout", "key.pem", "-out", "cert.pem", "-days", "365", 
                     "-nodes", "-subj", "/C=MX/ST=MX/L=MX/O=Test/CN=Test"
                 ], check=True, capture_output=True)
             except Exception as e:
                 self.stdout.write(self.style.ERROR(f"OpenSSL failed: {e}"))
                 return

        with open("key.pem", "rb") as f:
            key_content = f.read()
        with open("cert.pem", "rb") as f:
            cer_content = f.read()
            
        # Encrypt key content
        encrypted_key = encrypt_data(key_content)
        empty_pass = encrypt_text("") 

        cert, _ = CertificadoDigital.objects.get_or_create(
             rfc="EKU9003173C9",
             defaults={
                 "nombre": "Certificado Demo",
                 "archivo_key": encrypted_key,
                 "password_key": empty_pass,
             }
        )
        # Force update for demo
        cert.archivo_key = encrypted_key
        cert.password_key = empty_pass
        
        # Save .cer file content
        if not cert.archivo_cer:
            cert.archivo_cer.save("cert.pem", ContentFile(cer_content))
        else:
            # Overwrite
            file_path = cert.archivo_cer.path
            if os.path.exists(file_path):
                 with open(file_path, 'wb') as f:
                     f.write(cer_content)
            else:
                 cert.archivo_cer.save("cert.pem", ContentFile(cer_content))
        
        cert.save()
        
        # Link certificate
        empresa_fiscal.certificado_sello = cert
        empresa_fiscal.save()
        
        self.stdout.write("4. Setup Client and Products...")
        reg_605 = SATRegimenFiscal.objects.filter(pk="605").first()
        uso_g03 = SATUsoCFDI.objects.filter(pk="G03").first()

        cliente, _ = Cliente.objects.get_or_create(
            email="cliente@test.com",
            defaults={
                'nombre_completo': 'Juan Pérez',
                'rfc': 'XAXX010101000',
                'codigo_postal': '20100',
                'razon_social': 'JUAN PEREZ',
                'regimen_fiscal': reg_605,
                'uso_cfdi': uso_g03
            }
        )
        cliente.rfc = 'XAXX010101000'
        cliente.codigo_postal = '20100'
        cliente.save()
        
        prod, _ = Producto.objects.get_or_create(
            codigo="PROD001",
            defaults={
                'nombre': 'Producto Demo',
                'precio_lista': 100.00,
                'unidad_medida': 'PZA'
            }
        )
        prod.clave_sat_producto = '01010101'
        prod.clave_sat_unidad = 'H87'
        prod.save()
        
        self.stdout.write("5. Creating Sale...")
        caja, _ = Caja.objects.get_or_create(nombre="Caja 1")
        User = get_user_model()
        user = User.objects.first() or User.objects.create_superuser('admin_fiscal', 'admin@fiscal.com', 'admin')
            
        turno, _ = Turno.objects.get_or_create(caja=caja, usuario=user, defaults={'saldo_inicial':0})
        
        venta = Venta.objects.create(
            turno=turno,
            cliente=cliente,
            subtotal=100.00,
            impuestos=16.00,
            total=116.00,
            metodo_pago='EFECTIVO',
            folio='FDEMO-001'
        )
        
        DetalleVenta.objects.create(
            venta=venta,
            producto=prod,
            cantidad=1,
            precio_unitario=100.00,
            subtotal=100.00,
            descripcion="Producto Demo"
        )
        
        self.stdout.write(f"6. Processing Factura (Sign & Stamp) for Venta #{venta.id}...")
        service = FacturacionService()
        result = service.procesar_venta(venta.id)
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write("CADENA ORIGINAL:")
        self.stdout.write("-" * 50)
        self.stdout.write(result['cadena_original'])
        self.stdout.write("\n" + "="*50)
        self.stdout.write("XML TIMBRADO (MOCK PAC):")
        self.stdout.write("-" * 50)
        self.stdout.write(result['xml_timbrado'])
        self.stdout.write("="*50 + "\n")
        self.stdout.write(f"UUID Generado: {result['uuid']}")
        self.stdout.write("="*50 + "\n")
