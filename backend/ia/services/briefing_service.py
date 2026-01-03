import logging
from django.utils import timezone
from ia.models import DailyBriefing, AuditAlert
from ia.services.ai_service import AIService
from core.models import Empresa

logger = logging.getLogger(__name__)

class BriefingService:
    @classmethod
    def generate_daily_briefing(cls, empresa):
        """Genera un resumen narrativo usando IA basado en las alertas activas."""
        # 1. Obtener alertas no resueltas de las últimas 24h o críticas
        alertas = AuditAlert.objects.filter(empresa=empresa, resuelta=False)[:10]
        
        if not alertas.exists():
            # Si no hay alertas, podemos omitir o generar un "Todo en orden"
            resumen_data = "No se detectaron anomalías críticas en las últimas 24 horas. Los presupuestos de obra e inventarios operan bajo parámetros normales."
        else:
            resumen_data = "\n".join([f"- [{a.nivel}] {a.mensaje}" for a in alertas])

        # 2. Llamar al LLM
        # Recuperamos la instancia de la empresa para el prompt
        prompt = f"""
        Actúa como un CFO y Auditor Senior experto en construcción. 
        Analiza los siguientes eventos detectados por el sistema de monitoreo nocturno para la empresa "{empresa.nombre_comercial}":
        
        {resumen_data}
        
        Identifica riesgos financieros o de operación críticos y redacta un 'Morning Briefing' para el Director General.
        - Sé profesional, directo y ejecutivo.
        - Redacta exactamente 3 párrafos.
        - Si no hay alertas críticas, felicita al equipo por el orden.
        - No uses placeholders, escribe el informe final.
        - Idioma: Español.
        """
        
        try:
            ai = AIService()
            # AIService espera una lista de mensajes
            messages = [{"role": "user", "content": prompt}]
            narrativa = ai.generate_response(messages)
            
            # 3. Guardar en DB
            briefing, created = DailyBriefing.objects.update_or_create(
                empresa=empresa,
                fecha=timezone.now().date(),
                defaults={'contenido': narrativa}
            )
            return briefing
        except Exception as e:
            logger.error(f"Error generando AI Briefing para {empresa}: {e}")
            return None
