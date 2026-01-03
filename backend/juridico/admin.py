from django.contrib import admin
from .models import PlantillaLegal, DocumentoFirmado


@admin.register(PlantillaLegal)
class PlantillaLegalAdmin(admin.ModelAdmin):
    """
    Admin para PlantillaLegal.
    """
    list_display = ['titulo', 'tipo', 'activo', 'created_at']
    list_filter = ['tipo', 'activo', 'created_at']
    search_fields = ['titulo', 'descripcion']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('titulo', 'tipo', 'activo', 'descripcion')
        }),
        ('Contenido', {
            'fields': ('contenido', 'variables_disponibles')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DocumentoFirmado)
class DocumentoFirmadoAdmin(admin.ModelAdmin):
    """
    Admin para DocumentoFirmado.
    """
    list_display = [
        'plantilla', 'content_type', 'object_id',
        'estado', 'usuario_firmante', 'fecha_firma'
    ]
    list_filter = ['estado', 'content_type', 'fecha_firma']
    search_fields = ['hash_firma', 'plantilla__titulo']
    readonly_fields = [
        'hash_firma', 'archivo_pdf', 'fecha_firma',
        'datos_firma', 'datos_renderizados',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Documento', {
            'fields': ('plantilla', 'estado', 'archivo_pdf')
        }),
        ('Vinculación', {
            'fields': ('content_type', 'object_id')
        }),
        ('Firma', {
            'fields': ('usuario_firmante', 'fecha_firma', 'hash_firma', 'datos_firma')
        }),
        ('Datos', {
            'fields': ('datos_renderizados',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Los documentos solo se crean vía API"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """No permitir eliminación física (soft delete)"""
        return False
