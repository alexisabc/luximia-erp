from django.db import models
from django.conf import settings
from core.models import BaseModel, SoftDeleteModel, register_audit

# Importar modelos de Nómina para que sean accesibles desde rrhh.models
from .models_nomina import (
    ConceptoNomina, TablaISR, RenglonTablaISR, ConfiguracionEconomica,
    SubsidioEmpleo, RenglonSubsidio, Nomina, ReciboNomina, DetalleReciboItem,
    TipoConcepto, ClasificacionFiscal
)

# Eliminamos ModeloBaseActivo local y usamos SoftDeleteModel

class Departamento(SoftDeleteModel):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Puesto(SoftDeleteModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name="puestos")

    def __str__(self):
        return self.nombre


class CentroTrabajo(SoftDeleteModel):
    """Catálogo de Centros de Trabajo (Ubicaciones Físicas)."""
    nombre = models.CharField(max_length=200, unique=True)
    direccion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class RazonSocial(SoftDeleteModel):
    """Catálogo de Razones Sociales (Entidades Legales)."""
    nombre_o_razon_social = models.CharField(max_length=200, unique=True)
    rfc = models.CharField(max_length=13, blank=True, null=True)

    def __str__(self):
        return self.nombre_o_razon_social


class Empleado(SoftDeleteModel):
    GENERO_CHOICES = [('M', 'Masculino'), ('F', 'Femenino'), ('O', 'Otro')]

    # Identificación y Relaciones
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="empleado")
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    nombre_completo = models.CharField(max_length=200, blank=True)  # Calculado para compatibilidad
    correo_laboral = models.EmailField(unique=True, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)

    # Jerarquía y Ubicación
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name="subordinados")
    puesto = models.ForeignKey(Puesto, on_delete=models.PROTECT, related_name="empleados")
    departamento = models.ForeignKey(Departamento, on_delete=models.PROTECT, related_name="empleados")
    centro_trabajo = models.ForeignKey(CentroTrabajo, on_delete=models.SET_NULL, null=True, blank=True, related_name="empleados")
    razon_social = models.ForeignKey(RazonSocial, on_delete=models.SET_NULL, null=True, blank=True, related_name="empleados")

    def save(self, *args, **kwargs):
        self.nombre_completo = f"{self.nombres} {self.apellidos}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre_completo or f"{self.nombres} {self.apellidos}"


class EmpleadoDetallePersonal(SoftDeleteModel):
    """Detalles personales consultados con menor frecuencia."""
    empleado = models.OneToOneField(Empleado, on_delete=models.CASCADE, related_name="detalle_personal")
    correo_personal = models.EmailField(blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    nacionalidad = models.CharField(max_length=50, blank=True, null=True)
    domicilio = models.TextField(blank=True, null=True)
    codigo_postal = models.CharField(max_length=10, blank=True, null=True)
    tipo_sangre = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"Detalles de {self.empleado}"


class EmpleadoDocumentacionOficial(SoftDeleteModel):
    """Datos sensibles y legales."""
    empleado = models.OneToOneField(Empleado, on_delete=models.CASCADE, related_name="documentacion_oficial")
    curp = models.CharField(max_length=18, unique=True, blank=True, null=True)
    rfc = models.CharField(max_length=13, unique=True, blank=True, null=True)
    nss = models.CharField(max_length=11, unique=True, blank=True, null=True)
    fecha_alta_imss = models.DateField(blank=True, null=True)
    tipo_regimen = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Documentación de {self.empleado}"


class EmpleadoDatosLaborales(SoftDeleteModel):
    """Relación contractual y salarial."""
    empleado = models.OneToOneField(Empleado, on_delete=models.CASCADE, related_name="datos_laborales")
    fecha_ingreso = models.DateField(blank=True, null=True)
    tipo_contrato = models.CharField(max_length=100, blank=True, null=True)
    periodicidad_pago = models.CharField(max_length=50, blank=True, null=True)
    jornada = models.CharField(max_length=50, blank=True, null=True)
    modalidad_trabajo = models.CharField(max_length=50, blank=True, null=True) # presencial/remoto
    salario_diario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salario_diario_integrado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ingresos_mensuales_brutos = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Datos Laborales de {self.empleado}"


class EmpleadoNominaBancaria(SoftDeleteModel):
    """Información para dispersión de nómina."""
    empleado = models.OneToOneField(Empleado, on_delete=models.CASCADE, related_name="nomina_bancaria")
    metodo_pago = models.ForeignKey('contabilidad.MetodoPago', on_delete=models.SET_NULL, null=True, blank=True)
    banco = models.ForeignKey('contabilidad.Banco', on_delete=models.SET_NULL, null=True, blank=True)
    numero_cuenta = models.CharField(max_length=20, blank=True, null=True)
    clabe = models.CharField(max_length=18, blank=True, null=True)
    tipo_cuenta = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Nómina de {self.empleado}"


class EmpleadoCreditoInfonavit(SoftDeleteModel):
    """Descuentos fijos (Infonavit, Fonacot, etc). Relación 1:N."""
    TIPO_DESCUENTO_CHOICES = [('CUOTA_FIJA', 'Cuota Fija'), ('PORCENTAJE', 'Porcentaje')]
    
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name="creditos_infonavit")
    tipo_descuento = models.CharField(max_length=20, choices=TIPO_DESCUENTO_CHOICES)
    monto_o_porcentaje = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_inicio = models.DateField(blank=True, null=True)
    descripcion = models.CharField(max_length=200, blank=True, null=True) # Para diferenciar Infonavit/Fonacot/etc

    def __str__(self):
        return f"Crédito {self.descripcion} - {self.empleado}"


