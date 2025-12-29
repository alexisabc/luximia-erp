from django.db import models
from django.conf import settings

from core.models import BaseModel, SoftDeleteModel, register_audit


# Eliminamos ModeloBaseActivo local y usamos SoftDeleteModel
# Nota: SoftDeleteModel usa 'is_active'. Si la DB ya tiene 'activo', haremos una migración para renombrarlo.

class Moneda(SoftDeleteModel):
    codigo = models.CharField(max_length=3, unique=True)
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.codigo


class Banco(SoftDeleteModel):
    clave = models.CharField(max_length=20, unique=True)
    nombre_corto = models.CharField(max_length=100)
    razon_social = models.CharField(max_length=200)

    def __str__(self):
        return self.nombre_corto


class MetodoPago(SoftDeleteModel):
    """Catálogo de métodos de pago permitidos."""
    METODO_CHOICES = [
        ("N/A", "N/A"),
        ("EFECTIVO", "EFECTIVO"),
        ("TARJETA_CREDITO", "TARJETA DE CREDITO"),
        ("TARJETA_DEBITO", "TARJETA DE DEBITO"),
        ("TARJETA_PREPAGO", "TARJETA DE PREPAGO"),
        ("CHEQUE_NOMINATIVO", "CHEQUE NOMINATIVO"),
        ("CHEQUE_CAJA", "CHEQUE DE CAJA"),
        ("CHEQUE_VIAJERO", "CHEQUE DE VIAJERO"),
        ("TRANSFERENCIA_INTERBANCARIA", "TRANSFERENCIA INTERBANCARIA"),
        ("TRANSFERENCIA_MISMA_INSTITUCION", "TRANSFERENCIA MISMA INSTITUCION"),
        ("TRANSFERENCIA_INTERNACIONAL", "TRANSFERENCIA INTERNACIONAL"),
        ("ORDEN_PAGO", "ORDEN DE PAGO"),
        ("GIRO", "GIRO"),
        ("ORO_PLATINO", "ORO O PLATINO AMONEDADOS"),
        ("PLATA", "PLATA AMONEDADA"),
        ("METALES_PRECIOSOS", "METALES PRECIOSO"),
    ]
    nombre = models.CharField(max_length=40, choices=METODO_CHOICES, unique=True)

    def __str__(self):
        return self.get_nombre_display()


class Proyecto(SoftDeleteModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    numero_upes = models.PositiveIntegerField(default=0)
    niveles = models.PositiveIntegerField(default=0)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=50, default="Planificado")

    def __str__(self):
        return self.nombre


class Cliente(SoftDeleteModel):
    nombre_completo = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo


class TipoCambio(SoftDeleteModel):
    ESCENARIO_CHOICES = [
        ("PACTADO", "Pactado"),
        ("TOPADO", "Topado"),
        ("BANXICO", "Banxico"),
    ]
    escenario = models.CharField(max_length=20, choices=ESCENARIO_CHOICES)
    fecha = models.DateField()
    valor = models.DecimalField(max_digits=12, decimal_places=4)
    
    moneda_origen = models.ForeignKey('Moneda', on_delete=models.CASCADE, related_name='tipos_cambio_origen', null=True, blank=True)
    moneda_destino = models.ForeignKey('Moneda', on_delete=models.CASCADE, related_name='tipos_cambio_destino', null=True, blank=True)

    class Meta:
        unique_together = ("escenario", "fecha", "moneda_origen", "moneda_destino")

    def __str__(self):
        return f"{self.escenario} - {self.fecha}"


