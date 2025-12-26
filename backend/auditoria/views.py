from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from auditlog.models import LogEntry
from rest_framework.decorators import action
from django.http import HttpResponse
from io import BytesIO
import xlsxwriter
import json

from .serializers import AuditLogSerializer
from .permissions import CanViewAuditLog


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista para consultar el historial de auditoría completo del sistema.
    """
    queryset = LogEntry.objects.select_related("actor", "content_type").order_by(
        "-timestamp"
    )
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLog] 
    # Mantenemos paginación por defecto del proyecto.
    # El frontend espera 'results' y 'count', por lo que necesitamos paginación activa.
    # pagination_class = None 

    @action(detail=False, methods=["get"], url_path="exportar")
    def exportar(self, request):
        logs = self.get_queryset()
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()

        # Formatos
        header_format = workbook.add_format({'bold': True, 'bg_color': '#f0f0f0'})
        wrap_format = workbook.add_format({'text_wrap': True})

        headers = ["Usuario", "Acción", "Modelo", "ID Objeto", "Fecha", "Cambios (Campo: Anterior -> Nuevo)"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)

        # Ajustar anchos
        worksheet.set_column(0, 0, 20) # Usuario
        worksheet.set_column(1, 1, 15) # Acción
        worksheet.set_column(2, 2, 20) # Modelo
        worksheet.set_column(3, 3, 10) # ID
        worksheet.set_column(4, 4, 20) # Fecha
        worksheet.set_column(5, 5, 60) # Cambios

        for row, log in enumerate(logs, start=1):
            user_str = log.actor.get_username() if log.actor else "Sistema"
            action_str = log.get_action_display()
            model_str = log.content_type.model
            
            # Formatear cambios para que sean legibles en Excel
            changes_str = ""
            if log.changes:
                try:
                    changes_dict = json.loads(log.changes) if isinstance(log.changes, str) else log.changes
                    change_list = []
                    for field, values in changes_dict.items():
                        # values es [old, new]
                        old_val = values[0] if len(values) > 0 else 'N/A'
                        new_val = values[1] if len(values) > 1 else 'N/A'
                        change_list.append(f"{field}: {old_val} -> {new_val}")
                    changes_str = "\n".join(change_list)
                except:
                    changes_str = str(log.changes)

            worksheet.write(row, 0, user_str)
            worksheet.write(row, 1, action_str)
            worksheet.write(row, 2, model_str)
            worksheet.write(row, 3, str(log.object_pk))
            worksheet.write(row, 4, log.timestamp.strftime("%Y-%m-%d %H:%M:%S"))
            worksheet.write(row, 5, changes_str, wrap_format)

        workbook.close()
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = "attachment; filename=auditoria_completa.xlsx"
        return response
