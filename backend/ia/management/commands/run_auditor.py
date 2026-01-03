from django.core.management.base import BaseCommand
from ia.services.auditor_service import AuditorService
from ia.services.briefing_service import BriefingService
from notifications.services import WebhookService
from core.models import Empresa

class Command(BaseCommand):
    help = "Ejecuta el Auditor Nocturno y genera briefings de IA."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🌙 Iniciando Auditor Nocturno..."))
        
        # 1. Ejecutar escaneo de anomalías
        alerts = AuditorService.run_full_audit()
        self.stdout.write(f"✅ Escaneo completado. {len(alerts)} alertas detectadas.")
        
        # Notificar alertas críticas de inmediato vía Webhook
        for alert in alerts:
            if alert.nivel == 'CRITICAL':
                WebhookService.notify_critical_alert(alert)

        # 2. Generar Briefings de IA por empresa
        for empresa in Empresa.objects.filter(activo=True):
            self.stdout.write(f"🤖 Generando briefing para {empresa.nombre_comercial}...")
            briefing = BriefingService.generate_daily_briefing(empresa)
            
            if briefing:
                self.stdout.write(self.style.SUCCESS(f"✅ Briefing listo para {empresa.nombre_comercial}"))
                # Notificar a Webhooks
                WebhookService.notify_daily_briefing(briefing)
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ No se pudo generar briefing para {empresa.nombre_comercial}"))

        self.stdout.write(self.style.SUCCESS("🏁 Proceso finalizado."))
