import os
import sys
import django
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from contabilidad.views import FacturaViewSet
from contabilidad.models import Factura, Moneda

def test_xml_upload():
    print("Testing XML Upload...")
    
    # Ensure Moneda exists
    Moneda.objects.get_or_create(codigo="MXN", defaults={"nombre": "Peso Mexicano"})

    # Fake XML 4.0
    xml_content = b"""<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante Version="4.0" Serie="TEST" Folio="123" Fecha="2023-10-25T12:00:00" SubTotal="1000" Moneda="MXN" Total="1160" TipoDeComprobante="I" MetodoPago="PUE" FormaPago="01" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital">
    <cfdi:Emisor Rfc="TEST010203001" Nombre="EMPRESA PRUEBA" RegimenFiscal="601"/>
    <cfdi:Receptor Rfc="GEN010101000" Nombre="PUBLICO EN GENERAL" RegimenFiscalReceptor="616" UsoCFDI="S01"/>
    <cfdi:Complemento>
        <tfd:TimbreFiscalDigital UUID="550e8400-e29b-41d4-a716-446655440000" FechaTimbrado="2023-10-25T12:05:00"/>
    </cfdi:Complemento>
</cfdi:Comprobante>"""

    # Cleanup previous test
    Factura.objects.filter(uuid="550e8400-e29b-41d4-a716-446655440000").delete()

    factory = APIRequestFactory()
    file = SimpleUploadedFile("factura_test.xml", xml_content, content_type="text/xml")
    
    request = factory.post('/contabilidad/facturas/upload-xml/', {'xmls': [file]}, format='multipart')
    view = FacturaViewSet.as_view({'post': 'upload_xml'})
    
    response = view(request)
    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    if response.status_code == 200 and response.data['procesados'] == 1:
        print("SUCCESS: XML Uploaded and Parsed.")
        
        # Verify DB
        f = Factura.objects.get(uuid="550e8400-e29b-41d4-a716-446655440000")
        print(f"Factura Created: {f}")
        if f.total == 1160:
             print("SUCCESS: Data matched.")
        else:
             print("FAILURE: Data mismatch.")
    else:
        print("FAILURE: Upload failed.")

if __name__ == "__main__":
    try:
        test_xml_upload()
    except Exception as e:
        print(f"Test Crashed: {e}")
