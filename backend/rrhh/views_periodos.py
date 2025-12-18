from rest_framework import viewsets, status, decorators, response
from .models import PeriodoNomina
from .serializers_nomina import PeriodoNominaSerializer
from datetime import date, timedelta
import calendar
from django.db import transaction

class PeriodoNominaViewSet(viewsets.ModelViewSet):
    queryset = PeriodoNomina.objects.all()
    serializer_class = PeriodoNominaSerializer
    filterset_fields = ['anio', 'tipo', 'activo']

    @decorators.action(detail=False, methods=['post'], url_path='generar')
    def generar_periodos(self, request):
        anio = request.data.get('anio')
        
        if not anio:
            return response.Response(
                {"detail": "Se requiere el año."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            anio = int(anio)
        except ValueError:
            return response.Response({"detail": "Año inválido"}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        
        with transaction.atomic():
            # 1. Generar QUINCENALES (24 periodos)
            for month in range(1, 13):
                # Periodo 1: 1 al 15
                p1_num = (month - 1) * 2 + 1
                try:
                    PeriodoNomina.objects.get_or_create(
                        anio=anio,
                        tipo='QUINCENAL',
                        numero=p1_num,
                        defaults={
                            'fecha_inicio': date(anio, month, 1),
                            'fecha_fin': date(anio, month, 15),
                            'activo': True
                        }
                    )
                    created_count += 1
                except: pass

                # Periodo 2: 16 al fin de mes
                p2_num = p1_num + 1
                last_day = calendar.monthrange(anio, month)[1]
                try:
                    PeriodoNomina.objects.get_or_create(
                        anio=anio,
                        tipo='QUINCENAL',
                        numero=p2_num,
                        defaults={
                            'fecha_inicio': date(anio, month, 16),
                            'fecha_fin': date(anio, month, last_day),
                            'activo': True
                        }
                    )
                    created_count += 1
                except: pass

            # 2. Generar SEMANALES
            # Periodo 1: 01 al 07 de Enero, etc.
            current_date = date(anio, 1, 1)
            week_num = 1
            
            # Generamos mientras el INICIO de la semana esté en el año
            while current_date.year == anio:
                end_date = current_date + timedelta(days=6)
                
                try:
                    PeriodoNomina.objects.get_or_create(
                        anio=anio,
                        tipo='SEMANAL',
                        numero=week_num,
                        defaults={
                            'fecha_inicio': current_date,
                            'fecha_fin': end_date,
                            'activo': True
                        }
                    )
                    created_count += 1
                except: pass
                
                current_date = end_date + timedelta(days=1)
                week_num += 1

        return response.Response({
            "detail": f"Proceso completado. Se aseguraron periodos para el año {anio}.",
            "anio": anio
        })
