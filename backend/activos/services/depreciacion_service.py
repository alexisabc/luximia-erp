from datetime import date
from decimal import Decimal
from django.db import transaction
from django.db import models
from activos.models import ActivoFijo, HistorialDepreciacion
from contabilidad.services.automation import PolizaGeneratorService

class DepreciacionService:
    @staticmethod
    def ejecutar_cierre_mensual(mes, anio, user_id):
        """
        Calcula la depreciación mensual para todos los activos elegibles.
        Genera historial y actualiza el valor en libros.
        Genera Póliza Contable Global.
        """
        # 1. Identificar Activos (Activos en uso/disponibles con valor > residual)
        activos = ActivoFijo.objects.filter(
            estado__in=['DISPONIBLE', 'EN_USO'],
            valor_actual__gt=models.F('valor_residual')
        )
        
        total_depreciacion = Decimal('0.00')
        historial_creado = []
        fecha_corte = date(anio, mes, 28) # Simple approximation
        
        with transaction.atomic():
            for activo in activos:
                # Fórmula Lineal: (Costo - Residual) / (VidaUtil * 12)
                vida_meses = activo.vida_util_anios * 12
                if vida_meses <= 0: continue
                
                monto_depreciable_total = activo.costo_adquisicion - activo.valor_residual
                monto_mensual = monto_depreciable_total / vida_meses
                
                # Ajuste: No depreciar más allá del valor residual
                if (activo.valor_actual - monto_mensual) < activo.valor_residual:
                     monto_mensual = activo.valor_actual - activo.valor_residual
                
                if monto_mensual <= 0: continue

                # Guardar estado anterior
                valor_ant = activo.valor_actual
                
                # Actualizar Activo
                activo.valor_actual -= monto_mensual
                activo.save()
                
                # Crear Historial
                hist = HistorialDepreciacion.objects.create(
                    activo=activo,
                    fecha=fecha_corte,
                    monto=monto_mensual,
                    valor_libro_anterior=valor_ant,
                    valor_libro_nuevo=activo.valor_actual,
                    obs="Depreciación Automática" # Will need to create dummy user/obs if not available or pass user
                )
                historial_creado.append(hist)
                total_depreciacion += monto_mensual

            # 2. Generar Póliza Contable
            if total_depreciacion > 0:
                poliza = PolizaGeneratorService.generar_poliza_automatica(
                    tipo_evento='DEPRECIACION_MENSUAL',
                    datos_origen={'total': total_depreciacion, 'referencia': f"Depreciación {mes}/{anio}"},
                    user=user_id # Replace with actual user object if possible
                )
                
                # Vincular póliza al historial (Update bulk or iterate)
                for h in historial_creado:
                    h.poliza_generada = poliza.folio
                    h.save()
                    
        return {
            'activos_procesados': len(historial_creado),
            'monto_total': total_depreciacion,
            'poliza': poliza.folio if total_depreciacion > 0 else None
        }
