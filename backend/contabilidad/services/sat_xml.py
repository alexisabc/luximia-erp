import logging
import defusedxml.ElementTree as ET
from xml.etree.ElementTree import Element, SubElement, tostring
from decimal import Decimal
from django.db.models import Sum, Q, Case, When, Value, DecimalField
from datetime import date
from ..models import CuentaContable, Poliza, DetallePoliza

logger = logging.getLogger(__name__)

# Namespaces SAT
NS_CATALOGO = "http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas"
NS_BALANZA = "http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion"
XSI = "http://www.w3.org/2001/XMLSchema-instance"

def generate_catalogo_xml(anio: int, mes: int, rfc: str = "XAXX010101000"):
    """
    Genera el XML del Catálogo de Cuentas (v1.3).
    """
    root = Element(f"{{{NS_CATALOGO}}}Catalogo")
    root.set("Version", "1.3")
    root.set("RFC", rfc)
    root.set("Mes", f"{mes:02d}")
    root.set("Anio", str(anio))
    # root.set("noCertificado", "") # Optional/Required depending on signing
    # root.set("Certificado", "")
    
    # Namespaces
    root.set("xmlns:catalogocuentas", NS_CATALOGO)
    root.set("xmlns:xsi", XSI)
    root.set("xsi:schemaLocation", f"{NS_CATALOGO} http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas/CatalogoCuentas_1_3.xsd")

    cuentas = CuentaContable.objects.filter(activo=True).order_by('codigo')
    
    for c in cuentas:
        attr = {
            "CodigoAgrupador": c.codigo_agrupador_sat or "NO_ASIGNADO",
            "NumCta": c.codigo,
            "Desc": c.nombre[:100],
            "Nivel": "1", # Simplificado, debería calcularse nivel real
            "Naturaleza": "D" if c.naturaleza == "DEUDORA" else "A",
        }
        SubElement(root, f"{{{NS_CATALOGO}}}Ctas", attr)
        
    return tostring(root, encoding='utf-8', method='xml')

def generate_balanza_xml(anio: int, mes: int, rfc: str = "XAXX010101000", tipo_envio: str = "N"):
    """
    Genera el XML de la Balanza de Comprobación (v1.3).
    """
    root = Element(f"{{{NS_BALANZA}}}Balanza")
    root.set("Version", "1.3")
    root.set("RFC", rfc)
    root.set("Mes", f"{mes:02d}")
    root.set("Anio", str(anio))
    root.set("TipoEnvio", tipo_envio) # N=Normal, C=Complementaria
    
    # Namespaces
    root.set("xmlns:BCE", NS_BALANZA)
    root.set("xmlns:xsi", XSI)
    root.set("xsi:schemaLocation", f"{NS_BALANZA} http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion/BalanzaComprobacion_1_3.xsd")

    # Obtener movimientos del mes
    # Esto es complejo: Necesitamos Saldo Inicial (acumulado hasta mes anterior) y movimientos del mes.
    # Por ahora, haremos un cálculo "al vuelo" simplificado (Pesado en performance si hay muchos datos).
    # Idealmente, deberíamos tener una tabla "SaldoMensualCuenta".
    
    start_date = date(anio, mes, 1)
    if mes == 12:
         end_date = date(anio + 1, 1, 1)
    else:
         end_date = date(anio, mes + 1, 1)
         
    cuentas = CuentaContable.objects.filter(activo=True, afectable=True)
    
    for c in cuentas:
        # Calcular Saldo Inicial (Todo lo anterior al 1 del mes)
        # Debe - Haber
        si_debe = DetallePoliza.objects.filter(cuenta=c, poliza__fecha__lt=start_date).aggregate(s=Sum('debe'))['s'] or 0
        si_haber = DetallePoliza.objects.filter(cuenta=c, poliza__fecha__lt=start_date).aggregate(s=Sum('haber'))['s'] or 0
        saldo_inicial = si_debe - si_haber # Deudora positive
        
        # Movimientos del mes
        movs = DetallePoliza.objects.filter(cuenta=c, poliza__fecha__range=[start_date, end_date])
        # Rango es inclusivo/inclusivo en Django date range? No, usually. But let's verify logic.
        # Use gte/lt for safety.
        movs = DetallePoliza.objects.filter(cuenta=c, poliza__fecha__gte=start_date, poliza__fecha__lt=end_date)
        
        debe = movs.aggregate(s=Sum('debe'))['s'] or 0
        haber = movs.aggregate(s=Sum('haber'))['s'] or 0
        
        saldo_final = saldo_inicial + debe - haber
        
        # Validar si reportamos cuentas en cero? SAT suele pedir las que tengan saldo o movimiento.
        if saldo_inicial == 0 and debe == 0 and haber == 0 and saldo_final == 0:
            continue

        attr = {
            "NumCta": c.codigo,
            "SaldoIni": f"{saldo_inicial:.2f}",
            "Debe": f"{debe:.2f}",
            "Haber": f"{haber:.2f}",
            "SaldoFin": f"{saldo_final:.2f}",
        }
        SubElement(root, f"{{{NS_BALANZA}}}Ctas", attr)

    return tostring(root, encoding='utf-8', method='xml')
