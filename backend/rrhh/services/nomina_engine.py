from decimal import Decimal
import logging
from ..models.asistencia import Asistencia, TipoIncidencia

logger = logging.getLogger(__name__)

class NominaEngine:
    @staticmethod
    def calcular_prenomina(empleado, fecha_inicio, fecha_fin):
        """
        Calcula el desglose de nómina para un empleado basado en asistencias reales.
        Retorna: {sueldo_bruto, isr, imss, neto, percepciones, deducciones}
        """
        try:
            datos_laborales = getattr(empleado, 'datos_laborales', None)
            if not datos_laborales:
                raise ValueError(f"Empleado {empleado} no tiene datos laborales configurados.")

            # 0. Conteo de días trabajados
            asistencias = Asistencia.objects.filter(
                empleado=empleado,
                fecha__range=(fecha_inicio, fecha_fin)
            )
            
            # Días pagados: ASISTENCIA + VACACIONES
            dias_pagados = asistencias.filter(
                incidencia__in=[TipoIncidencia.ASISTENCIA, TipoIncidencia.VACACIONES]
            ).count()

            sd = datos_laborales.salario_diario or Decimal('0.00')
            sdi = datos_laborales.salario_diario_integrado or sd

            # 1. Sueldo Bruto
            sueldo_bruto = (sd * Decimal(str(dias_pagados))).quantize(Decimal('0.01'))

            # 2. IMSS Obrero (Simplificado)
            imss_obrero = (sdi * Decimal(str(dias_pagados)) * Decimal('0.02375')).quantize(Decimal('0.01'))

            # 3. ISR
            base_gravable = sueldo_bruto
            isr = NominaEngine._calcular_isr_2025_quincenal(base_gravable)

            neto = sueldo_bruto - imss_obrero - isr

            return {
                "empleado": str(empleado),
                "rango": f"{fecha_inicio} a {fecha_fin}",
                "dias_pagados": dias_pagados,
                "salario_diario": float(sd),
                "sueldo_bruto": float(sueldo_bruto),
                "retenciones": {
                    "isr": float(isr),
                    "imss": float(imss_obrero)
                },
                "percepciones": [
                    {"nombre": "Sueldo", "monto": float(sueldo_bruto), "tipo": "PERCEPCION"}
                ],
                "deducciones": [
                    {"nombre": "ISR", "monto": float(isr), "tipo": "DEDUCCION"},
                    {"nombre": "IMSS", "monto": float(imss_obrero), "tipo": "DEDUCCION"}
                ],
                "total_percepciones": float(sueldo_bruto),
                "total_deducciones": float(isr + imss_obrero),
                "neto_pagar": float(neto)
            }
        except Exception as e:
            logger.error(f"Error en NominaEngine: {e}")
            raise

    @staticmethod
    def _calcular_isr_2025_quincenal(base):
        """
        Algoritmo simplificado basado en límites de la tabla ISR Quincenal 2025.
        """
        # Rangos aproximados 2025 (Basados en ajuste inflacionario esperado)
        # Limite Inferior | Cuota Fija | % Excedente
        tablas = [
            (Decimal('0.01'), Decimal('0.00'), Decimal('0.0192')),
            (Decimal('423.01'), Decimal('8.12'), Decimal('0.0640')),
            (Decimal('3590.26'), Decimal('210.83'), Decimal('0.1088')),
            (Decimal('6309.91'), Decimal('506.58'), Decimal('0.1600')),
            (Decimal('7334.86'), Decimal('670.57'), Decimal('0.1792')),
            (Decimal('8782.36'), Decimal('930.01'), Decimal('0.2136')),
            (Decimal('17702.86'), Decimal('2835.48'), Decimal('0.2352')),
            (Decimal('27902.11'), Decimal('5234.40'), Decimal('0.3000')),
            (Decimal('37202.86'), Decimal('8024.62'), Decimal('0.3200')),
            (Decimal('71025.01'), Decimal('18847.71'), Decimal('0.3400')),
            (Decimal('213075.01'), Decimal('67144.71'), Decimal('0.3500')),
        ]

        # Encontrar el renglón
        renglon_aplicable = tablas[0]
        for t in tablas:
            if base >= t[0]:
                renglon_aplicable = t
            else:
                break

        excedente = base - renglon_aplicable[0]
        impuesto = (excedente * renglon_aplicable[2]) + renglon_aplicable[1]
        return impuesto.quantize(Decimal('0.01'))
