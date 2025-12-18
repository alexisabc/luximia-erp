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

# Nómina
from .models import (
    Nomina, ReciboNomina, ConceptoNomina, TablaISR, ConfiguracionEconomica, 
    DetalleReciboItem
)

class DetalleReciboInline(admin.TabularInline):
    model = DetalleReciboItem
    extra = 0

class ReciboNominaAdmin(admin.ModelAdmin):
    list_display = ('empleado', 'nomina', 'neto', 'uuid_sat')
    list_filter = ('nomina',)
    inlines = [DetalleReciboInline]

class NominaAdmin(admin.ModelAdmin):
    list_display = ('descripcion', 'fecha_inicio', 'fecha_fin', 'estado')
    list_filter = ('estado', 'tipo')

admin.site.register(Nomina, NominaAdmin)
admin.site.register(ReciboNomina, ReciboNominaAdmin)
admin.site.register(ConceptoNomina)
admin.site.register(TablaISR)
admin.site.register(ConfiguracionEconomica)
