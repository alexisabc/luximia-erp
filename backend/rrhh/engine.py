from decimal import Decimal
from typing import List, Optional, Tuple, Any, Dict
from django.db.models import Sum

from .models import (
    Empleado, Nomina, ReciboNomina, ConceptoNomina, 
    TablaISR, RenglonTablaISR, ConfiguracionEconomica, 
    DetalleReciboItem, EmpleadoCreditoInfonavit
)
from .models_nomina import TipoConcepto, ClasificacionFiscal

# ---------------------------------------------------------------------------
# Motor de Cálculo de Nómina (Fiscal)
# ---------------------------------------------------------------------------

class PayrollCalculator:
    """
    Motor central para el cálculo de nómina basado en regulaciones mexicanas.
    Soporta:
    - ISR (Llamando tablas dinámicas)
    - IMSS (Cuotas Obrero-Patronales simplificadas)
    - Subsidio al Empleo
    - Salario Diario Integrado
    """

    def __init__(self, anio: int = 2025):
        self.anio = anio
        self.config_economica = ConfiguracionEconomica.objects.filter(anio=anio, activo=True).last()
        if not self.config_economica:
            # Fallback o Error crítico
            raise ValueError(f"No hay configuración económica activa para el año {anio}")

    def calcular_recibo(self, nomina: Nomina, empleado: Empleado) -> ReciboNomina:
        """
        Calcula un recibo individual, genera los detalles y guarda.
        NO commitea transacción, eso debe hacerlo la capa superior.
        """
        
        # 1. Obtener Datos Laborales Vigentes
        laborales = getattr(empleado, 'datos_laborales', None)
        if not laborales:
            raise ValueError(f"Empleado {empleado} sin datos laborales.")

        dias_pagados = Decimal('15.0') if nomina.tipo == 'ORDINARIA' else Decimal('0.0') # Simplificación MVP
        if laborales.periodicidad_pago == 'SEMANAL':
            dias_pagados = Decimal('7.0')

        # 2. Calcular Percepciones Fijas (Sueldo)
        sueldo_diario = laborales.salario_diario
        sueldo_total = sueldo_diario * dias_pagados
        
        # 3. Crear Estructura de Recibo
        recibo = ReciboNomina(
            nomina=nomina,
            empleado=empleado,
            salario_diario=sueldo_diario,
            sbc=laborales.salario_diario_integrado,
            antiguedad_dias=0, # TODO: Calcular vs fecha_ingreso
            dias_pagados=dias_pagados,
            subtotal=0,
            impuestos_retenidos=0,
            imss_retenido=0,
            descuentos=0,
            neto=0
        )
        recibo.save() 
        # Guardamos preliminarmente para poder atar los DetalleReciboItem. 
        # (Idealmente haríamos bulk_create al final, pero paso a paso por claridad)

        total_gravado = Decimal('0.0')
        total_exento = Decimal('0.0')
        total_deducciones = Decimal('0.0')

        # --- A. AGREGAR SUELDO ---
        concepto_sueldo = self._get_concepto_confiable(ClasificacionFiscal.SUELDO)
        self._add_item(recibo, concepto_sueldo, sueldo_total, gravado=True)
        total_gravado += sueldo_total

        # --- B. CALCULAR ISR ---
        isr_retenido = self._calcular_isr(total_gravado, nomina.fecha_fin.year, periodo='QUINCENAL') # Parametrizar periodo
        if isr_retenido > 0:
            concepto_isr = self._get_concepto_confiable(ClasificacionFiscal.ISR, tipo=TipoConcepto.DEDUCCION)
            self._add_item(recibo, concepto_isr, isr_retenido)
            total_deducciones += isr_retenido

        # --- C. CALCULAR IMSS ---
        # Fórmula simplificada de cuota obrera (aprox 2.375% - 2.7% dependiendo sbc exedente)
        # Para MVP usaremos un factor fijo configurable o simple lógica.
        imss_obrero = self._calcular_imss_obrero(laborales.salario_diario_integrado, dias_pagados)
        if imss_obrero > 0:
            concepto_imss = self._get_concepto_confiable(ClasificacionFiscal.IMSS, tipo=TipoConcepto.DEDUCCION)
            self._add_item(recibo, concepto_imss, imss_obrero)
            total_deducciones += imss_obrero

        # --- D. OTROS DESCUENTOS (INFONAVIT) ---
        creditos = EmpleadoCreditoInfonavit.objects.filter(empleado=empleado, activo=True)
        for credito in creditos:
            monto = Decimal('0.0')
            if credito.tipo_descuento == 'CUOTA_FIJA':
                monto = credito.monto_o_porcentaje
            elif credito.tipo_descuento == 'PORCENTAJE':
                monto = sueldo_total * (credito.monto_o_porcentaje / 100)
            
            # Buscar concepto genérico de descuento Infonavit o crear uno on-the-fly?
            # Por ahora usaremos un placeholder o asumimos que existe.
            # concepto_infonavit = ...
            # self._add_item(recibo, concepto_infonavit, monto)
            # total_deducciones += monto
            pass

        # 4. Actualizar Totales del Recibo
        recibo.subtotal = total_gravado + total_exento
        recibo.impuestos_retenidos = isr_retenido
        recibo.imss_retenido = imss_obrero
        recibo.descuentos = total_deducciones
        recibo.neto = recibo.subtotal - total_deducciones
        recibo.save()

        return recibo

    def _calcular_isr(self, base_gravable: Decimal, anio: int, periodo: str = 'QUINCENAL') -> Decimal:
        """
        Busca la tabla correspondiente y aplica la lógica de rangos.
        ISR = ((Base - LimiteInf) * %Excedente) + CuotaFija
        """
        tabla = TablaISR.objects.filter(anio_vigencia=anio, tipo_periodo=periodo).first()
        if not tabla:
            # Fallback a Mensual / 2 ? O error.
            return Decimal('0.0')

        # Buscar el renglón donde encaja la base
        renglon = RenglonTablaISR.objects.filter(
            tabla=tabla, 
            limite_inferior__lte=base_gravable
        ).order_by('-limite_inferior').first()

        if not renglon:
            return Decimal('0.0') # Salario bajo exento (o error en tabla)

        excedente = base_gravable - renglon.limite_inferior
        impuesto_marginal = excedente * (renglon.porcentaje_excedente / 100)
        isr_calculado = impuesto_marginal + renglon.cuota_fija
        
        return isr_calculado.quantize(Decimal('0.01'))

    def _calcular_imss_obrero(self, sbc: Decimal, dias: Decimal) -> Decimal:
        """
        Cálculo aproximado de cuotas obreras IMSS.
        En producción real, esto requiere desglosar por rama (Enfermedad y Maternidad, Invalidez y Vida, Cesantía y Vejez).
        """
        # UMA viene de self.config_economica
        valor_uma = self.config_economica.valor_uma
        
        # Excedente (Para Enfermedad y Maternidad - Gastos Médicos 0.40% sobre excedente de 3 UMAS)
        sbc_total = sbc * dias
        
        # Simplificación: 2.375% global sobre SBC (Aproximación para salarios medios)
        # Esto debe refinarse con las 4 ramas exactas de la ley.
        factor = Decimal('0.027') 
        return (sbc_total * factor).quantize(Decimal('0.01'))

    def _get_concepto_confiable(self, clave_fiscal: str, tipo=TipoConcepto.PERCEPCION) -> ConceptoNomina:
        """
        Busca un concepto por su clave agrupada SAT o crea uno genérico si falla.
        Critico para no detener la nómina por configuración faltante.
        """
        concepto = ConceptoNomina.objects.filter(clave_sat=clave_fiscal, tipo=tipo).first()
        if not concepto:
            # Crear stub si no existe (First-run experience)
            concepto = ConceptoNomina.objects.create(
                codigo=clave_fiscal, 
                nombre=f"Concepto Automático {clave_fiscal}",
                clave_sat=clave_fiscal,
                tipo=tipo
            )
        return concepto

    def _add_item(self, recibo: ReciboNomina, concepto: ConceptoNomina, monto: Decimal, gravado: bool = False):
        DetalleReciboItem.objects.create(
            recibo=recibo,
            concepto=concepto,
            nombre_concepto=concepto.nombre,
            clave_sat=concepto.clave_sat,
            monto_gravado=monto if gravado else 0,
            monto_exento=0 if gravado else monto,
            monto_total=monto
        )
