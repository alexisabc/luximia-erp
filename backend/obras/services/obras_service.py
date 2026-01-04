from ..models import Obra, CentroCosto, PartidaPresupuestal
from django.db import transaction
from decimal import Decimal

class ObrasService:
    @staticmethod
    @transaction.atomic
    def crear_arbol_costos(obra_id, estructura_json):
        """
        Crea o actualiza la estructura de centros de costos.
        """
        obra = Obra.objects.get(pk=obra_id)
        
        def procesar_nodo(nodo_data, padre=None, nivel=0):
            cc, created = CentroCosto.objects.update_or_create(
                obra=obra,
                codigo=nodo_data['codigo'],
                defaults={
                    'nombre': nodo_data['nombre'],
                    'padre': padre,
                    'nivel': nivel,
                    'es_hoja': nodo_data.get('es_hoja', False)
                }
            )
            
            if cc.es_hoja and 'partidas' in nodo_data:
                for part in nodo_data['partidas']:
                    PartidaPresupuestal.objects.update_or_create(
                        centro_costo=cc,
                        categoria=part['categoria'],
                        defaults={'monto_estimado': part.get('monto', 0)}
                    )
            
            children = nodo_data.get('children', [])
            for child in children:
                procesar_nodo(child, padre=cc, nivel=nivel+1)
                
        for nodo_raiz in estructura_json:
            procesar_nodo(nodo_raiz)
            
        return True

    @staticmethod
    def validar_suficiencia(centro_costo_id, categoria, monto):
        try:
            partida = PartidaPresupuestal.objects.get(
                centro_costo_id=centro_costo_id,
                categoria=categoria
            )
        except PartidaPresupuestal.DoesNotExist:
            return False, f"No existe partida presupuestal para {categoria} en este centro de costo."

        disponible = partida.disponible
        if monto > disponible:
            return False, f"Saldo insuficiente. Disponible: ${disponible:,.2f}, Requerido: ${monto:,.2f}"
            
        return True, "Suficiencia validada."

    @staticmethod
    def comprometer_presupuesto(centro_costo_id, categoria, monto):
        try:
            partida = PartidaPresupuestal.objects.get(
                centro_costo_id=centro_costo_id,
                categoria=categoria
            )
            partida.monto_comprometido += Decimal(str(monto))
            partida.save()
            return True
        except PartidaPresupuestal.DoesNotExist:
             return False

    @staticmethod
    def devengar_presupuesto(centro_costo_id, categoria, monto):
        try:
            partida = PartidaPresupuestal.objects.get(
                centro_costo_id=centro_costo_id,
                categoria=categoria
            )
            monto_dec = Decimal(str(monto))
            partida.monto_comprometido -= monto_dec
            partida.monto_ejecutado += monto_dec
            partida.save()
            return True
        except PartidaPresupuestal.DoesNotExist:
             return False
