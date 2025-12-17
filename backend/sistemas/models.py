from django.db import models
from django.conf import settings
from core.models import BaseModel, SoftDeleteModel, register_audit

class CategoriaEquipo(SoftDeleteModel):
    """Laptops, Monitores, Periféricos, Cables, etc."""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class ModeloEquipo(SoftDeleteModel):
    """
    Catálogo de productos tecnológicos.
    Ej: Dell Latitude 5420 (Inventariable=True)
    Ej: Cable HDMI 1.5m (Inventariable=False)
    """
    categoria = models.ForeignKey(CategoriaEquipo, on_delete=models.PROTECT, related_name='modelos')
    marca = models.CharField(max_length=100)
    nombre = models.CharField(max_length=200) # Modelo específico
    descripcion = models.TextField(blank=True, null=True)
    imagen = models.ImageField(upload_to='sistemas/modelos/', blank=True, null=True)
    
    es_inventariable = models.BooleanField(default=True, help_text="Si es True, se gestiona por número de serie individual (Activos). Si es False, es por cantidad (Consumibles/Accesorios).")
    stock_minimo = models.PositiveIntegerField(default=0)
    stock_actual_consumible = models.PositiveIntegerField(default=0, help_text="Solo aplica si no es inventariable")

    def __str__(self):
        return f"{self.marca} {self.nombre}"

class ActivoIT(SoftDeleteModel):
    """
    Equipos individuales con número de serie (Laptops, CPUs, Monitores).
    """
    ESTADO_CHOICES = [
        ('DISPONIBLE', 'Disponible en Stock'),
        ('ASIGNADO', 'Asignado a Empleado'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
        ('GARANTIA', 'En Garantía (Externo)'),
        ('DAÑADO', 'Dañado / Para Baja'),
        ('OBSOLETO', 'Obsoleto'),
        ('BAJA', 'Baja Definitiva'),
    ]

    modelo = models.ForeignKey(ModeloEquipo, on_delete=models.PROTECT, related_name='activos')
    numero_serie = models.CharField(max_length=100, unique=True)
    etiqueta_interno = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text="Código de inventario interno (Asset Tag)")
    
    fecha_compra = models.DateField(blank=True, null=True)
    proveedor = models.CharField(max_length=200, blank=True, null=True)
    factura_compra = models.CharField(max_length=100, blank=True, null=True)
    costo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    tiene_garantia = models.BooleanField(default=False)
    fecha_fin_garantia = models.DateField(blank=True, null=True)
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='DISPONIBLE')
    ubicacion = models.CharField(max_length=100, default='Almacén Sistemas')
    
    # Snapshot actual de asignación (redundante útil para consultas rápidas)
    empleado_asignado = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, null=True, blank=True, related_name='activos_asignados')

    def __str__(self):
        return f"{self.etiqueta_interno or 'S/N'} - {self.modelo}"

class AsignacionEquipo(SoftDeleteModel):
    """
    Documento de Resguardo (Responsiva). Puede incluir multiples equipos.
    """
    empleado = models.ForeignKey('rrhh.Empleado', on_delete=models.PROTECT, related_name='responsivas')
    fecha_asignacion = models.DateField(auto_now_add=True)
    observaciones = models.TextField(blank=True, null=True)
    
    firmada = models.BooleanField(default=False)
    pdf_responsiva = models.FileField(upload_to='sistemas/responsivas/', blank=True, null=True)
    
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return f"Responsiva #{self.id} - {self.empleado}"

class DetalleAsignacion(models.Model):
    asignacion = models.ForeignKey(AsignacionEquipo, on_delete=models.CASCADE, related_name='detalles')
    
    # Opción A: Activo Serializado
    activo = models.ForeignKey(ActivoIT, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Opción B: Consumible / Accesorio
    modelo = models.ForeignKey(ModeloEquipo, on_delete=models.PROTECT, null=True, blank=True)
    cantidad = models.PositiveIntegerField(default=1)
    
    fecha_devolucion = models.DateField(blank=True, null=True)
    devuelto = models.BooleanField(default=False)
    estado_devolucion = models.CharField(max_length=200, blank=True, null=True) # Bueno, Dañado, etc.

    def save(self, *args, **kwargs):
        # Lógica de validación
        if self.activo:
            self.modelo = self.activo.modelo
            self.cantidad = 1
        super().save(*args, **kwargs)

class MovimientoInventario(BaseModel):
    """
    Entradas de Stock (Compras) y Bajas Manuales.
    Las asignaciones se manejan vía AsignacionEquipo, esto es para inventario puro.
    """
    TIPO_CHOICES = [
        ('COMPRA', 'Compra / Ingreso'),
        ('BAJA', 'Baja por Daño/Obsolescencia'),
        ('GARANTIA_SALIDA', 'Envío a Garantía'),
        ('GARANTIA_RETORNO', 'Retorno de Garantía'),
        ('AJUSTE', 'Ajuste de Inventario'),
    ]
    
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    modelo = models.ForeignKey(ModeloEquipo, on_delete=models.PROTECT)
    activo = models.ForeignKey(ActivoIT, on_delete=models.SET_NULL, null=True, blank=True) # Opcional si es consumible
    cantidad = models.IntegerField(help_text="Positivo para entrada, Negativo para salida")
    
    observaciones = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.tipo} - {self.modelo} ({self.cantidad})"

# Auditoría
register_audit(CategoriaEquipo)
register_audit(ModeloEquipo)
register_audit(ActivoIT)
register_audit(AsignacionEquipo)
register_audit(DetalleAsignacion)
