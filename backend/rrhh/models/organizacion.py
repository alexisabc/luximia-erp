from django.db import models
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager

class Departamento(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()
    nombre = models.CharField(max_length=100) # Remove unique=True to allow same name in different companies

    def __str__(self):
        return self.nombre


class Puesto(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name="puestos")

    def __str__(self):
        return self.nombre


class CentroTrabajo(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()
    nombre = models.CharField(max_length=200)
    direccion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class RazonSocial(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()
    nombre_o_razon_social = models.CharField(max_length=200)
    rfc = models.CharField(max_length=13, blank=True, null=True)

    def __str__(self):
        return self.nombre_o_razon_social

register_audit(Departamento)
register_audit(Puesto)
register_audit(CentroTrabajo)
register_audit(RazonSocial)
