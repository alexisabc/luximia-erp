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
