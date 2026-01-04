import logging
from datetime import date, timedelta
from django.utils import timezone
from core.models import Empresa
from core.middleware import set_current_company_id
from ia.models import AuditAlert
from obras.models import PartidaPresupuestal
from inventarios.models import Existencia
from compras.models.productos import Insumo
from contabilidad.models.cfdi import CertificadoDigital
from django.db.models import Sum

logger = logging.getLogger(__name__)

class AuditorService:
    @classmethod
    def run_full_audit(cls):
        """Ejecuta todas las reglas de auditoría para cada empresa."""
        empresas = Empresa.objects.filter(activo=True)
        all_alerts = []
        
        for empresa in empresas:
            logger.info(f"Auditor Nocturno: Iniciando escaneo para {empresa.nombre_comercial}")
            # Importante: Inyectar el contexto de la empresa para que los MultiTenantManagers funcionen si se usan
            set_current_company_id(empresa.id)
            
            alerts = []
            alerts.extend(cls.check_obras_budget(empresa))
            alerts.extend(cls.check_stock_levels(empresa))
            alerts.extend(cls.check_fiscal_certs(empresa))
            
            all_alerts.extend(alerts)
            
        # Limpiar contexto al finalizar
        set_current_company_id(None)
        return all_alerts

    @classmethod
    def check_obras_budget(cls, empresa):
        """Regla: Detectar partidas con ejecución > 90%."""
        alerts = []
        # Buscamos partidas de las obras de esta empresa
        partidas = PartidaPresupuestal.objects.filter(
            centro_costo__obra__empresa=empresa,
            monto_estimado__gt=0
        )
        
        for p in partidas:
            porcentaje = (p.monto_ejecutado / p.monto_estimado) * 100
            if porcentaje > 90:
                nivel = 'CRITICAL' if porcentaje > 98 else 'WARNING'
                mensaje = (f"Obra {p.centro_costo.obra.nombre}: Partida {p.categoria} "
                          f"al {porcentaje:.1f}% de su presupuesto.")
                
                alert, created = AuditAlert.objects.get_or_create(
                    empresa=empresa,
                    tipo='OBRA',
                    mensaje=mensaje,
                    resuelta=False,
                    defaults={
                        'nivel': nivel,
                        'data': {'ejecutado': float(p.monto_ejecutado), 'estimado': float(p.monto_estimado), 'obra_id': p.centro_costo.obra_id}
                    }
                )
                if created: alerts.append(alert)
        return alerts

    @classmethod
    def check_stock_levels(cls, empresa):
        """Regla: Stock < stock_minimo global por insumo."""
        alerts = []
        # Esta regla es compleja porque el stock minimo es global por insumo pero existencias son por almacen
        # Auditaremos insumos que tengan stock_minimo definido
        insumos = Insumo.objects.filter(stock_minimo__gt=0)
        
        for insumo in insumos:
            # Sumar existencia en todos los almacenes de la empresa
            total_stock = Existencia.objects.filter(
                insumo=insumo,
                almacen__empresa=empresa
            ).aggregate(total=Sum('cantidad'))['total'] or 0
            
            if total_stock < insumo.stock_minimo:
                mensaje = f"Stock Crítico: {insumo.descripcion} (Tiene {total_stock}, Mínimo {insumo.stock_minimo})"
                alert, created = AuditAlert.objects.get_or_create(
                    empresa=empresa,
                    tipo='STOCK',
                    mensaje=mensaje,
                    resuelta=False,
                    defaults={
                        'nivel': 'CRITICAL',
                        'data': {'actual': float(total_stock), 'minimo': float(insumo.stock_minimo), 'insumo_id': insumo.id}
                    }
                )
                if created: alerts.append(alert)
        return alerts

    @classmethod
    def check_fiscal_certs(cls, empresa):
        """Regla: Certificados próximos a vencer (< 30 días)."""
        alerts = []
        limite = timezone.now() + timedelta(days=30)
        
        # Certificados vinculados a la configuracion fiscal de la empresa
        certs = CertificadoDigital.objects.filter(
            empresa_asociada__empresa=empresa,
            fecha_fin_validez__lte=limite,
            activo=True
        )
        
        for cert in certs:
            dias_restantes = (cert.fecha_fin_validez - timezone.now()).days
            mensaje = f"Certificado {cert.tipo} ({cert.rfc}) vence en {max(0, dias_restantes)} días."
            
            alert, created = AuditAlert.objects.get_or_create(
                empresa=empresa,
                tipo='FISCAL',
                mensaje=mensaje,
                resuelta=False,
                defaults={
                    'nivel': 'CRITICAL' if dias_restantes < 7 else 'WARNING',
                    'data': {'vence': cert.fecha_fin_validez.isoformat(), 'rfc': cert.rfc}
                }
            )
            if created: alerts.append(alert)
        return alerts
