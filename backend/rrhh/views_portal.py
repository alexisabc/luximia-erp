from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    SolicitudVacaciones,
    SolicitudPermiso,
    Incapacidad,
    DocumentoExpediente,
    Empleado
)
from .serializers_portal import (
    SolicitudVacacionesSerializer,
    SolicitudPermisoSerializer,
    IncapacidadSerializer,
    DocumentoExpedienteSerializer,
    AdminSolicitudVacacionesSerializer,
    AdminSolicitudPermisoSerializer,
    AdminIncapacidadSerializer,
    AdminDocumentoExpedienteSerializer
)

class IsEmpleado(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow superusers to access for testing/debugging, logic will handle missing relation
        return request.user.is_authenticated and (request.user.is_superuser or hasattr(request.user, 'empleado'))

class PortalVacacionesViewSet(viewsets.ModelViewSet):
    serializer_class = SolicitudVacacionesSerializer
    permission_classes = [IsEmpleado]

    def get_queryset(self):
        if not hasattr(self.request.user, 'empleado'):
            return SolicitudVacaciones.objects.none()
        return SolicitudVacaciones.objects.filter(empleado=self.request.user.empleado)

    @decorators.action(detail=False, methods=['get'])
    def balance(self, request):
        if not hasattr(request.user, 'empleado'):
            # Return dummy balance for superusers without employee profile
            return Response({
                "antiguedad_anos": 0,
                "dias_totales": 0,
                "dias_usados": 0,
                "dias_restantes": 0,
                "periodo_actual": timezone.now().year
            })

        empleado = request.user.empleado
        # Logic to calculate balance based on tenure
        # This is a simplified example. You should implement the actual Mexican Labor Law logic.
        try:
            # Check if datos_laborales exists
            if not hasattr(empleado, 'datos_laborales'):
                 return Response({"error": "Datos laborales no definidos"}, status=400)
                 
            datos_laborales = empleado.datos_laborales
            fecha_ingreso = datos_laborales.fecha_ingreso
            if not fecha_ingreso:
                return Response({"error": "Fecha de ingreso no definida"}, status=400)
            
            antiguedad_years = (timezone.now().date() - fecha_ingreso).days // 365
            
            # Tabla 2024 Vacaciones Dignas (Example)
            dias_por_anio = {
                0: 0, 1: 12, 2: 14, 3: 16, 4: 18, 5: 20
            }
            # Logic for 6-10 years = 22, etc. be clearer in real impl
            total_days = dias_por_anio.get(antiguedad_years, 22 if antiguedad_years > 5 else 0) 
            
            # Subtract taken days
            # This requires summing 'dias_solicitados' from approved requests in the current year/period
            used_days = 0 # Implement query to sum approved days
            
            return Response({
                "antiguedad_anos": antiguedad_years,
                "dias_totales": total_days,
                "dias_usados": used_days,
                "dias_restantes": total_days - used_days,
                "periodo_actual": timezone.now().year
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class PortalPermisosViewSet(viewsets.ModelViewSet):
    serializer_class = SolicitudPermisoSerializer
    permission_classes = [IsEmpleado]

    def get_queryset(self):
        if not hasattr(self.request.user, 'empleado'):
            return SolicitudPermiso.objects.none()
        return SolicitudPermiso.objects.filter(empleado=self.request.user.empleado)

class PortalIncapacidadViewSet(viewsets.ModelViewSet):
    serializer_class = IncapacidadSerializer
    permission_classes = [IsEmpleado]

    def get_queryset(self):
        if not hasattr(self.request.user, 'empleado'):
            return Incapacidad.objects.none()
        return Incapacidad.objects.filter(empleado=self.request.user.empleado)

class PortalDocumentosViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoExpedienteSerializer
    permission_classes = [IsEmpleado]

    def get_queryset(self):
        if not hasattr(self.request.user, 'empleado'):
            return DocumentoExpediente.objects.none()
        return DocumentoExpediente.objects.filter(empleado=self.request.user.empleado)

# Admin ViewSets
class AdminVacacionesViewSet(viewsets.ModelViewSet):
    queryset = SolicitudVacaciones.objects.all()
    serializer_class = AdminSolicitudVacacionesSerializer
    permission_classes = [permissions.IsAdminUser]

    @decorators.action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estatus = 'APROBADO'
        solicitud.observaciones_rh = request.data.get('observaciones', '')
        solicitud.save()
        return Response({'status': 'approved'})

    @decorators.action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estatus = 'RECHAZADO'
        solicitud.observaciones_rh = request.data.get('observaciones', '')
        solicitud.save()
        return Response({'status': 'rejected'})

class AdminPermisosViewSet(viewsets.ModelViewSet):
    queryset = SolicitudPermiso.objects.all()
    serializer_class = AdminSolicitudPermisoSerializer
    permission_classes = [permissions.IsAdminUser]

    @decorators.action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estatus = 'APROBADO'
        solicitud.observaciones_rh = request.data.get('observaciones', '')
        solicitud.save()
        return Response({'status': 'approved'})

    @decorators.action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estatus = 'RECHAZADO'
        solicitud.observaciones_rh = request.data.get('observaciones', '')
        solicitud.save()
        return Response({'status': 'rejected'})

class AdminIncapacidadViewSet(viewsets.ModelViewSet):
    queryset = Incapacidad.objects.all()
    serializer_class = AdminIncapacidadSerializer
    permission_classes = [permissions.IsAdminUser]

    @decorators.action(detail=True, methods=['post'])
    def validar(self, request, pk=None):
        incapacidad = self.get_object()
        incapacidad.estatus = 'VALIDADO'
        incapacidad.save()
        return Response({'status': 'validated'})

class AdminDocumentosViewSet(viewsets.ModelViewSet):
    queryset = DocumentoExpediente.objects.all()
    serializer_class = AdminDocumentoExpedienteSerializer
    permission_classes = [permissions.IsAdminUser]

    @decorators.action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        doc = self.get_object()
        doc.estatus = 'APROBADO'
        doc.save()
        return Response({'status': 'approved'})

    @decorators.action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        doc = self.get_object()
        doc.estatus = 'RECHAZADO'
        doc.comentarios = request.data.get('motivo', '')
        doc.save()
        return Response({'status': 'rejected'})
