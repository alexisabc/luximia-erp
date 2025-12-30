from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EnrollmentToken, Role

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'es_sistema')
    filter_horizontal = ('permissions',)

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Seguridad ERP', {'fields': ('roles', 'token_version', 'is_active')}),
        ('Multi-empresa', {'fields': ('empresa_principal', 'empresas_acceso', 'ultima_empresa_activa')}),
    )
    filter_horizontal = UserAdmin.filter_horizontal + ('roles', 'empresas_acceso')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(EnrollmentToken)