class Vendedor(SoftDeleteModel):
    TIPO_CHOICES = [("INTERNO", "Interno"), ("EXTERNO", "Externo")] # Legacy?
    
    # SAT DIOT Fields
    TIPO_TERCERO_CHOICES = [
        ('04', '04 - Proveedor Nacional'),
        ('05', '05 - Proveedor Extranjero'),
        ('15', '15 - Proveedor Global'),
    ]
    TIPO_OPERACION_CHOICES = [
        ('03', '03 - Prestación de Servicios Profesionales'),
        ('06', '06 - Arrendamiento de Inmuebles'),
        ('85', '85 - Otros'),
    ]
    
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='EXTERNO')
    nombre_completo = models.CharField(max_length=200)
    rfc = models.CharField(max_length=13, blank=True, null=True) # Critical for DIOT
    
    tipo_tercero = models.CharField(max_length=2, choices=TIPO_TERCERO_CHOICES, default='04')
    tipo_operacion = models.CharField(max_length=2, choices=TIPO_OPERACION_CHOICES, default='85')
    
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo


class FormaPago(SoftDeleteModel):
    enganche = models.PositiveSmallIntegerField()
    mensualidades = models.PositiveSmallIntegerField()
    meses = models.PositiveSmallIntegerField()
    contra_entrega = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"{self.enganche}% - {self.mensualidades}% - {self.contra_entrega}%"


class UPE(SoftDeleteModel):
    ESTADO_CHOICES = [
        ("DISPONIBLE", "Disponible"),
        ("VENDIDA", "Vendida"),
        ("PAGADA", "Pagada"),
        ("BLOQUEADA", "Bloqueada"),
    ]
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="upes")
    identificador = models.CharField(max_length=100, unique=True)
    nivel = models.PositiveIntegerField(default=1)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2)
    estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="DISPONIBLE")

    class Meta:
        permissions = [
            # ===== CATÁLOGO DE CUENTAS =====
            ("manage_chart_of_accounts", "Gestionar catálogo de cuentas contables"),
            ("close_accounting_period", "Cerrar períodos contables"),
            
            # ===== PÓLIZAS =====
            ("create_journal_entry", "Crear pólizas contables"),
            ("post_journal_entry", "Aplicar/Mayorizar pólizas"),
            ("reverse_journal_entry", "Revertir pólizas aplicadas"),
            ("delete_journal_entry", "Eliminar pólizas contables"),
            
            # ===== FACTURACIÓN =====
            ("issue_invoice", "Emitir facturas (CFDI)"),
            ("cancel_invoice", "Cancelar facturas (CFDI)"),
            ("view_fiscal_documents", "Ver documentos fiscales"),
            
            # ===== TIPOS DE CAMBIO =====
            ("manage_exchange_rates", "Gestionar tipos de cambio"),
            
            # ===== REPORTES CONTABLES =====
            ("view_financial_statements", "Ver estados financieros"),
            ("export_financial_reports", "Exportar reportes financieros"),
            ("view_diot", "Ver DIOT"),
            ("generate_diot", "Generar DIOT"),
            
            # ===== IA CONTABLE =====
            ("use_ai_accounting", "Usar IA para contabilidad"),
        ]

    def __str__(self):
        return self.identificador


class PlanPago(SoftDeleteModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="planes_pago")
    upe = models.ForeignKey(UPE, on_delete=models.CASCADE, related_name="planes_pago")
    apartado_monto = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_apartado = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_apartado")
    fecha_apartado = models.DateField(blank=True, null=True)
    forma_pago_enganche = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_enganche")
    monto_enganche = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_enganche = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_enganche_moneda")
    fecha_enganche = models.DateField(blank=True, null=True)
    forma_pago_mensualidades = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_mensualidades")
    monto_mensualidades = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_mensualidades = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_mensualidades_moneda")
    forma_pago_meses = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_meses")
    meses = models.PositiveSmallIntegerField(default=0)
    monto_mensual = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_mensual = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_mensual_moneda")
    forma_pago_contra_entrega = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_contra_entrega")
    monto_contra_entrega = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_contra_entrega = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_contra_entrega_moneda")

    def __str__(self):
        return f"Plan {self.id} - {self.cliente} - {self.upe}"


