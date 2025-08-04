from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
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
    UserTwoFactor,
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


class UserTwoFactorInline(admin.StackedInline):
    model = UserTwoFactor
    can_delete = False


class UserAdmin(BaseUserAdmin):
    inlines = (UserTwoFactorInline,)


User = get_user_model()

try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:  # pragma: no cover - depends on registration state
    pass

admin.site.register(User, UserAdmin)
