import logging
import defusedxml.ElementTree as ET
from decimal import Decimal
from datetime import datetime
from django.utils import timezone

logger = logging.getLogger(__name__)

NAMESPACES = {
    'cfdi': 'http://www.sat.gob.mx/cfd/4',
    'cfdi33': 'http://www.sat.gob.mx/cfd/3',
    'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
}

def parse_cfdi(xml_content):
    """
    Parsea un archivo XML (CFDI 3.3 o 4.0) y extrae los datos clave.
    Retorna un diccionario con la información normalizada o lanza excepción.
    """
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
        logger.error(f"Error parsing XML structure: {e}")
        raise ValueError("El archivo no es un XML válido.")

    # Detectar versión
    version = root.get('Version')
    if not version:
        # Intentar 3.3
        version = root.get('version') # A veces minúscula en 3.2/antiguos o errores
    
    if version not in ['3.3', '4.0']:
         # Intentamos ser flexibles si es 4.0 con namespace
         pass

    # Manejo de Namespaces
    ns = {'cfdi': 'http://www.sat.gob.mx/cfd/4'} if version == '4.0' else {'cfdi': 'http://www.sat.gob.mx/cfd/3'}
    
    # 1. Datos Generales
    serie = root.get('Serie')
    folio = root.get('Folio')
    fecha_str = root.get('Fecha')
    total = root.get('Total')
    subtotal = root.get('SubTotal')
    moneda_code = root.get('Moneda')
    tipo_cambio = root.get('TipoCambio') or "1"
    tipo_comprobante = root.get('TipoDeComprobante') # I, E, P, N, T
    metodo_pago = root.get('MetodoPago') # PUE, PPD
    forma_pago = root.get('FormaPago')
    
    # 2. Emisor y Receptor
    emisor = root.find('cfdi:Emisor', ns)
    receptor = root.find('cfdi:Receptor', ns)
    
    if emisor is None or receptor is None:
        raise ValueError("No se encontró nodo Emisor o Receptor.")
        
    rfc_emisor = emisor.get('Rfc')
    nombre_emisor = emisor.get('Nombre')
    regimen_emisor = emisor.get('RegimenFiscal')
    
    rfc_receptor = receptor.get('Rfc')
    nombre_receptor = receptor.get('Nombre')
    regimen_receptor = receptor.get('RegimenFiscalReceptor') # Solo 4.0
    uso_cfdi = receptor.get('UsoCFDI')
    
    # 3. Timbre Fiscal (UUID)
    # El Timbre está en el Complemento
    complemento = root.find('cfdi:Complemento', ns)
    tfd_ns = {'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital'}
    uuid = None
    fecha_timbrado = None
    
    if complemento is not None:
        timbre = complemento.find('tfd:TimbreFiscalDigital', tfd_ns)
        if timbre is not None:
            uuid = timbre.get('UUID')
            fecha_timbrado_str = timbre.get('FechaTimbrado')
            if fecha_timbrado_str:
                fecha_timbrado = parse_sat_date(fecha_timbrado_str)

    # Validaciones mínimas
    if not uuid:
         raise ValueError("El XML no tiene Timbre Fiscal (UUID). ¿Es un CFDI válido/timbrado?")

    return {
        'version': version,
        'uuid': uuid.upper(),
        'serie': serie,
        'folio': folio,
        'fecha_emision': parse_sat_date(fecha_str),
        'fecha_timbrado': fecha_timbrado,
        'rfc_emisor': rfc_emisor,
        'nombre_emisor': nombre_emisor,
        'regimen_emisor': regimen_emisor,
        'rfc_receptor': rfc_receptor,
        'nombre_receptor': nombre_receptor,
        'regimen_receptor': regimen_receptor,
        'uso_cfdi': uso_cfdi,
        'total': Decimal(total),
        'subtotal': Decimal(subtotal),
        'moneda': moneda_code,
        'tipo_cambio': Decimal(tipo_cambio),
        'tipo_comprobante': tipo_comprobante,
        'metodo_pago': metodo_pago,
        'forma_pago': forma_pago,
    }

def parse_sat_date(date_str):
    """Parsea fechas formato SAT 'YYYY-MM-DDThh:mm:ss'."""
    if not date_str:
        return None
    try:
        # A veces viene con milisegundos o zona horaria, simplificamos
        return datetime.fromisoformat(date_str)
    except ValueError:
        try:
             # Formato manual si isoformat falla
             return datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%S')
        except:
             return timezone.now() # Fallback seguro
