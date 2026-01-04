from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, BaseModel, register_audit
from datetime import date

class CategoriaActivo(BaseModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    porcentaje_depreciacion_anual = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0,
        help_text="Porcentaje sugerido de depreciación anual (0-100)"
    )

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Categoría de Activo"
        verbose_name_plural = "Categorías de Activos"


class ActivoFijo(SoftDeleteModel):
    ESTADO_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('EN_USO', 'En Uso / Asignado'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
        ('BAJA', 'Baja / Vendido / Desechado'),
    ]
    
    # Identificación
    codigo = models.CharField(max_length=50, unique=True, help_text="Código interno, Placa o QR")
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    categoria = models.ForeignKey(CategoriaActivo, on_delete=models.PROTECT, related_name='activos')
    
    # Datos Técnicos (Opcional, para maquinaria)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    serie = models.CharField(max_length=100, blank=True, null=True, help_text="Número de Serie del Fabricante")
    
    # Datos Financieros (Origen)
    fecha_adquisicion = models.DateField(default=date.today)
    costo_adquisicion = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    proveedor = models.ForeignKey('compras.Proveedor', on_delete=models.SET_NULL, null=True, blank=True)
    orden_compra = models.ForeignKey('compras.OrdenCompra', on_delete=models.SET_NULL, null=True, blank=True)
    factura_uuid = models.CharField(max_length=36, blank=True, null=True, help_text="UUID de la factura de compra")
    
    # Depreciación
    vida_util_anios = models.IntegerField(default=10)
    valor_residual = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Valor estimado al final de su vida útil")
    valor_actual = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Valor en libros actual")
    
    # Estado Operativo
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='DISPONIBLE')
    obra_actual = models.ForeignKey(
        'obras.Obra', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='activos_asignados',
        help_text="Ubicación física actual"
    )
    responsable_actual = models.ForeignKey(
        'rrhh.Empleado', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='activos_resguardados'
    )
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    class Meta:
        verbose_name = "Activo Fijo"
        verbose_name_plural = "Activos Fijos"
        ordering = ['codigo']


class AsignacionActivo(SoftDeleteModel):
    """
    Historial de movimientos y asignaciones del activo.
    """
    activo = models.ForeignKey(ActivoFijo, on_delete=models.CASCADE, related_name='historial_asignaciones')
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_retorno = models.DateTimeField(blank=True, null=True)
    
    obra_destino = models.ForeignKey('obras.Obra', on_delete=models.PROTECT, null=True, blank=True)
    empleado_responsable = models.ForeignKey('rrhh.Empleado', on_delete=models.PROTECT, null=True, blank=True)
    
    observaciones = models.TextField(blank=True, null=True)
    
    asignado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.activo} -> {self.obra_destino or self.empleado_responsable}"

class HistorialDepreciacion(BaseModel):
    activo = models.ForeignKey(ActivoFijo, on_delete=models.CASCADE, related_name='depreciaciones')
    fecha = models.DateField(default=date.today)
    monto = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monto depreciado este periodo")
    
    valor_libro_anterior = models.DecimalField(max_digits=14, decimal_places=2)
    valor_libro_nuevo = models.DecimalField(max_digits=14, decimal_places=2)
    
    poliza_generada = models.CharField(max_length=50, blank=True, null=True, help_text="Folio de la póliza contable")

    def __str__(self):
        return f"{self.activo} - {self.fecha} - ${self.monto}"

    class Meta:
        verbose_name = "Historial de Depreciación"
        verbose_name_plural = "Historial de Depreciaciones"
        ordering = ['-fecha']


register_audit(ActivoFijo)
register_audit(AsignacionActivo)
register_audit(HistorialDepreciacion)
