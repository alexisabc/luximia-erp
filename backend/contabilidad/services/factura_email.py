"""
Servicio para envío de facturas por correo electrónico
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from contabilidad.models import Factura
from contabilidad.services.factura_pdf import FacturaPDFService


class FacturaEmailService:
    """
    Servicio para enviar facturas por correo electrónico
    """
    
    @classmethod
    def enviar_factura(cls, factura_id: int, email_destino: str, cc: list = None) -> dict:
        """
        Envía una factura por correo electrónico
        
        Args:
            factura_id: ID de la factura
            email_destino: Email del destinatario
            cc: Lista de emails en copia (opcional)
            
        Returns:
            dict: {
                'success': bool,
                'error': str (opcional)
            }
        """
        try:
            factura = Factura.objects.select_related(
                'empresa',
                'cliente'
            ).get(id=factura_id)
            
            # Validar que esté timbrada
            if factura.estado != 'TIMBRADA':
                return {
                    'success': False,
                    'error': 'Solo se pueden enviar facturas timbradas'
                }
            
            # Generar PDF si no existe
            if not factura.pdf_archivo:
                FacturaPDFService.generar_pdf(factura_id)
                factura.refresh_from_db()
            
            # Preparar contexto para email
            context = {
                'factura': factura,
                'empresa': factura.empresa,
                'cliente': factura.cliente,
            }
            
            # Renderizar email HTML
            html_content = render_to_string('emails/factura_email.html', context)
            text_content = cls._generar_texto_plano(factura)
            
            # Crear email
            subject = f'Factura {factura.serie}-{factura.folio} - {factura.empresa.razon_social}'
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[email_destino],
                cc=cc or []
            )
            
            # Adjuntar HTML
            email.attach_alternative(html_content, "text/html")
            
            # Adjuntar PDF
            if factura.pdf_archivo:
                email.attach_file(factura.pdf_archivo.path)
            
            # Adjuntar XML
            if factura.xml_timbrado:
                email.attach(
                    f'factura_{factura.uuid}.xml',
                    factura.xml_timbrado,
                    'application/xml'
                )
            
            # Enviar
            email.send()
            
            # Actualizar factura
            from django.utils import timezone
            factura.correo_enviado = True
            factura.fecha_envio_correo = timezone.now()
            factura.save(update_fields=['correo_enviado', 'fecha_envio_correo'])
            
            return {
                'success': True
            }
            
        except Factura.DoesNotExist:
            return {
                'success': False,
                'error': 'Factura no encontrada'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error al enviar correo: {str(e)}'
            }
    
    @classmethod
    def _generar_texto_plano(cls, factura: Factura) -> str:
        """
        Genera versión de texto plano del email
        """
        return f"""
Estimado(a) {factura.cliente.nombre_completo},

Adjunto encontrará la factura electrónica con los siguientes datos:

Folio: {factura.serie}-{factura.folio}
UUID: {factura.uuid}
Fecha: {factura.fecha.strftime('%d/%m/%Y')}
Total: ${factura.total:,.2f} {factura.moneda}

Archivos adjuntos:
- PDF: Representación impresa de la factura
- XML: Archivo CFDI timbrado por el SAT

Para verificar la validez de esta factura, puede consultar en:
https://verificacfdi.facturaelectronica.sat.gob.mx/

Atentamente,
{factura.empresa.razon_social}

---
Este es un correo automático, por favor no responder.
        """.strip()
    
    @classmethod
    def enviar_factura_automatico(cls, factura_id: int) -> dict:
        """
        Envía factura automáticamente al email del cliente
        
        Args:
            factura_id: ID de la factura
            
        Returns:
            dict: Resultado del envío
        """
        try:
            factura = Factura.objects.select_related('cliente').get(id=factura_id)
            
            # Obtener email del cliente
            email_cliente = getattr(factura.cliente, 'email', None)
            
            if not email_cliente:
                return {
                    'success': False,
                    'error': 'El cliente no tiene email registrado'
                }
            
            return cls.enviar_factura(factura_id, email_cliente)
            
        except Factura.DoesNotExist:
            return {
                'success': False,
                'error': 'Factura no encontrada'
            }


# Ejemplo de uso
"""
from contabilidad.services.factura_email import FacturaEmailService

# Enviar factura
resultado = FacturaEmailService.enviar_factura(
    factura_id=1,
    email_destino='cliente@example.com',
    cc=['contabilidad@miempresa.com']
)

if resultado['success']:
    print("✅ Factura enviada exitosamente")
else:
    print(f"❌ Error: {resultado['error']}")
"""
