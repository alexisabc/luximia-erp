from django.contrib import admin

from .models import Proyecto, Cliente, UPE, Contrato, Pago, PlanPago

from .models import Proyecto, Cliente, UPE, Contrato, Pago, FormaPago


from .models import Proyecto, Cliente, Departamento, Puesto, UPE, Contrato, Pago


# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Proyecto)
admin.site.register(Cliente)
admin.site.register(Departamento)
admin.site.register(Puesto)
admin.site.register(UPE)

admin.site.register(Contrato)
admin.site.register(Pago)
admin.site.register(FormaPago)

admin.site.register(Contrato)
admin.site.register(Pago)


from .models import Proyecto, Cliente, Vendedor, UPE, Contrato, Pago

# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Proyecto)
admin.site.register(Cliente)
admin.site.register(Vendedor)
admin.site.register(UPE)
admin.site.register(Contrato)
admin.site.register(Pago)


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

from .models import Proyecto, Cliente, Departamento, UPE, Contrato, Pago

# Registramos los modelos para que aparezcan en el panel de admin
admin.site.register(Proyecto)
admin.site.register(Cliente)

admin.site.register(UPE)
admin.site.register(Contrato)
admin.site.register(Pago)
admin.site.register(PlanPago)

admin.site.register(Departamento)
admin.site.register(UPE)
admin.site.register(Contrato)
admin.site.register(Pago)



