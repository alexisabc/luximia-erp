from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import SoftDeleteModel, register_audit

class SolicitudVacaciones(SoftDeleteModel):
    ESTATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('CANCELADO', 'Cancelado'),
    ]

    empleado = models.ForeignKey('Empleado', on_delete=models.CASCADE, related_name="solicitudes_vacaciones")
    fecha_inicio = models.DateField(verbose_name=_("Fecha Inicio"))
    fecha_fin = models.DateField(verbose_name=_("Fecha Fin"))
    dias_solicitados = models.IntegerField(verbose_name=_("Días Solicitados"))
    motivo = models.TextField(blank=True, null=True, verbose_name=_("Motivo"))
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='PENDIENTE', verbose_name=_("Estatus"))
    fecha_solicitud = models.DateTimeField(auto_now_add=True, verbose_name=_("Fecha de Solicitud"))
    observaciones_rh = models.TextField(blank=True, null=True, verbose_name=_("Observaciones RH"))

    class Meta:
        verbose_name = _("Solicitud de Vacaciones")
        verbose_name_plural = _("Solicitudes de Vacaciones")
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Vacaciones {self.empleado} ({self.fecha_inicio} - {self.fecha_fin})"

class SolicitudPermiso(SoftDeleteModel):
    ESTATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado'),
        ('CANCELADO', 'Cancelado'),
    ]
    TIPO_CHOICES = [
        ('PERSONAL', 'Personal'),
        ('MEDICO_CITA', 'Cita Médica'),
        ('TRAMITE', 'Trámite'),
        ('OTRO', 'Otro'),
    ]

    empleado = models.ForeignKey('Empleado', on_delete=models.CASCADE, related_name="solicitudes_permisos")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='PERSONAL', verbose_name=_("Tipo de Permiso"))
    fecha = models.DateField(verbose_name=_("Fecha"))
    horas = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, verbose_name=_("Horas (si aplica)"))
    motivo = models.TextField(verbose_name=_("Motivo"))
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='PENDIENTE', verbose_name=_("Estatus"))
    fecha_solicitud = models.DateTimeField(auto_now_add=True, verbose_name=_("Fecha de Solicitud"))
    observaciones_rh = models.TextField(blank=True, null=True, verbose_name=_("Observaciones RH"))

    class Meta:
        verbose_name = _("Solicitud de Permiso")
        verbose_name_plural = _("Solicitudes de Permisos")
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Permiso {self.empleado} - {self.fecha}"

class Incapacidad(SoftDeleteModel):
    TIPO_CHOICES = [
        ('EG', 'Enfermedad General'),
        ('RT', 'Riesgo de Trabajo'),
        ('MA', 'Maternidad'),
    ]
    ESTATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente de Validación'),
        ('VALIDADO', 'Validado'),
        ('RECHAZADO', 'Rechazado'),
    ]

    empleado = models.ForeignKey('Empleado', on_delete=models.CASCADE, related_name="incapacidades")
    tipo = models.CharField(max_length=5, choices=TIPO_CHOICES, verbose_name=_("Tipo de Incapacidad"))
    folio_imss = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Folio IMSS"))
    fecha_inicio = models.DateField(verbose_name=_("Fecha Inicio"))
    fecha_fin = models.DateField(verbose_name=_("Fecha Fin"))
    dias = models.IntegerField(verbose_name=_("Días"))
    documento_adjunto = models.FileField(upload_to='incapacidades/%Y/%m/', blank=True, null=True, verbose_name=_("Certificado Incapacidad"))
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='PENDIENTE', verbose_name=_("Estatus"))
    
    observaciones = models.TextField(blank=True, null=True, verbose_name=_("Observaciones"))

    class Meta:
        verbose_name = _("Incapacidad")
        verbose_name_plural = _("Incapacidades")
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Incapacidad {self.tipo} - {self.empleado} ({self.dias} días)"

class DocumentoExpediente(SoftDeleteModel):
    TIPO_DOC_CHOICES = [
        ('INE', 'INE / Identificación Oficial'),
        ('CURP', 'CURP'),
        ('ACTA_NACIMIENTO', 'Acta de Nacimiento'),
        ('CSF', 'Constancia de Situación Fiscal'),
        ('TITULO', 'Título Profesional'),
        ('CEDULA', 'Cédula Profesional'),
        ('COMPROBANTE_DOMICILIO', 'Comprobante de Domicilio'),
        ('NSS', 'Número de Seguridad Social'),
        ('RFC', 'RFC'),
        ('CV', 'Curriculum Vitae'),
        ('OTRO', 'Otro'),
    ]
    ESTATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente de Revisión'),
        ('APROBADO', 'Aprobado'),
        ('RECHAZADO', 'Rechazado (No legible/Incorrecto)'),
    ]

    empleado = models.ForeignKey('Empleado', on_delete=models.CASCADE, related_name="documentos_expediente")
    tipo_documento = models.CharField(max_length=50, choices=TIPO_DOC_CHOICES, verbose_name=_("Tipo de Documento"))
    archivo = models.FileField(upload_to='expedientes/%Y/%m/', verbose_name=_("Archivo"))
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='PENDIENTE', verbose_name=_("Estatus"))
    fecha_subida = models.DateTimeField(auto_now_add=True, verbose_name=_("Fecha de Subida"))
    comentarios = models.TextField(blank=True, null=True, verbose_name=_("Comentarios / Razón Rechazo"))

    class Meta:
        verbose_name = _("Documento de Expediente")
        verbose_name_plural = _("Documentos de Expediente")
        ordering = ['empleado', 'tipo_documento']

    def __str__(self):
        return f"{self.get_tipo_documento_display()} - {self.empleado}"

register_audit(SolicitudVacaciones)
register_audit(SolicitudPermiso)
register_audit(Incapacidad)
register_audit(DocumentoExpediente)
