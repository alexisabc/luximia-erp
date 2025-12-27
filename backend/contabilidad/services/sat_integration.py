import random
from datetime import datetime, timedelta
from django.utils import timezone
from .models import BuzonMensaje, OpinionCumplimiento

class SATIntegrationService:
    """
    Servicio para simular (o implementar futura) integración con el SAT.
    - Consulta de Opinión de Cumplimiento.
    - Lectura de Buzón Tributario.
    - Validación de RFCs.
    """

    @staticmethod
    def consultar_opinion_cumplimiento(rfc):
        """
        Simula la consulta de la opinión 32-D en tiempo real.
        En producción, esto usaría un scraper (Selenium/Playwright) o una API de terceros.
        """
        # Simulación de respuesta aleatoria para demo
        estados = ['POSITIVA', 'POSITIVA', 'POSITIVA', 'NEGATIVA'] # Mayor probabilidad de positiva
        estado = random.choice(estados)
        
        observaciones = ""
        if estado == 'NEGATIVA':
            observaciones = "Crédito fiscal firme detectado: H-123456. Declaración anual 2023 no presentada."
        
        opinion = OpinionCumplimiento.objects.create(
            rfc=rfc,
            estado=estado,
            folio=f"24NA{random.randint(100000,999999)}",
            observaciones=observaciones,
            # archivo_pdf = ... (aquí guardaríamos el PDF descargado)
        )
        return opinion

    @staticmethod
    def obtener_status_constancia(rfc, cif_id):
        """
        Simula obtener datos de la Constancia de Situación Fiscal dado un CIF ID.
        """
        # Placeholder
        return {
            "rfc": rfc,
            "estatus": "ACTIVO",
            "domicilio": "CALLE CONOCIDA 123, COL. CENTRO, CDMX",
            "regimenes": ["601 - General de Ley Personas Morales"]
        }

    @staticmethod
    def sincronizar_buzon(rfc):
        """
        Simula leer mensajes nuevos del Buzón Tributario.
        """
        nuevos_mensajes = []
        
        # Simular que encontramos un mensaje si no hay recientes
        if not BuzonMensaje.objects.filter(rfc=rfc, fecha_recibido__gte=timezone.now() - timedelta(days=7)).exists():
            msg = BuzonMensaje.objects.create(
                rfc=rfc,
                asunto="Aviso importante sobre su declara...",
                cuerpo="Estimado contribuyente, le recordamos presentar su declaración provisional...",
                fecha_recibido=timezone.now(),
                es_requerimiento=False
            )
            nuevos_mensajes.append(msg)
            
        return nuevos_mensajes
