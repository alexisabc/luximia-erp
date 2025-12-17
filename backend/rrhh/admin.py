from django.contrib import admin
from .models import (
    Departamento,
    Puesto,
    Empleado,
    CentroTrabajo,
    RazonSocial,
    EmpleadoDetallePersonal,
    EmpleadoDocumentacionOficial,
    EmpleadoDatosLaborales,
    EmpleadoNominaBancaria,
    EmpleadoCreditoInfonavit,
    EmpleadoContactoEmergencia,
)

admin.site.register(Departamento)
admin.site.register(Puesto)
admin.site.register(Empleado)
admin.site.register(CentroTrabajo)
admin.site.register(RazonSocial)
admin.site.register(EmpleadoDetallePersonal)
admin.site.register(EmpleadoDocumentacionOficial)
admin.site.register(EmpleadoDatosLaborales)
admin.site.register(EmpleadoNominaBancaria)
admin.site.register(EmpleadoCreditoInfonavit)
admin.site.register(EmpleadoContactoEmergencia)
