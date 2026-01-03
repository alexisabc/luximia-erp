import base64
from pathlib import Path
from lxml import etree
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_der_private_key
from django.conf import settings
from core.encryption import decrypt_data, decrypt_text

class XMLSigner:
    def __init__(self, empresa_fiscal):
        self.empresa_fiscal = empresa_fiscal
        self.xslt_path = Path(settings.BASE_DIR) / 'contabilidad' / 'sat_resources' / 'cadenaoriginal_4_0.xslt'
        
    def generar_cadena_original(self, xml_str):
        if not self.xslt_path.exists():
            raise FileNotFoundError(f"XSLT no encontrado en: {self.xslt_path}")
        
        # Parse XML
        # Remove encoding declaration to avoid lxml issues if passed as string
        if isinstance(xml_str, str):
            xml_bytes = xml_str.encode('utf-8')
        else:
            xml_bytes = xml_str
            
        xml_root = etree.fromstring(xml_bytes)
        xslt_root = etree.parse(str(self.xslt_path))
        transform = etree.XSLT(xslt_root)
        
        cadena_original = str(transform(xml_root))
        return cadena_original

    def firmar_xml(self, xml_str):
        cert = self.empresa_fiscal.certificado_sello
        if not cert:
            raise ValueError("La empresa no tiene certificado configurado")
            
        # 1. Generar Cadena Original
        cadena = self.generar_cadena_original(xml_str)
        # Ensure it's not empty? XSLT output is sometimes tricky.
        
        # 2. Desencriptar Key
        if not cert.archivo_key:
             raise ValueError("Archivo .key no presente en certificado.")
             
        key_bytes_encrypted = cert.archivo_key
        if isinstance(key_bytes_encrypted, memoryview):
            key_bytes_encrypted = bytes(key_bytes_encrypted)
            
        key_bytes = decrypt_data(key_bytes_encrypted)
        
        password_encrypted = cert.password_key
        password_str = decrypt_text(password_encrypted)
        password = password_str.encode('utf-8') if password_str else None
        
        # Load Private Key
        try:
            private_key = load_der_private_key(key_bytes, password=password)
        except ValueError:
             # Try PEM
            private_key = load_pem_private_key(key_bytes, password=password)

        # 3. Firmar (SHA256)
        signature = private_key.sign(
            cadena.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        sello_b64 = base64.b64encode(signature).decode('utf-8')
        
        # 4. Obtener Certificado (.cer)
        cer_file = cert.archivo_cer
        if not cer_file:
             raise ValueError("Archivo .cer no presente en certificado.")
             
        # Read file. Might be closed.
        try:
            cer_file.open('rb')
            cer_content = cer_file.read()
            cer_file.close()
        except:
            # Maybe already open or path
            with open(cer_file.path, 'rb') as f:
                cer_content = f.read()

        if b"BEGIN CERTIFICATE" in cer_content:
             # PEM
             lines = cer_content.decode('utf-8').splitlines()
             cert_b64 = "".join([l for l in lines if "BEGIN" not in l and "END" not in l])
        else:
             # DER
             cert_b64 = base64.b64encode(cer_content).decode('utf-8')

        # 5. Inyectar en XML
        if isinstance(xml_str, str):
            xml_bytes = xml_str.encode('utf-8')
        else:
            xml_bytes = xml_str
            
        root = etree.fromstring(xml_bytes)
        
        # Attributes
        root.set("Sello", sello_b64)
        root.set("Certificado", cert_b64)
        # root.set("NoCertificado", "...") # Optional for now, user didn't strict ask for logic to extract NoCertificado
        
        final_xml = etree.tostring(root, encoding='UTF-8').decode('UTF-8')
        
        return final_xml, cadena
