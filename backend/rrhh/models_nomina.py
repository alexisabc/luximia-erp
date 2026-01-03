from django.db import models
from core.models import BaseModel, SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager
from django.core.validators import MinValueValidator, MaxValueValidator

# ---------------------------------------------------------------------------
# Catálogos y Parámetros de Nómina (Configuración Dinámica)
# ---------------------------------------------------------------------------

from .models.conceptos import ConceptoNomina, TipoConcepto

class ClasificacionFiscal(models.TextChoices):
    # --- PERCEPCIONES (Catálogo c_TipoPercepcion) ---
    SUELDO = '001', '001 - Sueldos, Salarios Rayas y Jornales'
    GRATIFICACION_ANUAL = '002', '002 - Gratificación Anual (Aguinaldo)'
    PTU = '003', '003 - Participación de los Trabajadores en las Utilidades PTU'
    REEMBOLSO_GASTOS_MEDICOS = '004', '004 - Reembolso de Gastos Médicos'
    FONDO_AHORRO = '005', '005 - Fondo de Ahorro'
    CAJA_AHORRO = '006', '006 - Caja de ahorro'
    PREMIO_PUNTUALIDAD = '010', '010 - Premios por puntualidad'
    PRIMA_SEGURO_VIDA = '011', '011 - Prima de Seguro de vida'
    SEGURO_GASTOS_MEDICOS_MAYORES = '012', '012 - Seguro de Gastos Médicos Mayores'
    CUOTAS_SINDICALES_PAGADAS_PATRON = '013', '013 - Cuotas Sindicales Pagadas por el Patrón'
    SUBSIDIOS_INCAPACIDAD = '014', '014 - Subsidios por incapacidad'
    BECAS = '015', '015 - Becas para trabajadores y/o hijos'
    HORAS_EXTRA = '019', '019 - Horas extra'
    PRIMA_DOMINICAL = '020', '020 - Prima dominical'
    PRIMA_VACACIONAL = '021', '021 - Prima vacacional'
    PRIMA_ANTIGUEDAD = '022', '022 - Prima por antigüedad'
    PAGOS_SEPARACION = '023', '023 - Pagos por separación'
    SEGURO_RETIRO = '024', '024 - Seguro de retiro'
    INDEMNIZACIONES = '025', '025 - Indemnizaciones'
    REEMBOLSO_FUNERAL = '026', '026 - Reembolso por funeral'
    COMISIONES = '028', '028 - Comisiones'
    VALES_DESPENSA = '029', '029 - Vales de despensa en efectivo'
    VALES_RESTAURANTE = '030', '030 - Vales de restaurante'
    VALES_GASOLINA = '031', '031 - Vales de gasolina'
    INGRESOS_ASIMILADOS = '046', '046 - Ingresos asimilados a salarios'
    VIATICOS = '050', '050 - Viáticos'

    # --- DEDUCCIONES (Catálogo c_TipoDeduccion) ---
    SEGURIDAD_SOCIAL = '001_D', '001 - Seguridad Social (IMSS)'
    ISR = '002_D', '002 - ISR'
    APORTACION_RETIRO = '003_D', '003 - Aportaciones a retiro, cesantía y vejez'
    OTROS_DESCUENTOS = '004_D', '004 - Otros'
    FONDO_VIVIENDA = '005_D', '005 - Aportaciones a Fondo de vivienda'
    DESCUENTO_INCAPACIDAD = '006_D', '006 - Descuento por incapacidad'
    PENSION_ALIMENTICIA = '007_D', '007 - Pensión alimenticia'
    RENTA = '008_D', '008 - Renta'
    ANTICIPO_SALARIOS = '009_D', '009 - Anticipo de salarios'
    PAGO_CREDITO_VIVIENDA = '010_D', '010 - Pago por crédito de vivienda (Infonavit)'
    ANTICIPO_SUELDOS_OVERRIDE = '012_D', '012 - Anticipo de sueldos'
    PAGOS_EXCESID_TRABAJADOR = '013_D', '013 - Pagos hechos con exceso al trabajador'
    CUOTAS_SINDICALES = '018_D', '018 - Cuotas para sindicatos'
    CUOTAS_SEGURO_RETIRO = '020_D', '020 - Cuotas de seguro de retiro'
    AJUSTE_SUBSIDIO_EMPLEO = '071_D', '071 - Ajuste en Subsidio para el empleo'

    # --- OTROS PAGOS (Catálogo c_TipoOtroPago) ---
    REINTEGRO_ISR = '001_OP', '001 - Reintegro de ISR pagado en exceso'
    SUBSIDIO_EMPLEO = '002_OP', '002 - Subsidio para el empleo (efectivamente entregado)'
    VIATICOS_ENTREGADOS = '003_OP', '003 - Viáticos (entregados al trabajador)'
    APLICACION_SALDO_FAVOR = '004_OP', '004 - Aplicación de saldo a favor compensación anual'

