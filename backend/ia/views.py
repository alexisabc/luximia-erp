from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .rag import retrieve_relevant_context
from .services.ai_service import AIService
from django.conf import settings
from .models import DailyBriefing, AuditAlert
from .services.auditor_service import AuditorService
from .services.briefing_service import BriefingService
import logging

logger = logging.getLogger(__name__)

class AIAssistantView(APIView):
    """
    Endpoint para chatear con el asistente IA del ERP.
    Usa RAG para obtener contexto relevante de la DB y luego consulta al LLM.
    """
    def post(self, request):
        consulta = request.data.get('consulta')
        preferencia_ia = request.data.get('proveedor', 'auto') # 'auto', 'groq', 'gemini', 'openai'
        
        if not consulta:
            return Response({"error": "Debe proporcionar una consulta"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Recuperar contexto relevante usando RAG (vía pgvector)
            # Pasamos request.user para filtrado por permisos
            contextos = retrieve_relevant_context(consulta, request.user, k=5)
            # Combinar contextos en un solo string
            contexto_str = "\n".join(contextos)

            # 2. Construir el Prompt del Sistema con el contexto
            system_prompt = f"""
            Eres el Asistente IA del ERP "Sistema ERP". Tu objetivo es ayudar al usuario con dudas sobre sus datos.
            
            CONTEXTO RELEVANTE DE LA BASE DE DATOS:
            ---------------------------------------
            {contexto_str}
            ---------------------------------------
            
            INSTRUCCIONES:
            - Usa exclusivamente el contexto proporcionado si contiene la respuesta.
            - Si el contexto no tiene la información, admítelo educadamente.
            - Sé profesional y conciso.
            - No inventes datos que no estén en el contexto.
            - El usuario es {request.user.get_full_name() or request.user.username}.
            """

            # 3. Llamar al servicio de IA con failover automático
            ai_service = AIService()
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": consulta}
            ]
            
            respuesta = ai_service.generate_response(messages, preferred_model=preferencia_ia)

            return Response({
                "respuesta": respuesta,
                "fuentes_consultadas": len(contextos)
            })

        except Exception as e:
            logger.error(f"Error en AIAssistantView: {e}")
            return Response(
                {"error": "Ocurrió un error al procesar la solicitud con IA"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DailyBriefingView(APIView):
    def get(self, request):
        # Obtener el último briefing de la empresa activa
        from core.middleware import get_current_company_id
        company_id = get_current_company_id()
        if not company_id:
            return Response({"error": "No hay empresa activa"}, status=status.HTTP_400_BAD_REQUEST)
            
        briefing = DailyBriefing.objects.filter(empresa_id=company_id).order_by('-fecha', '-created_at').first()
        if not briefing:
            return Response({
                "contenido": "No hay briefing disponible para hoy aún. Ejecute el análisis proactivo para generar uno.",
                "vacio": True
            })
            
        return Response({
            "fecha": briefing.fecha,
            "contenido": briefing.contenido
        })

class AuditTriggerView(APIView):
    def post(self, request):
        # Trigger manual del auditor
        from core.models import Empresa
        from core.middleware import get_current_company_id
        
        company_id = get_current_company_id()
        if not company_id:
             return Response({"error": "No hay empresa activa"}, status=status.HTTP_400_BAD_REQUEST)
        
        empresa = Empresa.objects.get(id=company_id)
        
        # Ejecutar reglas solo para esta empresa
        try:
            AuditorService.check_obras_budget(empresa)
            AuditorService.check_stock_levels(empresa)
            AuditorService.check_fiscal_certs(empresa)
            
            # Generar briefing
            briefing = BriefingService.generate_daily_briefing(empresa)
            
            # Obtener alertas críticas actuales para mostrar
            alertas = AuditAlert.objects.filter(empresa=empresa, resuelta=False, nivel='CRITICAL')[:5]
            alertas_msg = [a.mensaje for a in alertas]
            
            return Response({
                "status": "success",
                "message": "Análisis completado",
                "briefing": briefing.contenido if briefing else "No se pudo generar narrativa.",
                "alertas_criticas": alertas_msg
            })
        except Exception as e:
            logger.error(f"Error en AuditTrigger: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
