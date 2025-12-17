from django.core.management.base import BaseCommand
from django.db import transaction
from rrhh.models import (
    ConfiguracionEconomica, TablaISR, RenglonTablaISR, ConceptoNomina, 
    TipoConcepto, ClasificacionFiscal
)
from decimal import Decimal

class Command(BaseCommand):
    help = "Carga la configuración inicial de Nómina para 2025 (Tablas ISR, UMA, Conceptos)"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando carga de catálogos de nómina 2025...")

        with transaction.atomic():
            self.crear_configuracion_economica()
            self.crear_tablas_isr()
            self.crear_conceptos_base()

        self.stdout.write(self.style.SUCCESS("¡Configuración de nómina 2025 cargada exitosamente!"))

    def crear_configuracion_economica(self):
        # Valores Proyectados/Reales 2025 (Ejemplo)
        # Ajustar con valores oficiales del DOF cuando se publiquen
        ConfiguracionEconomica.objects.update_or_create(
            anio=2025,
            defaults={
                "valor_uma": Decimal("108.57"), # Valor 2024 ref
                "valor_umi": Decimal("100.81"),
                "salario_minimo_general": Decimal("248.93"),
                "salario_minimo_frontera": Decimal("374.89"),
                "cuota_fija_imss_patron": Decimal("20.40"),
            }
        )
        self.stdout.write("- Indicadores Económicos actualizados.")

    def crear_tablas_isr(self):
        # Borrar tablas anteriores del mismo periodo para evitar duplicados en seed
        TablaISR.objects.filter(anio_vigencia=2025, tipo_periodo='MENSUAL').delete()

        tabla_mensual = TablaISR.objects.create(
            anio_vigencia=2025,
            tipo_periodo='MENSUAL',
            descripcion="Tarifa ISR Mensual 2025 (Estándar)"
        )

        rangos = [
            # LimiteInf, LimiteSup, CuotaFija, %Excedente
            (0.01, 746.04, 0.00, 1.92),
            (746.05, 6332.05, 14.32, 6.40),
            (6332.06, 11128.01, 371.83, 10.88),
            (11128.02, 12935.82, 893.63, 16.00),
            (12935.83, 15487.71, 1182.88, 17.92),
            (15487.72, 31236.49, 1640.18, 21.36),
            (31236.50, 49233.00, 5004.12, 23.52),
            (49233.01, 93993.90, 9236.89, 30.00),
            (93993.91, 125325.20, 22665.17, 32.00),
            (125325.21, 375975.61, 32691.18, 34.00),
            (375975.62, None, 117912.32, 35.00),
        ]

        for inf, sup, cuota, porc in rangos:
            RenglonTablaISR.objects.create(
                tabla=tabla_mensual,
                limite_inferior=Decimal(str(inf)),
                limite_superior=Decimal(str(sup)) if sup else None,
                cuota_fija=Decimal(str(cuota)),
                porcentaje_excedente=Decimal(str(porc))
            )

        # Clonar para Quincenal (Dividiendo entre 2 aprox para MVP, idealmente usar tabla oficial quincenal)
        # Ojo: En calculo real se suele mensualizar el ingreso, calcular impuesto mensual y dividir entre 2.
        # Pero para efectos de este seed, dejamos solo la mensual como referencia.
        
        self.stdout.write("- Tabla ISR Mensual 2025 creada.")

    def crear_conceptos_base(self):
        conceptos = [
            ("P001", "Sueldo", TipoConcepto.PERCEPCION, ClasificacionFiscal.SUELDO, True, True),
            ("P002", "Aguinaldo", TipoConcepto.PERCEPCION, ClasificacionFiscal.GRATIFICACION_ANUAL, True, False),
            ("D001", "ISR Retenido", TipoConcepto.DEDUCCION, ClasificacionFiscal.ISR, False, False),
            ("D002", "IMSS Obrero", TipoConcepto.DEDUCCION, ClasificacionFiscal.IMSS, False, False),
        ]

        for codigo, nombre, tipo, clave_sat, isr, imss in conceptos:
            ConceptoNomina.objects.update_or_create(
                codigo=codigo,
                defaults={
                    "nombre": nombre,
                    "tipo": tipo,
                    "clave_sat": clave_sat,
                    "es_fiscal": True,
                    "grava_isr": isr,
                    "grava_imss": imss
                }
            )
        self.stdout.write("- Conceptos de Nómina base creados.")
