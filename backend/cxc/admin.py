from django.contrib import admin
from .models import (
    Banco,
    Proyecto,
    UPE,
    Cliente,
    Pago,
    Moneda,
    Departamento,
    Puesto,
    Empleado,
)

admin.site.register(Banco)
admin.site.register(Proyecto)
admin.site.register(UPE)
admin.site.register(Cliente)
admin.site.register(Pago)
admin.site.register(Moneda)
admin.site.register(Departamento)
admin.site.register(Puesto)
admin.site.register(Empleado)