class EsquemaComision(SoftDeleteModel):
    ESQUEMA_CHOICES = [("RENTA", "Renta"), ("VENTA", "Venta")]
    esquema = models.CharField(max_length=10, choices=ESQUEMA_CHOICES)
    escenario = models.CharField(max_length=100)
    porcentaje = models.DecimalField(max_digits=6, decimal_places=3)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=16.0)

    def __str__(self):
        return f"{self.esquema} - {self.escenario}"


class Presupuesto(SoftDeleteModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="presupuestos")
    upe = models.ForeignKey(UPE, on_delete=models.CASCADE, related_name="upes_presupuesto", related_query_name="presupuesto") 
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.ForeignKey(TipoCambio, on_delete=models.PROTECT)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    precio_m2 = models.DecimalField(max_digits=14, decimal_places=2)
    precio_lista = models.DecimalField(max_digits=14, decimal_places=2)
    descuento = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    precio_con_descuento = models.DecimalField(max_digits=14, decimal_places=2)
    enganche = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=14, decimal_places=2)
    plan_pago = models.ForeignKey(PlanPago, on_delete=models.CASCADE, related_name="presupuestos", null=True, blank=True)
    fecha_entrega_pactada = models.DateField(blank=True, null=True)
    negociaciones_especiales = models.TextField(blank=True, null=True)
    vendedor1 = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, related_name="presupuestos_vendedor1", null=True, blank=True)
    vendedor2 = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, related_name="presupuestos_vendedor2", null=True, blank=True)
    esquema_comision = models.ForeignKey(EsquemaComision, on_delete=models.SET_NULL, null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    
    empleado1 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado1", null=True, blank=True)
    empleado2 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado2", null=True, blank=True)
    empleado3 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado3", null=True, blank=True)
    
    aprobado = models.BooleanField(default=False)
    fecha = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Presupuesto {self.id}"


class Contrato(SoftDeleteModel):
    presupuesto = models.ForeignKey(Presupuesto, on_delete=models.CASCADE, related_name="contratos")
    fecha = models.DateField(auto_now_add=True)
    saldo_presupuesto = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    abonado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    fecha_ultimo_abono = models.DateField(blank=True, null=True)
    monto_ultimo_abono = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    monto_mxn = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"Contrato {self.id}"


class Pago(SoftDeleteModel):
    TIPO_PAGO_CHOICES = [
        ("APARTADO", "Apartado"),
        ("DEVOLUCION", "Devolución"),
        ("MENSUALIDAD", "Mensualidad"),
        ("PAGO", "Pago"),
        ("DESCUENTO", "Descuento"),
        ("ABONO", "Abono"),
        ("INTERES", "Interés"),
        ("COMPLETO", "Completo"),
    ]
    contrato = models.ForeignKey(Contrato, on_delete=models.CASCADE, related_name="pagos")
    tipo_pago = models.CharField(max_length=20, choices=TIPO_PAGO_CHOICES)
    fecha_pago = models.DateField()
    fecha_ingreso = models.DateField()
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.PROTECT)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.ForeignKey(TipoCambio, on_delete=models.PROTECT)
    valor_mxn = models.DecimalField(max_digits=14, decimal_places=2)
    cuenta_origen = models.CharField(max_length=50, blank=True, null=True)
    banco_origen = models.ForeignKey(Banco, on_delete=models.SET_NULL, related_name="pagos_origen", null=True, blank=True)
    titular_origen = models.CharField(max_length=200, blank=True, null=True)
    cuenta_destino = models.CharField(max_length=50, blank=True, null=True)
    banco_destino = models.ForeignKey(Banco, on_delete=models.SET_NULL, related_name="pagos_destino", null=True, blank=True)
    comentarios = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_pago} - {self.monto}"


register_audit(Pago)

# Registro de Auditoría
register_audit(Moneda)
register_audit(Banco)
register_audit(MetodoPago)
register_audit(Proyecto)
register_audit(Cliente)
register_audit(TipoCambio)
register_audit(Vendedor)
register_audit(FormaPago)
register_audit(UPE)
register_audit(PlanPago)
register_audit(EsquemaComision)
register_audit(Presupuesto)
register_audit(Contrato)
register_audit(Pago)

