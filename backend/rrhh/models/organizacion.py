from django.db import models
from core.models import SoftDeleteModel, register_audit

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

register_audit(Departamento)
register_audit(Puesto)
register_audit(CentroTrabajo)
register_audit(RazonSocial)
