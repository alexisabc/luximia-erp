from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone
from ..models import Obra, Estimacion
from tesoreria.models import Egreso
from rrhh.models.asistencia import DistribucionCosto

class ClosureService:
    @staticmethod
    def get_final_profitability(obra_id):
        """
        Calcula la rentabilidad final del proyecto cruzando ingresos y egresos.
        """
        obra = Obra.objects.get(id=obra_id)
        
        # 1. Ingresos Reales (Avance cobrado/por cobrar al cliente)
        total_ingresos = Estimacion.objects.filter(
            obra_id=obra_id, 
            estado__in=['AUTORIZADA', 'FACTURADA', 'PAGADA']
        ).aggregate(Sum('monto_avance'))['monto_avance__sum'] or 0
        
        # 2. Gastos Financieros (Pagos realizados a proveedores, indirectos, etc)
        total_gastos = Egreso.objects.filter(
            obra_id=obra_id,
            estado='PAGADO'
        ).aggregate(Sum('monto'))['monto__sum'] or 0
        
        # 3. Costos de Nómina (Distribución de asistencia)
        # Se calcula multiplicando el porcentaje de distribución por el salario diario del empleado en esa fecha.
        total_nomina = 0
        distribuciones = DistribucionCosto.objects.filter(obra_id=obra_id).select_related('asistencia__empleado__datos_laborales')
        
        for dist in distribuciones:
            salario_diario = dist.asistencia.empleado.datos_laborales.salario_diario or 0
            costo_dia = (Decimal(str(dist.porcentaje)) / Decimal('100')) * salario_diario
            total_nomina += costo_dia
        
        utilidad = total_ingresos - total_gastos - total_nomina
        margen = (utilidad / total_ingresos * 100) if total_ingresos > 0 else 0
        
        return {
            "obra": obra.nombre,
            "ingresos_totales": float(total_ingresos),
            "gastos_totales": float(total_gastos),
            "nomina_total": float(total_nomina),
            "utilidad_neta": float(utilidad),
            "margen_utilidad": round(float(margen), 2),
            "presupuesto_original": float(obra.presupuesto_total)
        }

    @staticmethod
    def get_retention_summary(obra_id):
        """
        Resumen de fondo de garantía retenido al proyecto.
        """
        total_retenido = Estimacion.objects.filter(
            obra_id=obra_id,
            estado='PAGADA'
        ).aggregate(Sum('fondo_garantia'))['fondo_garantia__sum'] or 0
        
        # Sumar egresos de liberación (pagados o en proceso)
        liberado = Egreso.objects.filter(
            obra_id=obra_id,
            concepto__icontains="Liberación de Fondo de Garantía",
            estado__in=['PAGADO', 'PROGRAMADO', 'AUTORIZADO']
        ).aggregate(Sum('monto'))['monto__sum'] or 0
        
        return {
            "total_retenido": float(total_retenido),
            "liberado": float(liberado),
            "pendiente": float(total_retenido - liberado)
        }

    @staticmethod
    def cerrar_obra(obra_id, usuario_id):
        """
        Cambia el estado de la obra a CERRADA y realiza validaciones.
        """
        obra = Obra.objects.get(id=obra_id)
        
        # Validar que no haya estimaciones pendientes de autorizar/facturar
        pendientes = Estimacion.objects.filter(obra=obra, estado='BORRADOR').exists()
        if pendientes:
            raise Exception("No se puede cerrar la obra con estimaciones en borrador.")
            
        obra.estado = 'CERRADA'
        obra.save()
        
        # Log de auditoría o notificación podría ir aquí
        return obra

    @staticmethod
    def liquidar_fondo_garantia(obra_id, cuenta_id, usuario_id):
        """
        Genera un Egreso para liberar el fondo de garantía acumulado.
        """
        obra = Obra.objects.get(id=obra_id)
        
        # Sumar fondo de garantía de estimaciones pagadas
        total_retenido = Estimacion.objects.filter(
            obra=obra,
            estado='PAGADA'
        ).aggregate(Sum('fondo_garantia'))['fondo_garantia__sum'] or 0
        
        if total_retenido <= 0:
            raise Exception("No hay fondo de garantía acumulado para liberar.")
            
        # Crear el Egreso en Tesorería
        egreso = Egreso.objects.create(
            obra=obra,
            cuenta_bancaria_id=cuenta_id,
            fecha=timezone.now().date(),
            beneficiario=obra.cliente or "Cliente del Proyecto",
            concepto=f"Liberación de Fondo de Garantía - {obra.nombre}",
            monto=total_retenido,
            solicitado_por_id=usuario_id,
            estado='BORRADOR'
        )
        
        return egreso
