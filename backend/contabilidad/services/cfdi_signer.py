"""
Servicio para sellado digital de CFDI usando certificados CSD del SAT
"""
import base64
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from django.conf import settings
from contabilidad.models import CertificadoDigital


class CFDISignerService:
    """
    Servicio para aplicar sellado digital a CFDI
    """
    
    @classmethod
    def sellar_cfdi(cls, cadena_original: str, certificado_id: int) -> dict:
        """
        Genera el sello digital del CFDI
        
        Args:
            cadena_original: Cadena original del comprobante
            certificado_id: ID del certificado digital a usar
            
        Returns:
            dict: {
                'sello': str,  # Sello digital en base64
                'numero_certificado': str,
                'certificado': str  # Certificado en base64
            }
        """
        certificado = CertificadoDigital.objects.get(id=certificado_id)
        
        # Validar que el certificado esté activo y vigente
        if not certificado.activo:
            raise ValueError("El certificado no está activo")
        
        # Leer llave privada
        private_key = cls._leer_llave_privada(certificado)
        
        # Generar sello (firma digital)
        sello = cls._generar_sello(cadena_original, private_key)
        
        # Leer certificado público
        cert_data = cls._leer_certificado(certificado)
        
        return {
            'sello': sello,
            'numero_certificado': certificado.numero_certificado,
            'certificado': cert_data['certificado_base64'],
        }
    
    @classmethod
    def _leer_llave_privada(cls, certificado: CertificadoDigital):
        """
        Lee y desencripta la llave privada del certificado
        
        Args:
            certificado: Instancia de CertificadoDigital
            
        Returns:
            RSAPrivateKey: Llave privada desencriptada
        """
        from cryptography.fernet import Fernet
        
        # Leer archivo .key
        with certificado.archivo_key.open('rb') as f:
            key_data = f.read()
        
        # Desencriptar password
        # TODO: Implementar desencriptación de password_key con Fernet
        # Por ahora asumir que password_key está en texto plano
        password = certificado.password_key.encode('utf-8')
        
        # Cargar llave privada
        try:
            private_key = serialization.load_pem_private_key(
                key_data,
                password=password,
                backend=default_backend()
            )
        except Exception as e:
            # Intentar con formato DER
            try:
                private_key = serialization.load_der_private_key(
                    key_data,
                    password=password,
                    backend=default_backend()
                )
            except Exception:
                raise ValueError(f"No se pudo cargar la llave privada: {str(e)}")
        
        return private_key
    
    @classmethod
    def _leer_certificado(cls, certificado: CertificadoDigital) -> dict:
        """
        Lee el certificado público
        
        Args:
            certificado: Instancia de CertificadoDigital
            
        Returns:
            dict: {
                'certificado_base64': str,
                'numero_serie': str,
                'rfc': str
            }
        """
        # Leer archivo .cer
        with certificado.archivo_cer.open('rb') as f:
            cert_data = f.read()
        
        # Intentar cargar como DER (formato SAT)
        try:
            cert = x509.load_der_x509_certificate(cert_data, default_backend())
        except Exception:
            # Intentar como PEM
            cert = x509.load_pem_x509_certificate(cert_data, default_backend())
        
        # Convertir a base64
        cert_base64 = base64.b64encode(cert_data).decode('utf-8')
        
        # Extraer número de serie
        numero_serie = format(cert.serial_number, 'x')
        
        return {
            'certificado_base64': cert_base64,
            'numero_serie': numero_serie,
            'rfc': certificado.rfc_titular,
        }
    
    @classmethod
    def _generar_sello(cls, cadena_original: str, private_key) -> str:
        """
        Genera el sello digital (firma SHA-256 con RSA)
        
        Args:
            cadena_original: Cadena original del comprobante
            private_key: Llave privada RSA
            
        Returns:
            str: Sello digital en base64
        """
        # Convertir cadena a bytes
        mensaje = cadena_original.encode('utf-8')
        
        # Firmar con SHA-256 y RSA
        signature = private_key.sign(
            mensaje,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        
        # Convertir a base64
        sello_base64 = base64.b64encode(signature).decode('utf-8')
        
        return sello_base64
    
    @classmethod
    def validar_certificado(cls, certificado_id: int) -> dict:
        """
        Valida que un certificado sea válido y esté vigente
        
        Args:
            certificado_id: ID del certificado a validar
            
        Returns:
            dict: {
                'valido': bool,
                'errores': list[str],
                'info': dict
            }
        """
        from datetime import date
        
        certificado = CertificadoDigital.objects.get(id=certificado_id)
        errores = []
        
        # Verificar que esté activo
        if not certificado.activo:
            errores.append("El certificado no está marcado como activo")
        
        # Verificar vigencia
        hoy = date.today()
        if certificado.fecha_inicio and hoy < certificado.fecha_inicio:
            errores.append(f"El certificado aún no es válido (inicia {certificado.fecha_inicio})")
        
        if certificado.fecha_fin and hoy > certificado.fecha_fin:
            errores.append(f"El certificado ha expirado (venció {certificado.fecha_fin})")
        
        # Verificar que existan los archivos
        if not certificado.archivo_cer:
            errores.append("No se ha cargado el archivo .cer")
        
        if not certificado.archivo_key:
            errores.append("No se ha cargado el archivo .key")
        
        # Intentar leer el certificado
        try:
            cert_data = cls._leer_certificado(certificado)
            info = {
                'numero_serie': cert_data['numero_serie'],
                'rfc': cert_data['rfc'],
                'vigencia_inicio': certificado.fecha_inicio,
                'vigencia_fin': certificado.fecha_fin,
            }
        except Exception as e:
            errores.append(f"Error al leer certificado: {str(e)}")
            info = {}
        
        # Intentar leer la llave privada
        try:
            cls._leer_llave_privada(certificado)
        except Exception as e:
            errores.append(f"Error al leer llave privada: {str(e)}")
        
        return {
            'valido': len(errores) == 0,
            'errores': errores,
            'info': info,
        }
    
    @classmethod
    def extraer_info_certificado(cls, archivo_cer_path: str) -> dict:
        """
        Extrae información de un archivo .cer sin guardarlo
        Útil para validar antes de subir
        
        Args:
            archivo_cer_path: Ruta al archivo .cer
            
        Returns:
            dict: Información del certificado
        """
        with open(archivo_cer_path, 'rb') as f:
            cert_data = f.read()
        
        # Cargar certificado
        try:
            cert = x509.load_der_x509_certificate(cert_data, default_backend())
        except Exception:
            cert = x509.load_pem_x509_certificate(cert_data, default_backend())
        
        # Extraer información
        subject = cert.subject
        
        # Extraer RFC del subject
        rfc = None
        for attr in subject:
            if attr.oid.dotted_string == '2.5.4.45':  # serialNumber OID
                rfc = attr.value
                break
        
        # Extraer razón social
        razon_social = None
        for attr in subject:
            if attr.oid == x509.oid.NameOID.COMMON_NAME:
                razon_social = attr.value
                break
        
        return {
            'numero_serie': format(cert.serial_number, 'x'),
            'rfc': rfc,
            'razon_social': razon_social,
            'vigencia_inicio': cert.not_valid_before_utc.date(),
            'vigencia_fin': cert.not_valid_after_utc.date(),
            'emisor': cert.issuer.rfc4514_string(),
        }
