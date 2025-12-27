from decimal import Decimal
from django.db.models import Sum
from .models_nomina import Nomina, ReciboNomina, ConceptoNomina, TipoConcepto
from .models import Empleado

class CalculoPTUService:
    @staticmethod
    def calcular_preliminar(anio, monto_repartir, tope_ingresos_sindicalizado=None):
        """
        Calcula el proyecto de PTU.
        monto_repartir: Total a repartir (10% de la utilidad fiscal).
        tope_ingresos_sindicalizado: Si se provee, es el salario tope para el cálculo de la parte por salarios.
                                     (Suele ser el salario del sindicalizado más alto + 20%).
        """
        monto_repartir = Decimal(monto_repartir)
        monto_dias = monto_repartir / 2
        monto_salarios = monto_repartir / 2

        # 1. Obtener empleados elegibles (Trabajaron en el año, más de 60 días si son eventuales)
        # Por simplicidad, tomamos todos los que tengan recibos en nóminas de ese año
        
        # Filtramos nóminas del año, pagadas (TIMBRADA o CALCULADA)
        nominas_anio = Nomina.objects.filter(
            fecha_pago__year=anio, 
            estado__in=['TIMBRADA', 'CALCULADA']
        )

        empleados_stats = {}
        
        # Iterar recibos para sumar Días y Salarios Devengados (Solo conceptos que suman a PTU)
        # Nota: Normalmente el salario para PTU es el cuota diaria, no el integrado ni con bonos.
        # Aquí asumiremos que 'subtotal' de percepciones tipo SUELDO es la base, o usamos el salario_diario * dias_pagados.
        
        recibos = ReciboNomina.objects.filter(nomina__in=nominas_anio).select_related('empleado')
        
        for recibo in recibos:
            emp_id = recibo.empleado.id
            if emp_id not in empleados_stats:
                empleados_stats[emp_id] = {
                    'empleado': recibo.empleado,
                    'dias_trabajados': Decimal(0),
                    'salario_devengado': Decimal(0)
                }
            
            # Sumar días
            empleados_stats[emp_id]['dias_trabajados'] += recibo.dias_pagados
            
            # Sumar salario base para PTU (Simplificado: salario diario * dias)
            # Idealmente se busca el concepto de Sueldo en los detalles, pero esto es una buena aproximación si el recibo guarda salario_diario
            salario_periodo = recibo.salario_diario * recibo.dias_pagados
            empleados_stats[emp_id]['salario_devengado'] += salario_periodo

        # Filtros de Ley (ej. directores generales no participan, eventuales < 60 dias no)
        # Aquí asumiremos que todos los procesados son elegibles, salvo lógica específica de negocio.
        
        lista_final = []
        total_dias_global = sum(e['dias_trabajados'] for e in empleados_stats.values())
        total_salarios_global = sum(e['salario_devengado'] for e in empleados_stats.values())

        if total_dias_global == 0 or total_salarios_global == 0:
            return []

        factor_dias = monto_dias / total_dias_global
        factor_salarios = monto_salarios / total_salarios_global

        for emp_id, stats in empleados_stats.items():
             ptu_dias = stats['dias_trabajados'] * factor_dias
             ptu_salarios = stats['salario_devengado'] * factor_salarios
             
             lista_final.append({
                 'empleado_id': emp_id,
                 'nombre': stats['empleado'].nombre_completo,
                 'dias_trabajados': float(stats['dias_trabajados']),
                 'salario_anual_base': float(stats['salario_devengado']),
                 'ptu_por_dias': float(ptu_dias),
                 'ptu_por_salarios': float(ptu_salarios),
                 'total_ptu': float(ptu_dias + ptu_salarios)
             })
             
        return lista_final
