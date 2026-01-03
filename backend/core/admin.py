from django.contrib import admin
from .models import Empresa, SystemSetting, FeatureFlag


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre_comercial', 'rfc', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre_comercial', 'razon_social', 'rfc']
    ordering = ['codigo']


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    """Admin para configuraciones del sistema"""
    
    list_display = ['key', 'category', 'value_preview', 'is_public', 'modified_by', 'updated_at']
    list_filter = ['category', 'is_public', 'created_at']
    search_fields = ['key', 'description']
    ordering = ['category', 'key']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('key', 'value', 'category')
        }),
        ('Configuración', {
            'fields': ('description', 'is_public')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
    
    def value_preview(self, obj):
        """Muestra un preview del valor"""
        value_str = str(obj.value)
        return value_str[:50] + '...' if len(value_str) > 50 else value_str
    value_preview.short_description = 'Valor'
    
    def save_model(self, request, obj, form, change):
        """Asignar usuario que modifica"""
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    """Admin para feature flags"""
    
    list_display = ['code', 'name', 'is_active_display', 'rollout_percentage', 'created_by', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['code']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    filter_horizontal = ['allowed_users']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'name', 'description')
        }),
        ('Configuración', {
            'fields': ('is_active', 'rollout_percentage')
        }),
        ('Restricciones de Acceso', {
            'fields': ('allowed_users', 'allowed_roles'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def is_active_display(self, obj):
        """Muestra el estado con emoji"""
        return "✅ Activo" if obj.is_active else "❌ Inactivo"
    is_active_display.short_description = 'Estado'
    
    def save_model(self, request, obj, form, change):
        """Asignar usuario creador"""
        if not change:  # Solo en creación
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
