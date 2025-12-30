from decimal import Decimal

class DIOTService:
    @staticmethod
    def generar_linea_proveedor(pago):
        prov = pago.proveedor
        monto = pago.monto
        tasa = pago.tasa_iva
        
        # Calcular Base (Asumiendo monto incluye IVA)
        if tasa > 0:
            base = monto / (1 + tasa)
        else:
            base = monto
            
        base_int = int(round(base, 0))
        
        # Columnas
        c1_tipo_tercero = prov.tipo_tercero
        c2_tipo_oper = prov.tipo_operacion
        c3_rfc = prov.rfc
        c4_id_fiscal = getattr(prov, 'id_fiscal', '')
        # Nombre solo para Extranjeros (05)
        c5_nombre = getattr(prov, 'nombre_completo', '') if c1_tipo_tercero == '05' else ''
        c6_pais = getattr(prov, 'pais', '') if c1_tipo_tercero == '05' else ''
        c7_nacionalidad = getattr(prov, 'nacionalidad', '') if c1_tipo_tercero == '05' else ''
        
        # Asignación de columnas de montos
        # Indices A-29 (0-based en array):
        # 7: Valor 15/16%
        # 8: Valor 15/16% Imp
        # 9: Valor 10/8% 
        # 10: Valor 10/8% Imp
        # 11: Valor 0%
        # 12: Exento
        
        c8_base16 = ''
        c11_base0 = ''
        
        if tasa == Decimal('0.16'):
            c8_base16 = str(base_int)
        elif tasa == 0:
            c11_base0 = str(base_int)
            
        cols = [
            c1_tipo_tercero, c2_tipo_oper, c3_rfc, c4_id_fiscal, c5_nombre, c6_pais, c7_nacionalidad,
            c8_base16, # 7
            '',        # 8
            '',        # 9
            '',        # 10
            c11_base0, # 11
            '', '', '', '', '', '', '', '', '', '', '' # Filler to 24
        ]
        
        return "|".join(cols)

    @staticmethod
    def generar_reporte(pagos):
        lines = []
        for pago in pagos:
            lines.append(DIOTService.generar_linea_proveedor(pago))
        return "\r\n".join(lines)
