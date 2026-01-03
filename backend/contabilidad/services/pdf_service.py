"""
Servicio para generación de PDFs de facturas CFDI 4.0.
"""
from io import BytesIO
from decimal import Decimal
from lxml import etree
from django.template.loader import render_to_string
from weasyprint import HTML
import logging

from ..models import Factura
from ..utils.qr_generator import generar_qr_base64

logger = logging.getLogger(__name__)


def extraer_datos_xml(xml_content: str) -> dict:
    """
    Parsea el XML timbrado y extrae todos los datos necesarios para el PDF.
    
    Returns:
        dict con estructura completa de datos del CFDI
    """
    try:
        root = etree.fromstring(xml_content.encode('utf-8'))
        
        # Namespaces
        ns = {
            'cfdi': 'http://www.sat.gob.mx/cfd/4',
            'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'
        }
        
        # Datos del comprobante
        comprobante = {
            'version': root.get('Version'),
            'serie': root.get('Serie'),
            'folio': root.get('Folio'),
            'fecha': root.get('Fecha'),
            'sello': root.get('Sello'),
            'forma_pago': root.get('FormaPago'),
            'no_certificado': root.get('NoCertificado'),
            'certificado': root.get('Certificado'),
            'subtotal': root.get('SubTotal'),
            'moneda': root.get('Moneda'),
            'total': root.get('Total'),
            'tipo_comprobante': root.get('TipoDeComprobante'),
            'exportacion': root.get('Exportacion'),
            'metodo_pago': root.get('MetodoPago'),
            'lugar_expedicion': root.get('LugarExpedicion'),
        }
        
        # Emisor
        emisor_elem = root.find('cfdi:Emisor', ns)
        emisor = {
            'rfc': emisor_elem.get('Rfc'),
            'nombre': emisor_elem.get('Nombre'),
            'regimen_fiscal': emisor_elem.get('RegimenFiscal'),
        }
        
        # Receptor
        receptor_elem = root.find('cfdi:Receptor', ns)
        receptor = {
            'rfc': receptor_elem.get('Rfc'),
            'nombre': receptor_elem.get('Nombre'),
            'domicilio_fiscal': receptor_elem.get('DomicilioFiscalReceptor'),
            'regimen_fiscal': receptor_elem.get('RegimenFiscalReceptor'),
            'uso_cfdi': receptor_elem.get('UsoCFDI'),
        }
        
        # Conceptos
        conceptos = []
        conceptos_elem = root.find('cfdi:Conceptos', ns)
        for concepto in conceptos_elem.findall('cfdi:Concepto', ns):
            conceptos.append({
                'clave_prod_serv': concepto.get('ClaveProdServ'),
                'no_identificacion': concepto.get('NoIdentificacion'),
                'cantidad': concepto.get('Cantidad'),
                'clave_unidad': concepto.get('ClaveUnidad'),
                'unidad': concepto.get('Unidad'),
                'descripcion': concepto.get('Descripcion'),
                'valor_unitario': concepto.get('ValorUnitario'),
                'importe': concepto.get('Importe'),
                'objeto_imp': concepto.get('ObjetoImp'),
            })
        
        # Impuestos
        impuestos_elem = root.find('cfdi:Impuestos', ns)
        impuestos = {
            'total_trasladados': impuestos_elem.get('TotalImpuestosTrasladados') if impuestos_elem is not None else '0',
            'total_retenidos': impuestos_elem.get('TotalImpuestosRetenidos') if impuestos_elem is not None else '0',
            'traslados': [],
            'retenciones': [],
        }
        
        if impuestos_elem is not None:
            traslados_elem = impuestos_elem.find('cfdi:Traslados', ns)
            if traslados_elem is not None:
                for traslado in traslados_elem.findall('cfdi:Traslado', ns):
                    impuestos['traslados'].append({
                        'base': traslado.get('Base'),
                        'impuesto': traslado.get('Impuesto'),
                        'tipo_factor': traslado.get('TipoFactor'),
                        'tasa_cuota': traslado.get('TasaOCuota'),
                        'importe': traslado.get('Importe'),
                    })
        
        # Timbre Fiscal Digital
        complemento = root.find('cfdi:Complemento', ns)
        timbre_elem = complemento.find('tfd:TimbreFiscalDigital', ns) if complemento is not None else None
        
        timbre = {}
        if timbre_elem is not None:
            timbre = {
                'uuid': timbre_elem.get('UUID'),
                'fecha_timbrado': timbre_elem.get('FechaTimbrado'),
                'rfc_prov_certif': timbre_elem.get('RfcProvCertif'),
                'sello_cfd': timbre_elem.get('SelloCFD'),
                'no_certificado_sat': timbre_elem.get('NoCertificadoSAT'),
                'sello_sat': timbre_elem.get('SelloSAT'),
            }
            
            # Generar cadena original del timbre
            timbre['cadena_original'] = (
                f"||{timbre_elem.get('Version')}|"
                f"{timbre_elem.get('UUID')}|"
                f"{timbre_elem.get('FechaTimbrado')}|"
                f"{timbre_elem.get('RfcProvCertif')}|"
                f"{timbre_elem.get('SelloCFD')}|"
                f"{timbre_elem.get('NoCertificadoSAT')}||"
            )
        
        return {
            'comprobante': comprobante,
            'emisor': emisor,
            'receptor': receptor,
            'conceptos': conceptos,
            'impuestos': impuestos,
            'timbre': timbre,
        }
        
    except Exception as e:
        logger.error(f"Error parseando XML: {e}")
        raise


