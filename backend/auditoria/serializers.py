from rest_framework import serializers
from auditlog.models import LogEntry

class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer para LogEntry de django-auditlog.
    Provee información detallada de cambios (valor anterior vs nuevo).
    """

    user = serializers.CharField(source="actor.get_username", default="Sistema/Desconocido")
    action = serializers.CharField(source="get_action_display")
    model_name = serializers.CharField(source="content_type.model")
    timestamp = serializers.DateTimeField()
    # changes ya viene como JSON/Dict en versiones recientes con Postgres, 
    # o string si es sqlite. Rest Framework lo serializa bien si es dict.
    changes = serializers.JSONField() 

    class Meta:
        model = LogEntry
        fields = ["id", "user", "action", "model_name", "object_pk", "timestamp", "changes", "remote_addr"]