class EmpleadoContactoEmergencia(SoftDeleteModel):
    """Contactos de emergencia. Relación 1:N."""
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name="contactos_emergencia")
    nombre = models.CharField(max_length=200)
    parentesco = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20)
    direccion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Contacto {self.nombre} - {self.empleado}"


class NominaCentralizada(SoftDeleteModel):
    """
    Modelo unificado para importar datos históricos de nómina (funnel/embudo).
    Estructura plana para facilitar reportes y visualización.
    """
    # Auditoría de carga
    archivo_origen = models.CharField(max_length=255, blank=True, null=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    
    # Campos base
    esquema = models.CharField(max_length=50, default="FISCAL")
    tipo = models.CharField(max_length=50, default="QUINCENAL")
    periodo = models.CharField(max_length=50, default="1")
    empresa = models.CharField(max_length=200) # Nombre de la hoja o razón social
    
    # Datos empleado
    codigo = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(max_length=255)
    departamento = models.CharField(max_length=200, blank=True, null=True)
    puesto = models.CharField(max_length=200, blank=True, null=True)
    
    # Percepciones y datos base
    neto_mensual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sueldo_diario = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="SDO")
    dias_trabajados = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="DIAS")
    sueldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Prestaciones
    vacaciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prima_vacacional = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    aguinaldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    retroactivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subsidio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_percepciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deducciones Individuales
    isr = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    imss = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prestamo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    infonavit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deducciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Costos Patronales
    isn = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Impuesto Sobre Nómina")
    previo_costo_social = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_carga_social = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totales
    total_nomina = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nominas_y_costos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comision = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_facturacion = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.empresa} - {self.nombre} ({self.periodo})"


# Registro de Auditoría
register_audit(Departamento)
register_audit(Puesto)
register_audit(CentroTrabajo)
register_audit(RazonSocial)
register_audit(Empleado)
register_audit(EmpleadoDetallePersonal)
register_audit(EmpleadoDocumentacionOficial)
register_audit(EmpleadoDatosLaborales)
register_audit(EmpleadoNominaBancaria)
register_audit(EmpleadoCreditoInfonavit)
register_audit(EmpleadoContactoEmergencia)
register_audit(NominaCentralizada)

from django.utils.translation import gettext_lazy as _

class PeriodoNomina(models.Model):
    TIPO_CHOICES = [
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
    ]

    anio = models.IntegerField(verbose_name=_("Año"))
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name=_("Tipo de Nómina"))
    numero = models.IntegerField(verbose_name=_("Número de Periodo"))
    fecha_inicio = models.DateField(verbose_name=_("Fecha Inicio"))
    fecha_fin = models.DateField(verbose_name=_("Fecha Fin"))
    activo = models.BooleanField(default=True, verbose_name=_("Activo"))

    class Meta:
        verbose_name = _("Periodo de Nómina")
        verbose_name_plural = _("Periodos de Nómina")
        ordering = ['anio', 'tipo', 'numero']
        unique_together = ['anio', 'tipo', 'numero']

    def __str__(self):
        return f"{self.get_tipo_display()} {self.anio} - Periodo {self.numero} ({self.fecha_inicio} al {self.fecha_fin})"

register_audit(PeriodoNomina)
