from decimal import Decimal
from django.utils import timezone
from .models import Poliza, DetallePoliza, Factura, CuentaContable
from .models_automation import PlantillaAsiento, ReglaAsiento

def generar_poliza_from_factura(factura: Factura, plantilla: PlantillaAsiento, user=None) -> Poliza:
    """
    Genera una Póliza (borrador) basada en una Factura y una Plantilla.
    """
    
    # 1. Crear Cabecera (Poliza)
    # Parsear concepto
    concepto = plantilla.concepto_patron.format(
        serie=factura.serie or '',
        folio=factura.folio or '',
        receptor=factura.receptor_nombre or '',
        emisor=factura.emisor_nombre or '',
        uuid=factura.uuid or ''
    )
    
    # Mapeo de tipo de póliza
    tipo_map = {
        'PROVISION': 'DIARIO',
        'INGRESO': 'INGRESO',
        'EGRESO': 'EGRESO'
    }
    
    poliza = Poliza.objects.create(
        fecha=factura.fecha_emision.date(), # Usamos fecha factura por defecto
        tipo=tipo_map.get(plantilla.tipo_poliza, 'DIARIO'),
        numero=9999, # Placeholder, se debería calcular consecutivo
        concepto=concepto[:255],
        origen_modulo='FACTURACION',
        origen_id=str(factura.uuid),
        # user=user (si tuvisaramos campo de usuario)
    )
    
    # 2. Generar Detalles (Partidas)
    total_debe = Decimal(0)
    total_haber = Decimal(0)
    
    reglas = plantilla.reglas.all().order_by('orden')
    
    for regla in reglas:
        monto = Decimal(0)
        
        # Calcular monto según origen (en moneda original)
        if regla.origen_dato == 'TOTAL':
            monto = factura.total
        elif regla.origen_dato == 'SUBTOTAL':
            monto = factura.subtotal
        elif regla.origen_dato == 'IVA_16':
            monto = factura.impuestos_trasladados
        elif regla.origen_dato == 'IVA_RET':
            monto = factura.impuestos_retenidos
            
        # --- Multi-Currency Logic ---
        # Convert to Accounting Currency (MXN) if needed
        # Assuming Poliza is always in local currency (MXN)
        if factura.moneda and factura.moneda.codigo != 'MXN':
            # Use stored exchange rate from Factura
            tc = factura.tipo_cambio if factura.tipo_cambio and factura.tipo_cambio > 0 else Decimal(1)
            monto = monto * tc
            # Rounding to 2 decimals for accounting
            monto = monto.quantize(Decimal('0.01'))
            
        if monto <= 0:
            continue
            
        detalle = DetallePoliza(
            poliza=poliza,
            cuenta=regla.cuenta_base, # Fase 1: Directo a cuenta base. Fase 2: Resolver por Cliente/Prov
            concepto=concepto[:200], # Repetimos concepto de cabecera por simplicidad
            referencia=f"UUID: {factura.uuid}"[:50]
        )
        
        if regla.tipo_movimiento == 'CARGO':
            detalle.debe = monto
            detalle.haber = 0
            total_debe += monto
        else:
            detalle.debe = 0
            detalle.haber = monto
            total_haber += monto
            
        detalle.save()
        
    # 3. Actualizar Totales Cabecera
    poliza.total_debe = total_debe
    poliza.total_haber = total_haber
    poliza.cuadrada = (total_debe == total_haber)
    poliza.save()
    
    return poliza