# ConceptoNomina is now imported from .models.conceptos


class TablaISR(SoftDeleteModel):
    """
    Tablas de ISR dinámicas (Mensual, Quincenal, Semanal, Anual).
    Se pueden tener múltiples vigencias (ej. 2024, 2025).
    """
    TIPO_TABLA = [('MENSUAL', 'Mensual'), ('QUINCENAL', 'Quincenal'), ('SEMANAL', 'Semanal'), ('ANUAL', 'Anual')]
    
    anio_vigencia = models.PositiveIntegerField(default=2025)
    tipo_periodo = models.CharField(max_length=20, choices=TIPO_TABLA)
    descripcion = models.CharField(max_length=200, help_text="Ej. Tabla ISR Mensual 2025")

    def __str__(self):
        return f"{self.descripcion} ({self.anio_vigencia})"

class RenglonTablaISR(models.Model):
    """Renglones individuales de la tabla de ISR."""
    tabla = models.ForeignKey(TablaISR, on_delete=models.CASCADE, related_name="renglones")
    limite_inferior = models.DecimalField(max_digits=12, decimal_places=2)
    limite_superior = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Null para infinito")
    cuota_fija = models.DecimalField(max_digits=12, decimal_places=2)
    porcentaje_excedente = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        ordering = ['limite_inferior']


class ConfiguracionEconomica(SoftDeleteModel):
    """
    Parámetros globales que cambian periódicamente (UMA, Salario Mínimo).
    Se crea uno nuevo por cada año/cambio.
    """
    anio = models.PositiveIntegerField(unique=True)
    valor_uma = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor UMA Diario")
    valor_umi = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor UMI (Infonavit)")
    salario_minimo_general = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Salario Mínimo General")
    salario_minimo_frontera = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Salario Mínimo Frontera")
    
    # --- FACTORES IMSS ---
    # Cuotas Obrero
    porc_imss_enfermedad_maternidad_obrero = models.DecimalField(
        max_digits=5, decimal_places=3, default=0.250, 
        verbose_name="% E.M. Gastos Médicos (Obrero)"
    )
    porc_imss_invalidez_vida_obrero = models.DecimalField(
        max_digits=5, decimal_places=3, default=0.625,
        verbose_name="% Invalidez y Vida (Obrero)"
    )
    porc_imss_cesantia_vejez_obrero = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.125,
        verbose_name="% Cesantía y Vejez (Obrero)"
    )
    porc_imss_enfermedad_excedente_obrero = models.DecimalField(
        max_digits=5, decimal_places=3, default=0.400,
        verbose_name="% E.M. Excedente 3 UMA (Obrero)"
    )

    # Cuotas Patrón
    cuota_fija_imss_patron = models.DecimalField(
        max_digits=6, decimal_places=2, default=20.40, 
        verbose_name="Cuota Fija Patronal"
    )
    porc_imss_enfermedad_maternidad_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=0.700,
        verbose_name="% E.M. Gastos Médicos (Patrón)"
    )
    porc_imss_invalidez_vida_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.750,
        verbose_name="% Invalidez y Vida (Patrón)"
    )
    porc_imss_cesantia_vejez_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=3.150,
        verbose_name="% Cesantía y Vejez (Patrón)"
    )
    porc_imss_guarderia_prestaciones_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=1.000,
        verbose_name="% Guarderías y Prestaciones (Patrón)"
    )
    porc_imss_riesgo_trabajo_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=0.500,
        verbose_name="% Riesgo Trabajo (Patrón Base)",
        help_text="Este varía por empresa, este es el mínimo de ley."
    )
    porc_imss_retiro_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=2.000,
        verbose_name="% Retiro (Patrón)"
    )
    porc_infonavit_patron = models.DecimalField(
        max_digits=5, decimal_places=3, default=5.000,
        verbose_name="% INFONAVIT (Patrón)"
    )

    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"Indicadores Económicos {self.anio}"


