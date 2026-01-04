from decimal import Decimal
from django.db.models import Sum
from tesoreria.models.movimientos import Egreso

class DiotService:
    @staticmethod
    def generar_reporte(anio, mes):
        """
        Genera el reporte de operaciones con terceros (DIOT).
        Retorna una lista de diccionarios agrupados por Proveedor.
        """
        egresos = Egreso.objects.filter(
            fecha__year=anio,
            fecha__month=mes,
            estado='PAGADO',
            contra_recibo__isnull=False
        ).select_related('contra_recibo', 'contra_recibo__proveedor')
        
        reporte = {}
        
        for egreso in egresos:
            cr = egreso.contra_recibo
            prov = cr.proveedor
            rfc = prov.rfc
            
            if not rfc:
                continue # Skip providers without RFC (Should alert user)
                
            if rfc not in reporte:
                reporte[rfc] = {
                    'tipo_tercero': '04', # 04: Nacional, 05: Extranjero
                    'tipo_operacion': '85', # 85: Otros (Default)
                    'rfc': rfc,
                    'monto_base_16': Decimal('0.00'),
                    'monto_iva': Decimal('0.00')
                }
            
            # Proporcionamiento (Cash Basis)
            # Si el pago es parcial, el IVA acreditable es proporcional
            total_cr = cr.total
            if total_cr == 0: continue
            
            proporcion = egreso.monto / total_cr
            
            # Asumimos Tasa 16% por defecto si hay IVA
            # En un sistema complejo, ContraRecibo debería tener desglose de tasas
            iva_pagado = cr.iva * proporcion
            base_pagada = egreso.monto - iva_pagado
            
            reporte[rfc]['monto_base_16'] += base_pagada
            reporte[rfc]['monto_iva'] += iva_pagado
            
        return list(reporte.values())

    @staticmethod
    def generar_txt(anio, mes):
        data = DiotService.generar_reporte(anio, mes)
        lines = []
        
        for item in data:
            # Formato A-29 (Simplificado)
            # |TipoTercero|TipoOperacion|RFC|IDFiscal|NombreExt|Pais|Nacionalidad|Base15|Base10|Base16|...
            
            base_16 = int(round(item['monto_base_16'])) # DIOT usa enteros redondeados
            
            # Campos vacíos representan tasas no usadas (0%, 8%, Exento, etc)
            line = (
                f"{item['tipo_tercero']}|"
                f"{item['tipo_operacion']}|"
                f"{item['rfc']}|"
                f"|||" # ID Fiscal, Nombre, Pais, Nacionalidad (Para extranjeros)
                f"|||" # Zonas fronterizas viejas
                f"{base_16}|" # Valor de los actos o actividades pagados a la tasa del 16% de IVA
                f"||||||||||||" # Resto de columnas (0%, exento, retenciones, etc)
            )
            lines.append(line)
            
        return "\n".join(lines)
