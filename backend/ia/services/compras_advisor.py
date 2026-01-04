from django.db.models import Min, Avg
from compras.models import DetalleOrdenCompra

class ComprasAdvisor:
    @staticmethod
    def sugerir_mejor_precio(insumo_id):
        """
        Analiza el historial de compras para sugerir el mejor proveedor.
        Retorna top 3 proveedores con mejor precio histórico.
        """
        historico = DetalleOrdenCompra.objects.filter(
            insumo_id=insumo_id,
            orden__estado__in=['AUTORIZADA', 'COMPLETADA', 'PARCIALMENTE_SURTIDA']
        ).values(
            'orden__proveedor__razon_social', 
            'orden__proveedor_id'
        ).annotate(
            min_precio=Min('precio_unitario'),
            avg_precio=Avg('precio_unitario')
        ).order_by('min_precio')[:3]
        
        sugerencias = []
        for h in historico:
            sugerencias.append({
                'proveedor': h['orden__proveedor__razon_social'],
                'mejor_precio': float(h['min_precio']),
                'promedio': round(float(h['avg_precio']), 2)
            })
            
        return sugerencias