# --- Modelos Contables Financieros (Libro Mayor) ---

class CuentaContable(SoftDeleteModel):
    """Catálogo de Cuentas (SAT / Interno)."""
    TIPO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('PASIVO', 'Pasivo'),
        ('CAPITAL', 'Capital'),
        ('INGRESOS', 'Ingresos'),
        ('COSTOS', 'Costos'),
        ('GASTOS', 'Gastos'),
        ('ORDEN', 'Cuentas de Orden'),
    ]
    NATURALEZA_CHOICES = [('DEUDORA', 'Deudora'), ('ACREEDORA', 'Acreedora')]
    
    codigo = models.CharField(max_length=50, unique=True, help_text="Ej. 100-01-000")
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    naturaleza = models.CharField(max_length=15, choices=NATURALEZA_CHOICES)
    codigo_agrupador_sat = models.CharField(max_length=20, blank=True, null=True)
    cuenta_padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcuentas')
    afectable = models.BooleanField(default=True, help_text="Si es false, es cuenta de acumulación")
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class CentroCostos(SoftDeleteModel):
    """Segmentación de gastos."""
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    proyecto_relacionado = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Poliza(SoftDeleteModel):
    """Header de Asiento Contable."""
    TIPO_POLIZA_CHOICES = [
        ('DIARIO', 'Diario'),
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso'),
        ('CHEQUE', 'Cheque'),
        ('ORDEN', 'Orden'),
    ]
    
    fecha = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_POLIZA_CHOICES)
    numero = models.IntegerField() # Consecutivo por tipo/mes
    concepto = models.CharField(max_length=255)
    
    # Claves foraneas opcionales para trazabilidad
    origen_modulo = models.CharField(max_length=50, blank=True, null=True, help_text="Ej. COMPRAS, NOMINA")
    origen_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID del documento origen")
    
    # Totales para integridad
    total_debe = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_haber = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cuadrada = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.tipo} {self.numero} - {self.concepto}"

class DetallePoliza(SoftDeleteModel):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='detalles')
    cuenta = models.ForeignKey(CuentaContable, on_delete=models.PROTECT)
    concepto = models.CharField(max_length=200, blank=True, null=True) # Concepto por linea
    debe = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    haber = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    referencia = models.CharField(max_length=50, blank=True, null=True) # Factura, Cheque
    centro_costos = models.ForeignKey(CentroCostos, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.cuenta} | D:{self.debe} H:{self.haber}"

register_audit(CentroCostos)
register_audit(Poliza)
register_audit(DetallePoliza)


# --- Facturación (Fiscal) ---

class Factura(SoftDeleteModel):
    """Repositorio de Facturas (CFDIs) Emitidas y Recibidas."""
    TIPO_COMPROBANTE_CHOICES = [
        ('I', 'Ingreso'),
        ('E', 'Egreso'),
        ('P', 'Pago'),
        ('N', 'Nómina'),
        ('T', 'Traslado'),
    ]
    ESTADO_CHOICES = [
        ('VIGENTE', 'Vigente'), 
        ('CANCELADO', 'Cancelado'),
        ('PENDIENTE', 'Pendiente de Timbrado') # Para facturación interna antes de timbrar
    ]

    version = models.CharField(max_length=5, default='4.0')
    uuid = models.CharField(max_length=36, unique=True, null=True, blank=True, help_text="Folio Fiscal (UUID) del SAT")
    serie = models.CharField(max_length=20, blank=True, null=True)
    folio = models.CharField(max_length=20, blank=True, null=True)
    fecha_emision = models.DateTimeField()
    fecha_timbrado = models.DateTimeField(null=True, blank=True)
    
    # Emisor
    emisor_rfc = models.CharField(max_length=13)
    emisor_nombre = models.CharField(max_length=255)
    emisor_regimen = models.CharField(max_length=10, blank=True, null=True)
    
    # Receptor
    receptor_rfc = models.CharField(max_length=13)
    receptor_nombre = models.CharField(max_length=255)
    receptor_regimen = models.CharField(max_length=10, blank=True, null=True)
    uso_cfdi = models.CharField(max_length=10, blank=True, null=True)
    
    # Totales
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    descuento = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    impuestos_trasladados = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    impuestos_retenidos = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT, null=True, blank=True)
    tipo_cambio = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    
    tipo_comprobante = models.CharField(max_length=1, choices=TIPO_COMPROBANTE_CHOICES, default='I')
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.SET_NULL, null=True, blank=True) # Podría requerir ajuste si FormaPago actual no es compatible con SAT c_FormaPago
    
    estado_sat = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='VIGENTE')
    
    # Archivos
    xml_archivo = models.FileField(upload_to='facturas/xml/%Y/%m/', blank=True, null=True)
    pdf_archivo = models.FileField(upload_to='facturas/pdf/%Y/%m/', blank=True, null=True)
    
    # Relaciones internas (opcionales para vincular con operación)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    
    def __str__(self):
        return f"{self.serie or ''}{self.folio or ''} - {self.receptor_nombre} - ${self.total}"

