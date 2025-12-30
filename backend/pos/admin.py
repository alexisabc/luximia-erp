from django.contrib import admin
from .models import (
    Producto, Caja, Turno, Venta, DetalleVenta, 
    CuentaCliente, MovimientoSaldoCliente, MovimientoCaja
)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'precio_lista', 'unidad_medida')
    search_fields = ('nombre', 'codigo')

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sucursal', 'activo')

class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 0

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('folio', 'cliente', 'total', 'estado', 'fecha', 'metodo_pago')
    list_filter = ('estado', 'metodo_pago', 'fecha')
    inlines = [DetalleVentaInline]
    date_hierarchy = 'fecha'

@admin.register(CuentaCliente)
class CuentaClienteAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'saldo', 'limite_credito', 'credito_disponible')
    search_fields = ('cliente__nombre_completo',)

@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'caja', 'fecha_inicio', 'estado', 'diferencia')
    list_filter = ('estado', 'fecha_inicio')

admin.site.register(MovimientoSaldoCliente)
admin.site.register(MovimientoCaja)
