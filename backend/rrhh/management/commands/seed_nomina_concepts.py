from django.core.management.base import BaseCommand
from rrhh.models_nomina import ConceptoNomina, TipoConcepto

class Command(BaseCommand):
    help = 'Pre-carga los conceptos de nómina estándar del SAT'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando carga de conceptos SAT...")

        # PERCEPCIONES
        percepciones = [
            ("001", "Sueldos, Salarios Rayas y Jornales"),
            ("002", "Gratificación Anual (Aguinaldo)"),
            ("003", "Participación de los Trabajadores en las Utilidades PTU"),
            ("004", "Reembolso de Gastos Médicos Dentales y Hospitalarios"),
            ("005", "Fondo de Ahorro"),
            ("006", "Caja de ahorro"),
            ("009", "Contribuciones a Cargo del Trabajador Pagadas por el Patrón"),
            ("010", "Premios por puntualidad"),
            ("011", "Prima de Seguro de vida"),
            ("012", "Seguro de Gastos Médicos Mayores"),
            ("013", "Cuotas Sindicales Pagadas por el Patrón"),
            ("014", "Subsidios por incapacidad"),
            ("015", "Becas para trabajadores y/o hijos"),
            ("019", "Horas extra"),
            ("020", "Prima dominical"),
            ("021", "Prima vacacional"),
            ("022", "Prima por antigüedad"),
            ("023", "Pagos por separación"),
            ("024", "Seguro de retiro"),
            ("025", "Indemnizaciones"),
            ("026", "Reembolso por funeral"),
            ("027", "Cuotas de seguridad social pagadas por el patrón"),
            ("028", "Comisiones"),
            ("029", "Vales de despensa"),
            ("030", "Vales de restaurante"),
            ("031", "Vales de gasolina"),
            ("032", "Vales de ropa"),
            ("033", "Ayuda para renta"),
            ("034", "Ayuda para artículos escolares"),
            ("035", "Ayuda para anteojos"),
            ("036", "Ayuda para transporte"),
            ("037", "Ayuda para gastos de funeral"),
            ("038", "Otros ingresos por salarios"),
            ("039", "Jubilaciones, pensiones o haberes de retiro"),
            ("044", "Jubilaciones, pensiones o haberes de retiro en parcialidades"),
            ("045", "Ingresos en acciones o títulos valor que representan bienes"),
            ("046", "Ingresos asimilados a salarios"),
            ("047", "Alimentación"),
            ("048", "Habitación"),
            ("049", "Premios por asistencia"),
            ("050", "Viáticos"),
            ("051", "Pagos por retiro"),
            ("052", "Registro patronal"),
            ("053", "Pagos realizados a trabajadores jubilados"),
        ]

        # DEDUCCIONES
        deducciones = [
            ("001", "Seguridad social (IMSS)"),
            ("002", "ISR"),
            ("003", "Aportaciones a retiro, cesantía en edad avanzada y vejez"),
            ("004", "Otros"),
            ("005", "Aportaciones a Fondo de vivienda"),
            ("006", "Descuento por incapacidad"),
            ("007", "Pension alimenticia"),
            ("008", "Renta"),
            ("009", "Préstamos provenientes del Fondo Nacional de la Vivienda para los Trabajadores"),
            ("010", "Pago por crédito de vivienda"),
            ("011", "Pago de abonos Infonavit"),
            ("012", "Anticipo de salarios"),
            ("013", "Pagos hechos con exceso al trabajador"),
            ("014", "Errores"),
            ("015", "Pérdidas"),
            ("016", "Averías"),
            ("017", "Adquisición de artículos producidos por la empresa o establecimiento"),
            ("018", "Cuotas para la constitución y fomento de sociedades cooperativas y de cajas de ahorro"),
            ("019", "Cuotas sindicales"),
            ("020", "Ausencia (Ausentismo)"),
            ("021", "Cuotas obrero patronales"),
            ("022", "Impuestos Locales"),
            ("023", "Aportaciones voluntarias"),
            ("024", "Ajuste en Gratificación Anual (Aguinaldo) Exento"),
            ("025", "Ajuste en Gratificación Anual (Aguinaldo) Gravado"),
            ("026", "Ajuste en Participación de los Trabajadores en las Utilidades PTU Exento"),
            ("027", "Ajuste en Participación de los Trabajadores en las Utilidades PTU Gravado"),
            ("028", "Ajuste en Reembolso de Gastos Médicos Dentales y Hospitalarios Exento"),
            ("029", "Ajuste en Fondo de ahorro Exento"),
            ("030", "Ajuste en Caja de ahorro Exento"),
            ("071", "Ajuste en Subsidio para el empleo (efectivamente entregado al trabajador)"),
        ]

        # OTROS PAGOS
        otros_pagos = [
            ("001", "Reintegro de ISR pagado en exceso"),
            ("002", "Subsidio para el empleo (efectivamente entregado al trabajador)"),
            ("003", "Viáticos (entregados al trabajador)"),
            ("004", "Aplicación de saldo a favor por compensación anual"),
            ("005", "Reintegro de ISR retenido en exceso de ejercicio anterior"),
            ("006", "Alimentos en bienes (Servicios de comedor y comida)"),
            ("007", "ISR ajustado por subsidio"),
            ("008", "Subsidio efectivamente entregado que no correspondía"),
            ("009", "Reembolso de descuentos efectuados para el crédito de vivienda"),
            ("999", "Pagos distintos a los listados y que no deben considerarse como ingreso por sueldos, salarios o ingresos asimilados")
        ]

        for clave, nombre in percepciones:
            ConceptoNomina.objects.get_or_create(
                clave_sat=clave,
                tipo=TipoConcepto.PERCEPCION,
                defaults={'nombre': nombre, 'codigo': f"P-{clave}"}
            )

        for clave, nombre in deducciones:
            ConceptoNomina.objects.get_or_create(
                clave_sat=clave,
                tipo=TipoConcepto.DEDUCCION,
                defaults={'nombre': nombre, 'codigo': f"D-{clave}"}
            )
            
        for clave, nombre in otros_pagos:
            ConceptoNomina.objects.get_or_create(
                clave_sat=clave,
                tipo=TipoConcepto.OTRO_PAGO,
                defaults={'nombre': nombre, 'codigo': f"O-{clave}"}
            )

        self.stdout.write(self.style.SUCCESS("Conceptos de Nómina SAT cargados exitosamente."))
