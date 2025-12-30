from django.contrib import admin
from .models import Proveedor, Insumo, OrdenCompra, DetalleOrdenCompra, Almacen, MovimientoInventario, Existencia

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('razon_social', 'rfc', 'tipo_persona', 'dias_credito')
    search_fields = ('razon_social', 'rfc')

@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descripcion', 'costo_promedio', 'unidad_medida', 'tipo')
    list_filter = ('tipo', 'unidad_medida')
    search_fields = ('codigo', 'descripcion')
    readonly_fields = ('costo_promedio', 'ultimo_costo') # Blindaje: Solo el KardexService puede calcular esto

class DetalleOrdenCompraInline(admin.TabularInline):
    model = DetalleOrdenCompra
    extra = 1

@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    list_display = ('folio', 'proveedor', 'fecha_solicitud', 'total', 'estado')
    list_filter = ('estado', 'fecha_solicitud')
    search_fields = ('folio', 'proveedor__razon_social')
    inlines = [DetalleOrdenCompraInline]

@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'activo')
    search_fields = ('codigo', 'nombre')

@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'insumo', 'almacen', 'cantidad', 'tipo_movimiento', 'referencia')
    list_filter = ('tipo_movimiento', 'almacen', 'fecha')
    search_fields = ('insumo__codigo', 'referencia')
    date_hierarchy = 'fecha'
    
    # Bitácora inmutable
    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

@admin.register(Existencia)
class ExistenciaAdmin(admin.ModelAdmin):
    list_display = ('insumo', 'almacen', 'cantidad')
    list_filter = ('almacen',)
    search_fields = ('insumo__codigo', 'insumo__descripcion')
    
    # El stock es sagrado: ReadOnly total
    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
