from django.db.models import Sum, F
from django.utils import timezone
from ..models import Obra, ActividadProyecto, AsignacionRecurso
from tesoreria.models.movimientos import Egreso
from rrhh.models.asistencia import DistribucionCosto

class CostControlService:
    @staticmethod
    def get_evm_metrics(obra_id, fecha_corte=None):
        if not fecha_corte:
            fecha_corte = timezone.now().date()
            
        obra = Obra.objects.get(pk=obra_id)
        actividades = ActividadProyecto.objects.filter(obra_id=obra_id)
        
        # 1. Planned Value (PV)
        # Sum of budgeted costs for activities scheduled to be completed by fecha_corte
        pv = actividades.filter(fecha_fin_planeada__lte=fecha_corte).aggregate(total=Sum(presupuesto_total))[total] or 0
        
        # 2. Actual Cost (AC)
        # Sum of actual costs (expenses and payroll) linked to this project until fecha_corte
        egresos = Egreso.objects.filter(obra_id=obra_id, fecha__lte=fecha_corte, estado=PAGADO).aggregate(total=Sum(monto))[total] or 0
        
        # Nomina costs (simplified: using daily rate or distribution)
        # This part requires a more complex calculation based on DistribucionCosto
        # For now, we take the sum of distributed percentages of daily costs
        # (This is a simplified version for the walkthrough)
        nomina = DistribucionCosto.objects.filter(obra_id=obra_id, asistencia__fecha__lte=fecha_corte).aggregate(
            total=Sum(F(asistencia__empleado__sueldo_diario) * F(porcentaje) / 100.0)
        )[total] or 0
        
        ac = egresos + nomina
        
        # 3. Earned Value (EV)
        # Sum of (% Progress * Budget) for all activities
        ev = sum([float(a.porcentaje_avance) / 100.0 * float(a.presupuesto_total or 0) for a in actividades])
        
        # 4. Variances and Indices
        cv = float(ev) - float(ac)
        sv = float(ev) - float(pv)
        
        cpi = float(ev) / float(ac) if ac > 0 else 1.0
        spi = float(ev) / float(pv) if pv > 0 else 1.0
        
        return {
            pv: pv,
            ac: ac,
            ev: ev,
            cv: cv,
            sv: sv,
            cpi: cpi,
            spi: spi,
            bac: float(obra.presupuesto_total or 0), # Budget at Completion
            status: HEALTHY if cpi >= 1.0 and spi >= 1.0 else WARNING if cpi >= 0.8 else CRITICAL
        }

    @staticmethod
    def get_s_curve_data(obra_id):
        # Generates time series for PV, EV, AC
        # (Placeholder for complex time series logic)
        return []
