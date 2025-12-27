from decimal import Decimal
from typing import List, Optional, Tuple, Any, Dict
import datetime
from datetime import date
from django.db.models import Sum

from .models import (
    Empleado, Nomina, ReciboNomina, ConceptoNomina, 
    TablaISR, RenglonTablaISR, ConfiguracionEconomica, 
    EmpleadoCreditoInfonavit, SubsidioEmpleo, RenglonSubsidio,
    DetalleReciboItem
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
    - Subsidio al Empleo (Lógica ISR vs Subsidio)
    - Salario Diario Integrado
    - Créditos Infonavit
    """

    def __init__(self, anio: int = 2025):
        self.anio = anio
        self.config_economica = ConfiguracionEconomica.objects.filter(anio=anio, activo=True).last()
        # No bloqueamos si falta configuración económica para permitir uso parcial (dev), 
        # pero loggearemos advertencia si fuéramos prod.
        
    def calcular_recibo(self, nomina: Nomina, empleado: Empleado, dias_pagados: Optional[Any] = None) -> ReciboNomina:
        """
        Calcula un recibo individual, genera los detalles y guarda.
        Auto-detecta tipo de nómina por descripción ('AGUINALDO', 'FINIQUITO') si es Extraordinaria.
        Permite override de dias_pagados para ajustes manuales.
        """
        # 1. Obtener Datos Laborales
        laborales = getattr(empleado, 'datos_laborales', None)
        if not laborales:
            raise ValueError(f"Empleado {empleado} sin datos laborales.")
        
        # 2. Routing de Estrategia
        if nomina.tipo == 'EXTRAORDINARIA':
            desc = nomina.descripcion.upper()
            if 'AGUINALDO' in desc:
                return self._calcular_aguinaldo_recibo(nomina, empleado)
            elif 'FINIQUITO' in desc or 'LIQUIDACION' in desc or 'LIQUIDACIÓN' in desc:
                es_despido = 'LIQUID' in desc
                return self._calcular_finiquito_recibo(nomina, empleado, es_despido)
            else:
                # Extraordinaria genérica (PTU, etc - pendiente)
                pass

        # ----------------------------------------
        # Lógica ORDINARIA (Sueldo + Prestaciones)
        # ----------------------------------------
        dias_base = Decimal('15.0') if nomina.tipo == 'ORDINARIA' else Decimal('0.0')
        if laborales.periodicidad_pago == 'SEMANAL':
            dias_base = Decimal('7.0')
            
        # Override
        if dias_pagados is not None:
            dias_pagados = Decimal(str(dias_pagados))
        else:
            dias_pagados = dias_base


        sueldo_diario = laborales.salario_diario
        sueldo_total = sueldo_diario * dias_pagados
        sbc = laborales.salario_diario_integrado
        
        recibo = ReciboNomina(
            nomina=nomina,
            empleado=empleado,
            salario_diario=sueldo_diario,
            sbc=sbc,
            dias_pagados=dias_pagados
        )
        recibo.save() 
        
        total_gravado = Decimal('0.0')
        total_exento = Decimal('0.0')
        total_deducciones = Decimal('0.0')
        otros_pagos = Decimal('0.0')

        # [A] Sueldo
        if dias_pagados > 0:
            concepto_sueldo = self._get_concepto_confiable(ClasificacionFiscal.SUELDO)
            self._add_item(recibo, concepto_sueldo, sueldo_total, gravado=True)
            total_gravado += sueldo_total

        # [B] ISR/Subsidio
        isr_bruto = self._calcular_isr(total_gravado, self.anio, periodo=nomina.tipo)
        subsidio_bruto = self._calcular_subsidio(total_gravado, self.anio)
        
        isr_a_retener = Decimal('0.0')
        subsidio_a_entregar = Decimal('0.0')
        
        if isr_bruto > subsidio_bruto:
            isr_a_retener = isr_bruto - subsidio_bruto
        else:
            subsidio_a_entregar = subsidio_bruto - isr_bruto
        
        if isr_a_retener > 0:
            c_isr = self._get_concepto_confiable(ClasificacionFiscal.ISR, TipoConcepto.DEDUCCION)
            self._add_item(recibo, c_isr, isr_a_retener)
            total_deducciones += isr_a_retener
            
        if subsidio_a_entregar > 0:
            c_sub = self._get_concepto_confiable(ClasificacionFiscal.SUBSIDIO_EMPLEO, TipoConcepto.OTRO_PAGO)
            self._add_item(recibo, c_sub, subsidio_a_entregar)
            otros_pagos += subsidio_a_entregar

        # [C] IMSS
        imss = self._calcular_imss_obrero(sbc, dias_pagados)
        if imss > 0:
            c_imss = self._get_concepto_confiable(ClasificacionFiscal.SEGURIDAD_SOCIAL, TipoConcepto.DEDUCCION)
            self._add_item(recibo, c_imss, imss)
            total_deducciones += imss

        # [D] Infonavit
        creditos = EmpleadoCreditoInfonavit.objects.filter(empleado=empleado)
        for credito in creditos:
            monto_infonavit = Decimal('0.0')
            if credito.tipo_descuento == 'CUOTA_FIJA':
                div = Decimal('2.0') if nomina.tipo == 'QUINCENAL' else Decimal('4.0')
                monto_infonavit = credito.monto_o_porcentaje / div
            elif credito.tipo_descuento == 'PORCENTAJE':
                monto_infonavit = (sbc * dias_pagados) * (credito.monto_o_porcentaje / 100)
            
            if monto_infonavit > 0:
                c_info = self._get_concepto_confiable(ClasificacionFiscal.PAGO_CREDITO_VIVIENDA, TipoConcepto.DEDUCCION)
                desc = f"INFONAVIT {credito.descripcion or ''}".strip()
                DetalleReciboItem.objects.create(
                    recibo=recibo, concepto=c_info, nombre_concepto=desc, clave_sat=c_info.clave_sat,
                    monto_gravado=0, monto_exento=0, monto_total=monto_infonavit
                )
                total_deducciones += monto_infonavit

        # Finalizar
        recibo.subtotal = total_gravado + total_exento
        recibo.impuestos_retenidos = isr_a_retener
        recibo.imss_retenido = imss
        recibo.descuentos = total_deducciones
        recibo.neto = (recibo.subtotal + otros_pagos) - total_deducciones
        recibo.save()
        return recibo

    # -----------------------------------------------------------------------
    # MÉTODOS ESPECIALIZADOS (AGUINALDO, FINIQUITO, VACACIONES)
    # -----------------------------------------------------------------------

    def _calcular_aguinaldo_recibo(self, nomina: Nomina, empleado: Empleado) -> ReciboNomina:
        """Cálculo específico de Aguinaldo Anual."""
        laborales = empleado.datos_laborales
        fecha_ingreso = laborales.fecha_ingreso
        fecha_fin_anio = datetime.date(self.anio, 12, 31)
        
        # Días trabajados en el año
        # Si ingresó antes de este año, son 365. Si no, desde ingreso.
        inicio_computo = max(fecha_ingreso, datetime.date(self.anio, 1, 1))
        dias_trabajados = (fecha_fin_anio - inicio_computo).days + 1
        
        # Proporción
        dias_base = 365
        proporcion = Decimal(dias_trabajados) / Decimal(dias_base)
        dias_a_pagar = Decimal('15.0') * proporcion # Ley mínima 15 días
        
        monto_aguinaldo = laborales.salario_diario * dias_a_pagar
        
        # Exención (30 UMAS)
        exencion_tope = Decimal('30.0') * self.config_economica.valor_uma
        monto_exento = min(monto_aguinaldo, exencion_tope)
        monto_gravado = monto_aguinaldo - monto_exento
        
        # Crear Recibo
        recibo = ReciboNomina(
            nomina=nomina, empleado=empleado,
            salario_diario=laborales.salario_diario, sbc=laborales.salario_diario_integrado,
            dias_pagados=dias_a_pagar
        )
        recibo.save()
        
        c_agui = self._get_concepto_confiable(ClasificacionFiscal.GRATIFICACION_ANUAL)
        self._add_item_split(recibo, c_agui, monto_gravado, monto_exento)
        
        # ISR (Reglamento Art 174 opción o Ley 96 normal?)
        # Para simplificar MVP usamos Ley 96 normal sobre el gravado.
        isr = self._calcular_isr(monto_gravado, self.anio, periodo='ANUAL') # O MENSUAL?
        # NOTA: El aguinaldo suele usar cálculo especial o sumarse al mes. 
        # Si es nómina EXTRAORDINARIA pura, tabla mensual a veces aplica simple sobre el monto.
        
        if isr > 0:
            c_isr = self._get_concepto_confiable(ClasificacionFiscal.ISR, TipoConcepto.DEDUCCION)
            self._add_item(recibo, c_isr, isr)
        
        recibo.subtotal = monto_aguinaldo
        recibo.impuestos_retenidos = isr
        recibo.descuentos = isr
        recibo.neto = monto_aguinaldo - isr
        recibo.save()
        return recibo

    def _calcular_finiquito_recibo(self, nomina: Nomina, empleado: Empleado, es_despido: bool) -> ReciboNomina:
        laborales = empleado.datos_laborales
        # Asumimos fecha de baja es Hoy o fecha fin nómina
        fecha_baja = nomina.fecha_fin
        
        # 1. Aguinaldo Proporcional
        inicio_anio = datetime.date(fecha_baja.year, 1, 1)
        inicio_computo = max(laborales.fecha_ingreso, inicio_anio)
        dias_trab_anio = (fecha_baja - inicio_computo).days + 1
        prop_anio = Decimal(dias_trab_anio) / Decimal('365')
        monto_aguinaldo = (laborales.salario_diario * Decimal('15')) * prop_anio
        
        exento_ag = min(monto_aguinaldo, Decimal('30') * self.config_economica.valor_uma)
        gravado_ag = monto_aguinaldo - exento_ag
        
        # 2. Vacaciones Pendientes (Simplificado: 7 días estándar pendientes)
        # TODO: Llevar récord real de vacaciones
        dias_vac_pendientes = Decimal('6.0') * prop_anio # Proporcional de 1er año
        monto_vac = laborales.salario_diario * dias_vac_pendientes
        # Vacaciones gravan 100%
        
        # 3. Prima Vacacional (25% de Vacaciones)
        monto_pv = monto_vac * Decimal('0.25')
        exento_pv = min(monto_pv, Decimal('15') * self.config_economica.valor_uma)
        gravado_pv = monto_pv - exento_pv
        
        recibo = ReciboNomina(
            nomina=nomina, empleado=empleado,
            salario_diario=laborales.salario_diario, sbc=laborales.salario_diario_integrado,
            dias_pagados=Decimal('0')
        )
        recibo.save()
        
        # Add Conceptos
        c_ag = self._get_concepto_confiable(ClasificacionFiscal.GRATIFICACION_ANUAL)
        self._add_item_split(recibo, c_ag, gravado_ag, exento_ag)
        
        c_vac = self._get_concepto_confiable("001") # Vacaciones suele ir como Sueldo o concepto propio "Vacaciones a tiempo" no hay clave sat especifica unica, usa 001 dias vacaciones
        self._add_item(recibo, c_vac, monto_vac, gravado=True) # Vacaciones gravan 100%
        
        c_pv = self._get_concepto_confiable(ClasificacionFiscal.PRIMA_VACACIONAL)
        self._add_item_split(recibo, c_pv, gravado_pv, exento_pv)
        
        total_gravado_finiquito = gravado_ag + monto_vac + gravado_pv
        
        # LIQUIDACION (Indeminzaciones)
        if es_despido:
            # A. 3 Meses Constitución
            indem_3m = laborales.salario_diario_integrado * Decimal('90')
            
            # B. 20 Días por año
            antiguedad_anios = Decimal((fecha_baja - laborales.fecha_ingreso).days) / Decimal('365')
            indem_20d = (laborales.salario_diario_integrado * Decimal('20')) * antiguedad_anios
            
            # C. Prima Antigüedad (12 días/año, topado 2xSM)
            sm_topado = self.config_economica.salario_minimo_general * Decimal('2')
            salario_base_prim = min(laborales.salario_diario, sm_topado) 
            prima_antig = (salario_base_prim * Decimal('12')) * antiguedad_anios
            
            total_indem = indem_3m + indem_20d + prima_antig
            
            # Exención: 90 UMA por año de servicio
            anios_completos = int(antiguedad_anios) 
            if (antiguedad_anios - anios_completos) > 0.5: # Fracción > 6 meses cuenta como año
                anios_completos += 1
            
            exento_indem = (Decimal('90') * self.config_economica.valor_uma) * Decimal(anios_completos)
            exento_indem = min(total_indem, exento_indem)
            gravado_indem = total_indem - exento_indem
            
            c_indem = self._get_concepto_confiable(ClasificacionFiscal.INDEMNIZACIONES)
            self._add_item_split(recibo, c_indem, gravado_indem, exento_indem)
            
            c_prima_ant = self._get_concepto_confiable(ClasificacionFiscal.PRIMA_ANTIGUEDAD)
            # Desglosar solo visualmente si se quiere, por ahora todo en Indemnizaciones o separado
            
            total_gravado_finiquito += gravado_indem

        # ISR Final (Aprox Mensual)
        isr = self._calcular_isr(total_gravado_finiquito, self.anio, 'MENSUAL')
        if isr > 0:
             c_isr = self._get_concepto_confiable(ClasificacionFiscal.ISR, TipoConcepto.DEDUCCION)
             self._add_item(recibo, c_isr, isr)

        # Totales
        recibo.subtotal = total_gravado_finiquito + exento_ag + exento_pv + (exento_indem if es_despido else 0)
        recibo.impuestos_retenidos = isr
        recibo.descuentos = isr
        recibo.neto = recibo.subtotal - isr
        recibo.save()
        return recibo

    def _add_item_split(self, recibo, concepto, gravado, exento):
        DetalleReciboItem.objects.create(
            recibo=recibo, concepto=concepto, nombre_concepto=concepto.nombre, clave_sat=concepto.clave_sat,
            monto_gravado=gravado, monto_exento=exento, monto_total=gravado + exento
        )


    def _calcular_isr(self, base_gravable: Decimal, anio: int, periodo: str = 'QUINCENAL') -> Decimal:
        """
        Calcula el ISR Bruto (sin restar subsidio) según tablas.
        """
        tabla = TablaISR.objects.filter(anio_vigencia=anio, tipo_periodo=periodo).first()
        if not tabla:
            return Decimal('0.0')

        renglon = RenglonTablaISR.objects.filter(
            tabla=tabla, 
            limite_inferior__lte=base_gravable
        ).order_by('-limite_inferior').first()

        if not renglon:
            return Decimal('0.0')

        excedente = base_gravable - renglon.limite_inferior
        impuesto_marginal = excedente * (renglon.porcentaje_excedente / 100)
        isr_calculado = impuesto_marginal + renglon.cuota_fija
        
        return isr_calculado.quantize(Decimal('0.01'))

    def _calcular_subsidio(self, base_gravable: Decimal, anio: int) -> Decimal:
        """
        Obtiene el subsidio para el empleo correspondiente a la base.
        """
        tabla = SubsidioEmpleo.objects.filter(anio_vigencia=anio).first()
        if not tabla:
            return Decimal('0.0')

        # Buscar donde el ingreso sea MENOR o IGUAL al 'ingreso_hasta'
        # Ordenamos por ingreso_hasta ascendente y tomamos el primero que cumpla
        # base <= ingreso_hasta
        renglon = RenglonSubsidio.objects.filter(
            tabla=tabla,
            ingreso_hasta__gte=base_gravable
        ).order_by('ingreso_hasta').first()

        if not renglon:
            # Si supera el último renglón, subsidio es 0
            return Decimal('0.0')
            
        return renglon.monto_subsidio.quantize(Decimal('0.01'))

    def _calcular_imss_obrero(self, sbc: Decimal, dias: Decimal) -> Decimal:
        """
        Cálculo detallado de cuotas obreras IMSS (Factores vigentes).
        """
        uma = self.config_economica.valor_uma
        sbc_total = sbc * dias
        total_cuota = Decimal('0.0')

        # 1. Enfermedades y Maternidad: Excedente 3 UMA (0.40%)
        # Aplica si el SBC es mayor a 3 UMAs
        base_3uma = Decimal('3.0') * uma
        if sbc > base_3uma:
            base_excedente = (sbc - base_3uma) * dias
            total_cuota += base_excedente * Decimal('0.0040')

        # 2. Enfermedades y Maternidad: Prestaciones en Dinero (0.25%)
        total_cuota += sbc_total * Decimal('0.0025')

        # 3. Gastos Médicos Pensionados (0.375%)
        total_cuota += sbc_total * Decimal('0.00375')
        
        # 4. Invalidez y Vida (0.625%)
        total_cuota += sbc_total * Decimal('0.00625')
        
        # 5. Cesantía en Edad Avanzada y Vejez (1.125%) - Cuota Obrero
        total_cuota += sbc_total * Decimal('0.01125')

        return total_cuota.quantize(Decimal('0.01'))

    def _get_concepto_confiable(self, clave_fiscal: str, tipo=TipoConcepto.PERCEPCION) -> ConceptoNomina:
        concepto = ConceptoNomina.objects.filter(clave_sat=clave_fiscal, tipo=tipo).first()
        if not concepto:
            # Stub de emergencia
            nombre_stub = f"Concepto {clave_fiscal}"
            concepto = ConceptoNomina.objects.create(
                codigo=clave_fiscal[:20], 
                nombre=nombre_stub,
                clave_sat=clave_fiscal,
                tipo=tipo
            )
        return concepto

    def _calcular_imss_patronal(self, sbc: Decimal, dias: Decimal) -> Dict[str, Decimal]:
        """
        Calcula la Carga Social Patronal (IMSS + INFONAVIT + RCV) detallada.
        Retorna un diccionario con los rubros y el total.
        """
        cfg = self.config_economica
        uma = cfg.valor_uma
        sbc_total = sbc * dias
        
        cuotas = {
            'cuota_fija': Decimal('0.0'),
            'excedente_3uma': Decimal('0.0'),
            'prest_dinero': Decimal('0.0'),
            'gastos_medicos': Decimal('0.0'), # EyM Patron
            'riesgo_trabajo': Decimal('0.0'),
            'invalidez_vida': Decimal('0.0'),
            'guarderias': Decimal('0.0'),
            'retiro': Decimal('0.0'),
            'cesantia_vejez': Decimal('0.0'),
            'infonavit': Decimal('0.0'),
        }

        # 1. Enfermedades y Maternidad: Cuota Fija (20.40% UMA)
        cuotas['cuota_fija'] = (uma * dias) * (cfg.cuota_fija_imss_patron / 100)

        # 2. Excedente 3 UMA
        base_3uma = Decimal('3.0') * uma
        if sbc > base_3uma:
            base_exc = (sbc - base_3uma) * dias
            # 1.10% Patronal approx estándar, o usar campo si existiera especifico.
            # Usaremos 1.10% hardcoded si no está en config, o inferirlo.
            # Config tiene porc_imss_enfermedad_excedente_obrero (0.40). El patronal suele ser 1.10.
            cuotas['excedente_3uma'] = base_exc * Decimal('0.0110')

        # 3. Prestaciones Dinero (0.70%)
        cuotas['prest_dinero'] = sbc_total * (cfg.porc_imss_enfermedad_maternidad_patron / 100)
        
        # 4. Gastos Medicos Pensionados (1.05%)
        # Config tiene porc_imss_enfermedad_maternidad_patron que es 0.70 (PD). GMP es 1.05.
        # Asumiremos constantes estándar ley 2024 si no están desglosadas en config.
        cuotas['gastos_medicos'] = sbc_total * Decimal('0.0105')

        # 5. Riesgo Trabajo
        cuotas['riesgo_trabajo'] = sbc_total * (cfg.porc_imss_riesgo_trabajo_patron / 100)

        # 6. Invalidez y Vida (1.75%)
        cuotas['invalidez_vida'] = sbc_total * (cfg.porc_imss_invalidez_vida_patron / 100)

        # 7. Guarderías (1.00%)
        cuotas['guarderias'] = sbc_total * (cfg.porc_imss_guarderia_prestaciones_patron / 100)

        # 8. Retiro (2.00%)
        cuotas['retiro'] = sbc_total * (cfg.porc_imss_retiro_patron / 100)

        # 9. Cesantía y Vejez (Patronal) - Gradual 2024+
        # Usamos el valor configurado (aprox 3.15% base 2023, pero en 2025 sube segun salario).
        # Implementación simple usa el valor config promedio.
        cuotas['cesantia_vejez'] = sbc_total * (cfg.porc_imss_cesantia_vejez_patron / 100)

        # 10. INFONAVIT (5.00%)
        cuotas['infonavit'] = sbc_total * (cfg.porc_infonavit_patron / 100)

        return cuotas

    def proyectar_costo_anual(self, empleado: Empleado) -> Dict[str, Any]:
        """
        Calcula el Presupuesto Anual de Gasto Total para un empleado.
        Incluye: Sueldo, Aguinaldo, Prima Vacacional, Carga Social Patronal, ISN.
        """
        laborales = getattr(empleado, 'datos_laborales', None)
        if not laborales:
            return {'error': 'Sin datos laborales'}

        sbc = laborales.salario_diario_integrado
        sd = laborales.salario_diario
        
        # 1. Sueldo Anual (365 días)
        sueldo_anual = sd * Decimal('365')
        
        # 2. Aguinaldo (15 días mín)
        aguinaldo = sd * Decimal('15')
        
        # 3. Prima Vacacional (25% de 6 días mín = 1.5 días) -> Promedio 1 año antiguedad
        prima_vacacional = sd * Decimal('6') * Decimal('0.25')
        
        # 4. Carga Social Anual
        # Estimamos 365 días cotizados
        patronal_mensual = self._calcular_imss_patronal(sbc, Decimal('30.4'))
        total_patronal_mensual = sum(patronal_mensual.values())
        carga_social_anual = total_patronal_mensual * Decimal('12')
        
        # 5. ISN (Impuesto Sobre Nómina) - Estatal (Ej. 3% CDMX/QRO)
        base_isn = sueldo_anual + aguinaldo + prima_vacacional
        isn_anual = base_isn * Decimal('0.03')
        
        costo_total = base_isn + carga_social_anual + isn_anual
        
        return {
            'empleado': empleado.nombre_completo,
            'sueldo_bruto_anual': base_isn,
            'carga_social_anual': carga_social_anual,
            'isn_estimado': isn_anual,
            'costo_total_anual': costo_total,
            'factor_costo': (costo_total / sueldo_anual) if sueldo_anual > 0 else 0
        }

    def _add_item(self, recibo: ReciboNomina, concepto: ConceptoNomina, monto: Decimal, gravado: bool = False):
        monto = monto.quantize(Decimal('0.01'))
        DetalleReciboItem.objects.create(
            recibo=recibo,
            concepto=concepto,
            nombre_concepto=concepto.nombre,
            clave_sat=concepto.clave_sat,
            monto_gravado=monto if gravado else 0,
            monto_exento=0 if gravado else monto,
            monto_total=monto
        )
