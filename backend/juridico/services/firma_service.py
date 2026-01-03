from django.db import transaction
from django.utils import timezone
from django.template import Template, Context
from django.core.files.base import ContentFile
import hashlib
import io

# Importar servicio de PDF si existe, sino usar weasyprint directo
try:
    from core.services import PDFService
    HAS_PDF_SERVICE = True
except ImportError:
    HAS_PDF_SERVICE = False
    try:
        from weasyprint import HTML
        HAS_WEASYPRINT = True
    except ImportError:
        HAS_WEASYPRINT = False


class FirmaService:
    """
    Servicio para gestionar la generación y firma de documentos legales.
    """
    
    @staticmethod
    def generar_hash(datos):
        """
        Genera un hash SHA256 de los datos proporcionados.
        
        Args:
            datos: bytes o string a hashear
        
        Returns:
            str: Hash SHA256 en formato hexadecimal
        """
        if isinstance(datos, str):
            datos = datos.encode('utf-8')
        return hashlib.sha256(datos).hexdigest()
    
    @staticmethod
    @transaction.atomic
    def firmar_documento(
        plantilla,
        objeto,
        usuario_firmante,
        datos_contexto,
        datos_meta=None
    ):
        """
        Genera y firma un documento legal basado en una plantilla.
        
        Args:
            plantilla: Instancia de PlantillaLegal
            objeto: Objeto vinculado (Empleado, Proveedor, etc.)
            usuario_firmante: Usuario que firma el documento
            datos_contexto: Dict con datos para renderizar la plantilla
            datos_meta: Dict con metadatos de la firma (IP, UserAgent, etc.)
        
        Returns:
            DocumentoFirmado: Instancia del documento generado
        
        Raises:
            ValueError: Si la plantilla no está activa o faltan dependencias
        """
        from ..models import DocumentoFirmado
        from django.contrib.contenttypes.models import ContentType
        
        # Validar plantilla activa
        if not plantilla.activo:
            raise ValueError("La plantilla no está activa")
        
        # 1. Renderizar HTML con la plantilla
        template = Template(plantilla.contenido)
        context = Context(datos_contexto)
        html_renderizado = template.render(context)
        
        # 2. Generar PDF
        pdf_content = FirmaService._generar_pdf(html_renderizado, plantilla.titulo)
        
        # 3. Generar hash del PDF
        hash_firma = FirmaService.generar_hash(pdf_content)
        
        # 4. Preparar metadatos de firma
        if datos_meta is None:
            datos_meta = {}
        
        datos_meta.update({
            'fecha_firma': timezone.now().isoformat(),
            'usuario': usuario_firmante.username,
            'hash_algoritmo': 'SHA256'
        })
        
        # 5. Crear registro de documento firmado
        content_type = ContentType.objects.get_for_model(objeto)
        
        documento = DocumentoFirmado.objects.create(
            plantilla=plantilla,
            content_type=content_type,
            object_id=objeto.pk,
            hash_firma=hash_firma,
            datos_firma=datos_meta,
            usuario_firmante=usuario_firmante,
            fecha_firma=timezone.now(),
            estado='FIRMADO',
            datos_renderizados=datos_contexto
        )
        
        # 6. Guardar archivo PDF
        nombre_archivo = f"{plantilla.tipo}_{objeto.pk}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        documento.archivo_pdf.save(
            nombre_archivo,
            ContentFile(pdf_content),
            save=True
        )
        
        return documento
    
    @staticmethod
    def _generar_pdf(html_content, titulo="Documento"):
        """
        Genera un PDF desde contenido HTML.
        
        Args:
            html_content: String con HTML
            titulo: Título del documento
        
        Returns:
            bytes: Contenido del PDF
        
        Raises:
            ValueError: Si no hay biblioteca de PDF disponible
        """
        if HAS_PDF_SERVICE:
            # Usar servicio centralizado si existe
            return PDFService.html_to_pdf(html_content, titulo=titulo)
        
        elif HAS_WEASYPRINT:
            # Usar weasyprint directamente
            pdf_file = io.BytesIO()
            HTML(string=html_content).write_pdf(pdf_file)
            return pdf_file.getvalue()
        
        else:
            raise ValueError(
                "No hay biblioteca de generación de PDF disponible. "
                "Instala weasyprint o implementa core.services.PDFService"
            )
    
    @staticmethod
    def verificar_documento(documento):
        """
        Verifica la integridad de un documento firmado.
        
        Args:
            documento: Instancia de DocumentoFirmado
        
        Returns:
            dict: Resultado de la verificación con 'valido' y 'mensaje'
        """
        if not documento.archivo_pdf:
            return {
                'valido': False,
                'mensaje': 'El documento no tiene archivo PDF asociado'
            }
        
        # Verificar hash
        if not documento.verificar_integridad():
            return {
                'valido': False,
                'mensaje': 'El hash del documento no coincide. El archivo pudo haber sido modificado.'
            }
        
        return {
            'valido': True,
            'mensaje': 'El documento es válido y no ha sido modificado',
            'hash': documento.hash_firma,
            'fecha_firma': documento.fecha_firma,
            'firmante': documento.usuario_firmante.get_full_name() if documento.usuario_firmante else 'Desconocido'
        }
