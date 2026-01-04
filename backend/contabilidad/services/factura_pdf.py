"""
Servicio para generación de PDF de facturas CFDI
"""
import qrcode
import base64
from io import BytesIO
from django.template.loader import render_to_string
from core.services.pdf_service import PDFService
from contabilidad.models import Factura


class FacturaPDFService:
    """
    Servicio para generar PDFs de facturas electrónicas
    """
    
    @classmethod
    def generar_pdf(cls, factura_id: int) -> bytes:
        """
        Genera el PDF de una factura
        
        Args:
            factura_id: ID de la factura
            
        Returns:
            bytes: Contenido del PDF
        """
        factura = Factura.objects.select_related(
            'empresa',
            'empresa__configuracion_fiscal',
            'empresa__configuracion_fiscal__regimen_fiscal',
            'cliente',
            'forma_pago',
            'metodo_pago'
        ).prefetch_related(
            'conceptos',
            'conceptos__clave_prod_serv',
            'conceptos__clave_unidad'
        ).get(id=factura_id)
        
        # Calcular IVA
        iva = cls._calcular_iva(factura)
        
        # Generar código QR si está timbrada
        qr_code = None
        if factura.uuid:
            qr_code = cls._generar_qr_code(factura)
        
        # Preparar contexto
        context = {
            'factura': factura,
            'empresa': factura.empresa,
            'iva': iva,
            'qr_code': qr_code,
        }
        
        # Renderizar HTML
        html_content = render_to_string('facturas/factura_pdf.html', context)
        
        # Generar PDF
        pdf_bytes = PDFService.generate_pdf_from_html(html_content)
        
        # Guardar en factura
        from django.core.files.base import ContentFile
        factura.pdf_archivo.save(
            f'factura_{factura.serie}_{factura.folio}.pdf',
            ContentFile(pdf_bytes),
            save=True
        )
        
        return pdf_bytes
    
    @classmethod
    def _calcular_iva(cls, factura: Factura) -> float:
        """
        Calcula el IVA de la factura
        """
        # Por ahora asumir IVA 16% sobre subtotal
        # TODO: Calcular desde impuestos de conceptos
        return float(factura.subtotal) * 0.16
    
    @classmethod
    def _generar_qr_code(cls, factura: Factura) -> str:
        """
        Genera código QR para verificación en SAT
        
        Formato: https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?
                 &id=UUID&re=RFC_EMISOR&rr=RFC_RECEPTOR&tt=TOTAL&fe=ULTIMOS_8_SELLO
        """
        # Construir URL de verificación
        url_params = {
            'id': str(factura.uuid),
            're': factura.empresa.rfc,
            'rr': factura.cliente.rfc,
            'tt': f"{factura.total:.6f}",
            'fe': factura.sello_digital[-8:] if factura.sello_digital else ''
        }
        
        url = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?'
        url += '&'.join([f'{k}={v}' for k, v in url_params.items()])
        
        # Generar QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Convertir a imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return img_base64
    
    @classmethod
    def obtener_pdf_url(cls, factura_id: int) -> str:
        """
        Obtiene la URL del PDF de una factura
        Si no existe, lo genera
        
        Args:
            factura_id: ID de la factura
            
        Returns:
            str: URL del PDF
        """
        factura = Factura.objects.get(id=factura_id)
        
        # Si no tiene PDF, generarlo
        if not factura.pdf_archivo:
            cls.generar_pdf(factura_id)
            factura.refresh_from_db()
        
        return factura.pdf_archivo.url if factura.pdf_archivo else ''


# Ejemplo de uso
"""
from contabilidad.services.factura_pdf import FacturaPDFService

# Generar PDF
pdf_bytes = FacturaPDFService.generar_pdf(factura_id=1)

# Obtener URL
pdf_url = FacturaPDFService.obtener_pdf_url(factura_id=1)
print(f"PDF disponible en: {pdf_url}")
"""
