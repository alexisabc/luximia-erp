"""
Catálogo de motivos de cancelación SAT
"""

MOTIVOS_CANCELACION = {
    '01': {
        'codigo': '01',
        'descripcion': 'Comprobante emitido con errores con relación',
        'requiere_sustitucion': True
    },
    '02': {
        'codigo': '02',
        'descripcion': 'Comprobante emitido con errores sin relación',
        'requiere_sustitucion': False
    },
    '03': {
        'codigo': '03',
        'descripcion': 'No se llevó a cabo la operación',
        'requiere_sustitucion': False
    },
    '04': {
        'codigo': '04',
        'descripcion': 'Operación nominativa relacionada en una factura global',
        'requiere_sustitucion': False
    }
}


def get_motivo_cancelacion(codigo: str) -> dict:
    """
    Obtiene información de un motivo de cancelación
    
    Args:
        codigo: Código del motivo (01-04)
        
    Returns:
        dict: Información del motivo o None si no existe
    """
    return MOTIVOS_CANCELACION.get(codigo)


def get_all_motivos() -> list:
    """
    Obtiene todos los motivos de cancelación
    
    Returns:
        list: Lista de motivos
    """
    return list(MOTIVOS_CANCELACION.values())
