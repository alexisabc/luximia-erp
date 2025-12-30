from django.template.loader import render_to_string
from django.conf import settings
from config.models import ConfiguracionGlobal
import weasyprint
import logging

logger = logging.getLogger(__name__)

class PDFService:
    @staticmethod
    def generate_pdf(template_name, context=None):
        """
        Genera un archivo PDF a partir de un template HTML.
        Inyecta configuración global (logo, nombre) para el branding.
        Retorna el contenido del PDF en bytes.
        """
        if context is None:
            context = {}
            
        # Obtener configuración global
        config = ConfiguracionGlobal.get_solo()
        
        # Determinar URL base para recursos estáticos (imágenes, css)
        # WeasyPrint necesita rutas de sistema de archivos en local o URLs absolutas si están en web.
        base_url = settings.STATIC_ROOT if not settings.DEBUG else str(settings.BASE_DIR / 'staticfiles')
        
        # Inyectar branding
        # Nota: Para imágenes en PDF, es mejor usar rutas absolutas de sistema de archivos si es local,
        # o URLs públicas completas.
        
        logo_url = None
        if config.logo_login:
            # Si usamos S3/R2 en producción, config.logo_login.url será una URL remota completa.
            # En local (FileSystem), será /media/logo.png.
            logo_url = config.logo_login.url
            if settings.DEBUG and logo_url.startswith('/'):
                 # Convertir ruta relativa web a ruta de sistema de archivos para Weasyprint local
                 logo_url = f"file://{settings.MEDIA_ROOT}{logo_url.replace('/media', '')}"

        context.update({
            'system_name': config.nombre_sistema or 'ERP System',
            'logo_url': logo_url,
            'company_address': config.direccion_fiscal or 'Dirección no configurada',
            'company_rfc': config.rfc or 'XAXX010101000'
        })
        
        try:
            html_string = render_to_string(template_name, context)
            
            # Generar PDF
            pdf_file = weasyprint.HTML(
                string=html_string, 
                base_url=base_url
            ).write_pdf()
            
            return pdf_file
        except Exception as e:
            logger.error(f"Error generando PDF con template {template_name}: {str(e)}")
            raise e
