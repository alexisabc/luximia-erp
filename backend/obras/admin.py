from django.contrib import admin
from django.utils.html import format_html
from .models import Obra, CentroCosto, PartidaPresupuestal

@admin.register(Obra)
class ObraAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'fecha_inicio', 'presupuesto_total', 'activo')
    search_fields = ('codigo', 'nombre')

@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ('indented_name', 'codigo', 'es_hoja', 'obra', 'nivel')
    list_filter = ('obra', 'nivel', 'es_hoja')
    ordering = ('obra', 'codigo')
    
    def indented_name(self, obj):
        return format_html(
            '<span style="padding-left: {}px\">{}</span>',
            obj.nivel * 20,
            obj.nombre
        )
    indented_name.short_description = "Centro de Costo"

@admin.register(PartidaPresupuestal)
class PartidaPresupuestalAdmin(admin.ModelAdmin):
    list_display = ('centro_costo', 'categoria', 'monto_estimado', 'disponible')
    list_filter = ('categoria', 'centro_costo__obra')