def numero_a_letra(numero: Decimal) -> str:
    """
    Convierte un número decimal a su representación en letra.
    Simplificado para montos en pesos mexicanos.
    """
    # Implementación básica - en producción usar librería como num2words
    entero = int(numero)
    centavos = int((numero - entero) * 100)
    return f"{entero:,} PESOS {centavos:02d}/100 M.N."


def generar_pdf_factura(factura_id: int) -> bytes:
    """
    Genera el PDF de una factura timbrada.
    
    Args:
        factura_id: ID de la factura
        
    Returns:
        bytes del PDF generado
        
    Raises:
        ValueError: Si la factura no existe o no está timbrada
    """
    try:
        factura = Factura.objects.get(id=factura_id)
    except Factura.DoesNotExist:
        raise ValueError(f"Factura {factura_id} no encontrada")
    
    if not factura.uuid:
        raise ValueError("La factura no ha sido timbrada")
    
    # Leer XML
    if not factura.xml_archivo:
        raise ValueError("No se encontró el archivo XML de la factura")
    
    xml_content = factura.xml_archivo.read().decode('utf-8')
    factura.xml_archivo.seek(0)  # Reset file pointer
    
    # Extraer datos del XML
    datos = extraer_datos_xml(xml_content)
    
    # Generar QR
    qr_base64 = generar_qr_base64(
        uuid=datos['timbre']['uuid'],
        rfc_emisor=datos['emisor']['rfc'],
        rfc_receptor=datos['receptor']['rfc'],
        total=Decimal(datos['comprobante']['total']),
        sello_cfd=datos['timbre']['sello_cfd']
    )
    
    # Preparar contexto para template
    context = {
        'factura': factura,
        'comprobante': datos['comprobante'],
        'emisor': datos['emisor'],
        'receptor': datos['receptor'],
        'conceptos': datos['conceptos'],
        'impuestos': datos['impuestos'],
        'timbre': datos['timbre'],
        'qr_image': qr_base64,
        'total_letra': numero_a_letra(Decimal(datos['comprobante']['total'])),
    }
    
    # Renderizar HTML
    html_string = render_to_string('factura_v40.html', context)
    
    # Generar PDF
    pdf_file = BytesIO()
    HTML(string=html_string).write_pdf(pdf_file)
    pdf_file.seek(0)
    
    return pdf_file.getvalue()
