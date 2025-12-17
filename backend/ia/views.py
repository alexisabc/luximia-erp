from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from openai import OpenAI, OpenAIError

from .rag import retrieve_relevant_context

MAX_QUERY_TOKENS = 300
MAX_RESPONSE_TOKENS = 500
MAX_CONTEXT_TOKENS = 2000

def _truncate_words(text: str, limit: int) -> str:
    tokens = text.split()
    if len(tokens) <= limit:
        return text
    return " ".join(tokens[:limit])

class AIAssistantView(APIView):
    """
    Asistente Central de Luximia ERP.
    Responde preguntas basándose en la base de conocimientos vectorial (DB),
    respetando los permisos del usuario solicitante.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        consulta = request.data.get("consulta", "").strip()
        if not consulta:
            return Response({"detalle": "Consulta requerida"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Recuperar contexto relevante seguro
        contextos = retrieve_relevant_context(consulta, request.user, k=5)
        
        if not contextos:
            return Response({
                "respuesta": "No encontré información relevante en el sistema para responder tu consulta (o no tienes permisos para verla)."
            })

        contexto_str = _truncate_words("\n---\n".join(contextos), MAX_CONTEXT_TOKENS)

        # 2. Construir Prompt del Sistema
        # "Persona" del asistente
        system_prompt = (
            "Eres el Asistente IA oficial de Luximia ERP. Tu objetivo es ayudar a los usuarios "
            "con información precisa basada EXCLUSIVAMENTE en el contexto proporcionado que proviene de la base de datos. "
            "Tienes prohibido inventar datos. Si el contexto no tiene la respuesta, dilo claramente. "
            "Formatea tus respuestas usando Markdown para mejor legibilidad (tablas, listas, negritas). "
            "Sé profesional, conciso y directo."
        )

        mensajes = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Contexto del Sistema (Datos Reales):\n{contexto_str}\n\nPregunta del Usuario: {consulta}"}
        ]

        # 3. Llamar a OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY if hasattr(settings, 'OPENAI_API_KEY') else None)
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini", # Eficiente y capaz
                messages=mensajes,
                max_tokens=MAX_RESPONSE_TOKENS,
                temperature=0.3, # Baja temperatura para ser fiel a los datos
            )
            respuesta = completion.choices[0].message.content.strip()
            
        except OpenAIError as e:
            return Response({"detalle": f"Error del modelo IA: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({"respuesta": respuesta})
