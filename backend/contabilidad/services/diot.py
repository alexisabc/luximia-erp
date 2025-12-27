from decimal import Decimal
from django.db.models import Sum
from contabilidad.models import Pago, Vendedor

def generate_diot_txt(start_date, end_date):
    """
    Genera el contenido del archivo DIOT (TXT pipe separated).
    Formato simplificado:
    TipoTercero|TipoOperacion|RFC|IDFiscal|Nombre|Pais|Nacionalidad|IVAPagadoNoAcreditable|IVAPagado|...
    
    Layout DIOT 2019/2024 (Simplificado para MVP):
    1. Tipo Tercero (04, 05, 15)
    2. Tipo Operacion (03, 06, 85)
    3. RFC
    4. ID Fiscal (Extranjeros, vacío si nac)
    5. Nombre Extranjero (vacío si nac)
    6. País (vacío si nac)
    7. Nacionalidad (vacío si nac)
    8. Valor actos tasa 15% o 16% (Monto base) -> ESTO ES LO QUE SE REPORTA, LA BASE, NO EL IVA
    9. Valor actos tasa 15% o 16% (Monto base, importación)
    10. Valor actos tasa 10% or 8% (Frontera)
    ...
    """
    
    # 1. Obtener Pagos de Egresos en el periodo
    # Asumimos que Pago.tipo_pago='PAGO' o 'EGRESO' y que está ligado a un Proveedor.
    # El modelo actual de Pago está ligado a Contrato (Ventas). 
    # NECESITAMOS PAGOS A PROVEEDORES.
    # El modelo actual parece estar diseñado para "Cuentas por Cobrar" (Real Estate Sales).
    # Para Proveedores, usualmente necesitamos un modelo "PagoProveedor" o ligar Polizas.
    
    # WORKAROUND MVP:
    # Usaremos "Poliza type=EGRESO" para detectar pagos a proveedores si no existe modelo específico.
    # O, para este ejercicio, simularemos con datos dummy si no hay modelo de CxP.
    
    # Revision rapida de modelos: No hay "CxP" o "Spending" explícito mas que Polizas.
    # Usaremos Polizas de Egreso y DetallePoliza para agrupar por RFC (si lo extraemos del asiento).
    
    lines = []
    
    # Mock data generation based on Vendedor model updates
    # En un sistema real, haríamos query a Polizas -> Cuentas de Proveedores -> Vendedor
    
    proveedores = Vendedor.objects.filter(activo=True)
    
    for prov in proveedores:
        # Calcular monto base pagado en el periodo (Simulado por falta de modulo compras completo)
        # En prod: Query SUM(DetallePoliza.debe) where cuenta__codigo=prov.cuenta_contable and fecha in range
        monto_base_16 = Decimal(0)
        
        # Simulación: Si tienen RFC, asumimos un monto dummy para probar el formato
        if prov.rfc == 'XAXX010101000':
            monto_base_16 = Decimal("1000.00")
            
        if monto_base_16 == 0:
            continue
            
        # Construir línea
        # Campo 8: Valor de los actos o actividades pagados a la tasa del 15% o 16% de IVA
        col_8 = str(int(round(monto_base_16, 0))) # DIOT usually asks for rounded integers abt base
        
        line = f"{prov.tipo_tercero}|{prov.tipo_operacion}|{prov.rfc or ''}|||||{col_8}||||||||||||"
        lines.append(line)
        
    return "\r\n".join(lines)
