from decimal import Decimal
from django.db.models import Sum, Q
from contabilidad.models import CuentaContable, Poliza, DetallePoliza
from datetime import date

class ReporteFinancieroService:
    """
    Servicio para generar estados financieros básicos:
    1. Balanza de Comprobación
    2. Estado de Resultados
    3. Balance General
    """

    @staticmethod
    def obtener_balanza_comprobacion(fecha_inicio, fecha_fin):
        """
        Retorna una lista de cuentas con sus movimientos y saldos en el rango.
        """
        cuentas = CuentaContable.objects.filter(afectable=True).order_by('codigo')
        data = []

        for cuenta in cuentas:
            # Calcular saldos iniciales (antes del rango)
            movs_previos = DetallePoliza.objects.filter(
                cuenta=cuenta,
                poliza__fecha__lt=fecha_inicio,
                poliza__deleted_at__isnull=True
            ).aggregate(
                debe=Sum('debe', default=Decimal(0)),
                haber=Sum('haber', default=Decimal(0))
            )

            # Naturaleza: Deudora (Saldo = Debe - Haber), Acreedora (Saldo = Haber - Debe)
            saldo_inicial = 0
            if cuenta.naturaleza == 'DEUDORA':
                saldo_inicial = movs_previos['debe'] - movs_previos['haber']
            else:
                saldo_inicial = movs_previos['haber'] - movs_previos['debe']

            # Movimientos del periodo
            movs_periodo = DetallePoliza.objects.filter(
                cuenta=cuenta,
                poliza__fecha__range=(fecha_inicio, fecha_fin),
                poliza__deleted_at__isnull=True
            ).aggregate(
                debe=Sum('debe', default=Decimal(0)),
                haber=Sum('haber', default=Decimal(0))
            )
            
            debe_periodo = movs_periodo['debe'] or Decimal(0)
            haber_periodo = movs_periodo['haber'] or Decimal(0)

            # Saldo Final
            saldo_final = 0
            if cuenta.naturaleza == 'DEUDORA':
                saldo_final = saldo_inicial + debe_periodo - haber_periodo
            else:
                saldo_final = saldo_inicial + haber_periodo - debe_periodo
            
            # Solo agregar si tiene movimientos o saldo
            if saldo_inicial != 0 or debe_periodo != 0 or haber_periodo != 0:
                data.append({
                    "codigo": cuenta.codigo,
                    "nombre": cuenta.nombre,
                    "saldo_inicial": saldo_inicial,
                    "debe": debe_periodo,
                    "haber": haber_periodo,
                    "saldo_final": saldo_final
                })

        return data

    @staticmethod
    def obtener_estado_resultados(fecha_inicio, fecha_fin):
        """
        Ingresos vs Costos/Gastos.
        """
        cuentas_ingresos = ReporteFinancieroService._get_saldo_cuentas_tipo('INGRESOS', fecha_inicio, fecha_fin)
        cuentas_costos = ReporteFinancieroService._get_saldo_cuentas_tipo('COSTOS', fecha_inicio, fecha_fin)
        cuentas_gastos = ReporteFinancieroService._get_saldo_cuentas_tipo('GASTOS', fecha_inicio, fecha_fin)

        total_ingresos = sum(c['saldo'] for c in cuentas_ingresos)
        total_costos = sum(c['saldo'] for c in cuentas_costos)
        total_gastos = sum(c['saldo'] for c in cuentas_gastos)
        
        utilidad_bruta = total_ingresos - total_costos
        utilidad_neta = utilidad_bruta - total_gastos

        return {
            "ingresos": cuentas_ingresos,
            "costos": cuentas_costos,
            "gastos": cuentas_gastos,
            "resumen": {
                "total_ingresos": total_ingresos,
                "total_costos": total_costos,
                "total_gastos": total_gastos,
                "utilidad_bruta": utilidad_bruta,
                "utilidad_neta": utilidad_neta
            }
        }

    @staticmethod
    def obtener_balance_general(fecha_corte):
        """
        Activo, Pasivo y Capital a una fecha de corte.
        """
        # Para Balance General tomamos movimientos desde el inicio de los tiempos hasta fecha_corte
        fecha_inicio_historia = date(2000, 1, 1)

        cuentas_activo = ReporteFinancieroService._get_saldo_cuentas_tipo('ACTIVO', fecha_inicio_historia, fecha_corte)
        cuentas_pasivo = ReporteFinancieroService._get_saldo_cuentas_tipo('PASIVO', fecha_inicio_historia, fecha_corte)
        cuentas_capital = ReporteFinancieroService._get_saldo_cuentas_tipo('CAPITAL', fecha_inicio_historia, fecha_corte)

        total_activo = sum(c['saldo'] for c in cuentas_activo)
        total_pasivo = sum(c['saldo'] for c in cuentas_pasivo)
        total_capital = sum(c['saldo'] for c in cuentas_capital)

        # La utilidad del ejercicio actual debe calcularse y sumarse al capital para cuadrar
        # (Esto es simplificado, idealmente viene de la cuenta de resultado de ejercicio)
        
        return {
            "activo": cuentas_activo,
            "pasivo": cuentas_pasivo,
            "capital": cuentas_capital,
            "resumen": {
                "total_activo": total_activo,
                "total_pasivo": total_pasivo,
                "total_capital": total_capital,
                "cuadre": total_activo - (total_pasivo + total_capital)
            }
        }

    @staticmethod
    def _get_saldo_cuentas_tipo(tipo_cuenta, fecha_inicio, fecha_fin):
        """
        Helper para obtener saldos de todas las cuentas de un tipo (ej. ACTIVO) en un rango.
        """
        cuentas = CuentaContable.objects.filter(tipo=tipo_cuenta, afectable=True)
        resultado = []
        
        for cuenta in cuentas:
            movs = DetallePoliza.objects.filter(
                cuenta=cuenta,
                poliza__fecha__range=(fecha_inicio, fecha_fin),
                poliza__deleted_at__isnull=True,
                poliza__cuadrada=True # Solo considerar polizas cuadradas/validas?
            ).aggregate(
                debe=Sum('debe', default=Decimal(0)),
                haber=Sum('haber', default=Decimal(0))
            )
            
            saldo = 0
            if cuenta.naturaleza == 'DEUDORA':
                saldo = movs['debe'] - movs['haber']
            else:
                saldo = movs['haber'] - movs['debe']
            
            if saldo != 0:
                resultado.append({
                    "codigo": cuenta.codigo,
                    "nombre": cuenta.nombre,
                    "saldo": saldo
                })
        
        return resultado
