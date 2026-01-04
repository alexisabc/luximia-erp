from django.db import transaction
from obras.models import ActividadProyecto, DependenciaActividad

class SchedulingService:
    """
    Servicio para cálculo de Ruta Crítica (Critical Path Method - CPM).
    """
    
    @staticmethod
    def calcular_ruta_critica(obra_id):
        """
        Implementa el algoritmo CPM para identificar la ruta crítica.
        
        Pasos:
        1. Forward Pass: Calcular Early Start y Early Finish
        2. Backward Pass: Calcular Late Start y Late Finish
        3. Calcular Holgura (Slack) = Late Start - Early Start
        4. Identificar Ruta Crítica (actividades con holgura = 0)
        """
        actividades = ActividadProyecto.objects.filter(
            obra_id=obra_id,
            deleted_at__isnull=True
        ).prefetch_related('predecesoras', 'sucesoras')
        
        if not actividades.exists():
            return {'error': 'No hay actividades en este proyecto'}
        
        # Convertir a diccionario para fácil acceso
        act_dict = {act.id: act for act in actividades}
        
        # 1. FORWARD PASS (Early Start/Finish)
        # Inicializar actividades sin predecesoras
        for act in actividades:
            deps = act.predecesoras.filter(deleted_at__isnull=True)
            if not deps.exists():
                act.early_start = 0
                act.early_finish = act.duracion_dias
        
        # Iterar hasta que todas tengan ES/EF
        max_iterations = len(actividades) * 2
        iteration = 0
        while iteration < max_iterations:
            cambios = False
            for act in actividades:
                if act.early_start is not None:
                    continue  # Ya calculada
                
                # Obtener predecesoras
                deps = act.predecesoras.filter(deleted_at__isnull=True)
                if all(dep.actividad_predecesora.early_finish is not None for dep in deps):
                    # Todas las predecesoras tienen EF calculado
                    max_ef = 0
                    for dep in deps:
                        pred = dep.actividad_predecesora
                        if dep.tipo == 'FS':  # Finish-to-Start
                            max_ef = max(max_ef, pred.early_finish + dep.lag_dias)
                        # Otros tipos de dependencia se pueden agregar aquí
                    
                    act.early_start = max_ef
                    act.early_finish = act.early_start + act.duracion_dias
                    cambios = True
            
            if not cambios:
                break
            iteration += 1
        
        # 2. BACKWARD PASS (Late Start/Finish)
        # Encontrar la duración total del proyecto
        max_ef = max((act.early_finish for act in actividades if act.early_finish is not None), default=0)
        
        # Inicializar actividades sin sucesoras (finales)
        for act in actividades:
            deps = act.sucesoras.filter(deleted_at__isnull=True)
            if not deps.exists():
                act.late_finish = max_ef
                act.late_start = act.late_finish - act.duracion_dias
        
        # Iterar hacia atrás
        iteration = 0
        while iteration < max_iterations:
            cambios = False
            for act in actividades:
                if act.late_start is not None:
                    continue
                
                # Obtener sucesoras
                deps = act.sucesoras.filter(deleted_at__isnull=True)
                if all(dep.actividad_sucesora.late_start is not None for dep in deps):
                    min_ls = max_ef
                    for dep in deps:
                        suc = dep.actividad_sucesora
                        if dep.tipo == 'FS':
                            min_ls = min(min_ls, suc.late_start - dep.lag_dias)
                    
                    act.late_finish = min_ls
                    act.late_start = act.late_finish - act.duracion_dias
                    cambios = True
            
            if not cambios:
                break
            iteration += 1
        
        # 3. Calcular Holgura y marcar Ruta Crítica
        with transaction.atomic():
            for act in actividades:
                if act.early_start is not None and act.late_start is not None:
                    act.holgura = act.late_start - act.early_start
                    act.es_critica = (act.holgura == 0)
                    act.save()
        
        # Retornar resumen
        criticas = [act for act in actividades if act.es_critica]
        return {
            'total_actividades': len(actividades),
            'duracion_proyecto': max_ef,
            'actividades_criticas': len(criticas),
            'ruta_critica': [act.codigo for act in criticas]
        }