class SubsidioEmpleo(SoftDeleteModel):
    """Tabla de Subsidio para el Empleo (Actualización 2024/2025)."""
    anio_vigencia = models.PositiveIntegerField(default=2025)
    
    def __str__(self):
        return f"Tabla Subsidio {self.anio_vigencia}"

class RenglonSubsidio(models.Model):
    tabla = models.ForeignKey(SubsidioEmpleo, on_delete=models.CASCADE, related_name="renglones")
    ingreso_hasta = models.DecimalField(max_digits=12, decimal_places=2)
    monto_subsidio = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['ingreso_hasta']


# ---------------------------------------------------------------------------
# Modelos Transaccionales (Ejecución de Nómina)
# ---------------------------------------------------------------------------

class Nomina(SoftDeleteModel, EmpresaOwnedModel):
    """
    Cabecera de un cálculo de nómina (ej. Quincena 1 Enero 2025).
    """
    objects = MultiTenantManager()
    ESTADO_NOMINA = [
        ('BORRADOR', 'Borrador'),
        ('CALCULADA', 'Calculada'),
        ('TIMBRADA', 'Timbrada/Cerrada'),
        ('CANCELADA', 'Cancelada')
    ]
    TIPO_NOMINA = [('ORDINARIA', 'Ordinaria'), ('EXTRAORDINARIA', 'Extraordinaria')]

    descripcion = models.CharField(max_length=200)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_pago = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_NOMINA, default='ORDINARIA')
    estado = models.CharField(max_length=20, choices=ESTADO_NOMINA, default='BORRADOR')
    
    # Totales (Snapshots)
    total_percepciones = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_deducciones = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_neto = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # Relación con empresa/razón social emisora
    razon_social = models.ForeignKey('rrhh.RazonSocial', on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.descripcion} ({self.get_estado_display()})"


class ReciboNomina(SoftDeleteModel):
    """
    El recibo individual de un empleado dentro de una Nómina.
    Aquí se guarda el resultado del cálculo para ese empleado específico.
    """
    nomina = models.ForeignKey(Nomina, on_delete=models.CASCADE, related_name="recibos")
    empleado = models.ForeignKey('rrhh.Empleado', on_delete=models.PROTECT)
    
    # Datos "congelados" al momento del cálculo (por si el empleado cambia de puesto después)
    salario_diario = models.DecimalField(max_digits=10, decimal_places=2)
    sbc = models.DecimalField(max_digits=10, decimal_places=2)
    antiguedad_dias = models.IntegerField(default=0)
    dias_pagados = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)
    
    # Totales Individuales
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuestos_retenidos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    imss_retenido = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    uuid_sat = models.CharField(max_length=36, blank=True, null=True, help_text="Folio Fiscal Digital")
    uuid = models.CharField(max_length=36, blank=True, null=True, help_text="Folio Fiscal SAT (Alias)")
    xml_timbrado = models.TextField(blank=True, null=True, help_text="XML con el complemento de timbre")
    fecha_timbrado = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('nomina', 'empleado') 
        # Un empleado solo puede tener un recibo por nómina (salvo extraordinarias que son otra nómina)

    def __str__(self):
        return f"Recibo {self.empleado} - {self.nomina}"

class DetalleReciboItem(models.Model):
    """
    Cada línea del recibo (Sueldo, Bono, ISR, IMSS).
    """
    recibo = models.ForeignKey(ReciboNomina, on_delete=models.CASCADE, related_name="detalles")
    concepto = models.ForeignKey(ConceptoNomina, on_delete=models.PROTECT)
    
    clave_sat = models.CharField(max_length=20, blank=True, null=True) # Snapshot
    nombre_concepto = models.CharField(max_length=200) # Snapshot
    
    monto_gravado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monto_exento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=12, decimal_places=2) # gravado + exento

    class Meta:
        verbose_name = "Detalle de Concepto"
        verbose_name_plural = "Detalles de Conceptos"


register_audit(Nomina)
register_audit(ReciboNomina)


class BuzonIMSS(SoftDeleteModel):
    """
    Mensajes recibidos del IDSE / Buzón IMSS.
    """
    fecha_recibido = models.DateTimeField(auto_now_add=True)
    asunto = models.CharField(max_length=200)
    cuerpo = models.TextField()
    registro_patronal = models.CharField(max_length=20, blank=True, null=True)
    leido = models.BooleanField(default=False)
    archivo_adjunto = models.FileField(upload_to="imss/buzon/", blank=True, null=True)

    def __str__(self):
        return f"IMSS: {self.asunto} ({self.fecha_recibido.date()})"

register_audit(BuzonIMSS)
