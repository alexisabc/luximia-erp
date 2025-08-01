from django.contrib import admin
from .models import Proyecto, Cliente, Departamento, UPE, Contrato, Pago

# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Proyecto)
admin.site.register(Cliente)
admin.site.register(Departamento)
admin.site.register(UPE)
admin.site.register(Contrato)
admin.site.register(Pago)
