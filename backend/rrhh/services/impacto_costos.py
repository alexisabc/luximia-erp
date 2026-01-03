from django.db import transaction
from decimal import Decimal
import logging
from .nomina_engine import NominaEngine
from ..models import Asistencia, DistribucionCosto
from obras.models import PartidaPresupuestal

logger = logging.getLogger(__name__)

class ImpactoCostosService:
    @staticmethod
    @transaction.atomic
    def registrar_impacto_nomina(nomina_periodo):
        """
        Calcula el costo real por empleado y lo distribuye a las obras/partidas.
        """
        # nomina_periodo es una instancia de Nomina (rrhh.models_nomina.Nomina)
        recibos = nomina_periodo.recibos.all()
        
        for recibo in recibos:
            empleado = recibo.empleado
            # Usaremos el subtotal (Percepciones Brutas) para el impacto en costo
            costo_total = Decimal(str(recibo.subtotal))
            
            # Solo distribuimos el costo entre los días que efectivamente se pagan/trabajan
            asistencias_pagadas = Asistencia.objects.filter(
                empleado=empleado,
                fecha__range=(nomina_periodo.fecha_inicio, nomina_periodo.fecha_fin),
                incidencia__in=['ASISTENCIA', 'VACACIONES']
            )
            
            num_asistencias = asistencias_pagadas.count()
            if num_asistencias == 0:
                continue
                
            costo_por_dia = costo_total / Decimal(str(num_asistencias))
            
            for asistencia in asistencias_pagadas:
                distribuciones = asistencia.distribuciones.all()
                if not distribuciones.exists():
                    # Si no hay distribución manual, se queda en el aire (o a centro de costo general)
                    continue
                
                for dist in distribuciones:
                    if not dist.obra or not dist.centro_costo:
                        continue
                        
                    monto_a_cargar = (costo_por_dia * Decimal(str(dist.porcentaje))) / Decimal('100.00')
                    
                    # Buscar partida de Mano de Obra para ese Centro de Costo
                    partida = PartidaPresupuestal.objects.filter(
                        centro_costo=dist.centro_costo,
                        categoria='MANO_OBRA'
                    ).first()
                    
                    if partida:
                        partida.monto_ejecutado += monto_a_cargar
                        partida.save()
                        logger.info(f"Cargado {monto_a_cargar} a Partida {partida} por {empleado}")
                    else:
                        logger.warning(f"No se encontró partida de MANO_OBRA para CC {dist.centro_costo}")

        return True