register_audit(Factura)



# --- Certificados y Configuración Fiscal ---

class CertificadoDigital(SoftDeleteModel):
    """Almacén de Certificados (FIEL, CSD) encriptados."""
    TIPO_CERT_CHOICES = [
        ('FIEL', 'Firma Electrónica (FIEL)'),
        ('CSD', 'Certificado de Sello Digital (CSD)'),
    ]
    
    nombre = models.CharField(max_length=100, help_text="Ej. CSD Principal 2024")
    rfc = models.CharField(max_length=13, help_text="RFC al que pertenece el certificado")
    tipo = models.CharField(max_length=10, choices=TIPO_CERT_CHOICES, default='CSD')
    
    # Archivos
    archivo_cer = models.FileField(upload_to='sat/certs/', help_text="Archivo .cer (Público)")
    archivo_key = models.FileField(upload_to='sat/keys/', help_text="Archivo .key (Privado) - Proteger acceso")
    password = models.CharField(max_length=255, help_text="Contraseña de la clave privada (Encriptada)")
    
    # Metadatos
    fecha_inicio_validez = models.DateTimeField(null=True, blank=True)
    fecha_fin_validez = models.DateTimeField(null=True, blank=True)
    numero_serie = models.CharField(max_length=50, blank=True, null=True)
    
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.rfc} - {self.nombre}"

register_audit(CertificadoDigital)


# --- SAT Integración (Buzón & Cumplimiento) ---

class BuzonMensaje(SoftDeleteModel):
    """Mensajes simulados o scrapeados del Buzón Tributario."""
    rfc = models.CharField(max_length=13)
    asunto = models.CharField(max_length=200)
    cuerpo = models.TextField()
    fecha_recibido = models.DateTimeField()
    leido = models.BooleanField(default=False)
    # Importancia: Normal, Alta (Requerimiento)
    es_requerimiento = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.rfc} - {self.asunto}"

class OpinionCumplimiento(SoftDeleteModel):
    """Historial de Opiniones de Cumplimiento (32-D)."""
    ESTADO_CHOICES = [
        ('POSITIVA', 'Positiva'),
        ('NEGATIVA', 'Negativa'),
        ('SIN_OBLIGACIONES', 'Sin Obligaciones'),
    ]
    
    rfc = models.CharField(max_length=13)
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES)
    folio = models.CharField(max_length=50, blank=True, null=True)
    archivo_pdf = models.FileField(upload_to='sat/opiniones/', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.rfc} - {self.estado} ({self.fecha_consulta.date()})"

register_audit(BuzonMensaje)
register_audit(OpinionCumplimiento)


# --- Automatización (Plantillas) ---
from .models_automation import PlantillaAsiento, ReglaAsiento


