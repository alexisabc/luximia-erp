from django.contrib import admin
from .models import Proyecto, Cliente, UPE, Contrato, Pago, Departamento, Puesto, Empleado

# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Proyecto)
admin.site.register(Cliente)
admin.site.register(UPE)
admin.site.register(Contrato)
admin.site.register(Pago)
admin.site.register(Departamento)
admin.site.register(Puesto)
admin.site.register(Empleado)
