from core.services.pdf_service import PDFService
from core.services.email_service import EmailService
from notifications.services import NotificacionService
from compras.models.compras import OrdenCompra
import logging

logger = logging.getLogger(__name__)

class EnvioOrdenService:
    @staticmethod
    def enviar_orden_proveedor(orden_id, usuario_id):
        """
        Orquesta el envío de una Orden de Compra al proveedor.
        1. Genera PDF.
        2. Envía Email con adjunto.
        3. Notifica al usuario.
        """
        try:
            # Recuperar la orden
            orden = OrdenCompra.objects.get(pk=orden_id)
            
            # Validar que tenga email del proveedor (opcional, por ahora asumimos siempre envío a un default si no hay)
            # Para este sprint, hardcodeamos o usamos el del proveedor si existe. 
            # Asumiremos que orden.proveedor.email contact principal existe.
            # Si no, usamos settings.DEFAULT_FROM_EMAIL para test.
            
            destinatario_email = getattr(orden.proveedor, 'email_contacto', None)
            if not destinatario_email:
                 # Fallback para pruebas si el modelo Proveedor no tiene email o está vacío
                 destinatario_email = 'proveedor_test@localhost.com'

            # 1. Generar PDF
            pdf_bytes = PDFService.generate_pdf('reports/orden_compra.html', {'orden': orden})
            filename = f"Orden_Compra_{orden.folio}.pdf"
            
            # 2. Enviar Email
            # El contexto para el email
            email_context = {
                'folio': orden.folio,
                'fecha_solicitud': orden.fecha_solicitud,
                'total': orden.total,
                'moneda': orden.moneda.codigo
            }
            
            # Adjunto: (filename, content, mimetype)
            attachments = [(filename, pdf_bytes, 'application/pdf')]
            
            subject = f"Nueva Orden de Compra {orden.folio} - {orden.proveedor}"
            
            success = EmailService.send_template_email(
                to_email=destinatario_email,
                subject=subject,
                template_name='emails/envio_oc.html',
                context=email_context,
                attachments=attachments
            )
            
            if success:
                # 3. Notificación al usuario
                NotificacionService.crear_notificacion(
                    usuario_id=usuario_id,
                    titulo=f"OC {orden.folio} Enviada",
                    mensaje=f"La orden de compra ha sido enviada correctamente al proveedor {orden.proveedor}.",
                    tipo='SUCCESS',
                    link=f"/compras/ordenes/{orden.id}"
                )
                
                # Actualizar estado si es necesario?
                # orden.estado = 'ENVIADA' # Si existiera ese estado
                # orden.save()
                
                return True
            else:
                raise Exception("El servicio de email retornó falso.")

        except Exception as e:
            logger.error(f"Error en EnvioOrdenService orden {orden_id}: {str(e)}")
            NotificacionService.crear_notificacion(
                usuario_id=usuario_id,
                titulo="Error enviando OC",
                mensaje=f"No se pudo enviar la orden {orden_id}: {str(e)}",
                tipo='ERROR',
                link=f"/compras/ordenes/{orden_id}"
            )
            return False
