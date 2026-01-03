"""
Generador de códigos QR para facturas CFDI según especificaciones del SAT.
"""
import qrcode
from io import BytesIO
import base64
from decimal import Decimal


def generar_url_verificacion_sat(uuid: str, rfc_emisor: str, rfc_receptor: str, total: Decimal, sello_cfd: str) -> str:
    """
    Genera la URL de verificación del SAT según especificaciones oficiales.
    
    Args:
        uuid: UUID del timbre fiscal
        rfc_emisor: RFC del emisor
        rfc_receptor: RFC del receptor
        total: Total de la factura (con 6 decimales)
        sello_cfd: Sello digital del CFD (se usan los últimos 8 caracteres)
    
    Returns:
        URL completa para verificación en el portal del SAT
    """
    # Formatear total con 6 decimales
    total_str = f"{total:.6f}"
    
    # Tomar últimos 8 caracteres del sello
    sello_ultimos_8 = sello_cfd[-8:] if len(sello_cfd) >= 8 else sello_cfd
    
    # Construir URL según especificación SAT
    url = (
        f"https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?"
        f"id={uuid}"
        f"&re={rfc_emisor}"
        f"&rr={rfc_receptor}"
        f"&tt={total_str}"
        f"&fe={sello_ultimos_8}"
    )
    
    return url


def generar_qr_factura(uuid: str, rfc_emisor: str, rfc_receptor: str, total: Decimal, sello_cfd: str) -> BytesIO:
    """
    Genera un código QR en memoria para una factura CFDI.
    
    Args:
        uuid: UUID del timbre fiscal
        rfc_emisor: RFC del emisor
        rfc_receptor: RFC del receptor
        total: Total de la factura
        sello_cfd: Sello digital del CFD
    
    Returns:
        BytesIO conteniendo la imagen PNG del código QR
    """
    # Generar URL de verificación
    url = generar_url_verificacion_sat(uuid, rfc_emisor, rfc_receptor, total, sello_cfd)
    
    # Crear código QR
    qr = qrcode.QRCode(
        version=1,  # Tamaño automático
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Generar imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Guardar en BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer


def generar_qr_base64(uuid: str, rfc_emisor: str, rfc_receptor: str, total: Decimal, sello_cfd: str) -> str:
    """
    Genera un código QR y lo retorna como string base64 para embeber en HTML.
    
    Returns:
        String base64 de la imagen PNG
    """
    buffer = generar_qr_factura(uuid, rfc_emisor, rfc_receptor, total, sello_cfd)
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"
