# backend/cxc/admin.py
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
    # Asegúrate de que todos tus otros modelos de cxc estén aquí
    MetodoPago,
    Presupuesto,
    Contrato,
    TipoCambio,
    Vendedor,
    FormaPago,
    PlanPago,
    EsquemaComision,
)

# Registra aquí solo los modelos de la app 'cxc'
admin.site.register(Banco)
admin.site.register(Proyecto)
admin.site.register(UPE)
admin.site.register(Cliente)
admin.site.register(Pago)
admin.site.register(Moneda)
admin.site.register(Departamento)
admin.site.register(Puesto)
admin.site.register(Empleado)
admin.site.register(MetodoPago)
admin.site.register(Presupuesto)
admin.site.register(Contrato)
admin.site.register(TipoCambio)
admin.site.register(Vendedor)
admin.site.register(FormaPago)
admin.site.register(PlanPago)
admin.site.register(EsquemaComision)
