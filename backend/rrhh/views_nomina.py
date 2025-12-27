from rest_framework import viewsets, status, permissions, decorators, parsers
from rest_framework.response import Response
import traceback
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum

from core.permissions import HasPermissionForAction
from .models import Nomina, ReciboNomina, Empleado, BuzonIMSS
from .serializers_nomina import (
    NominaSerializer, NominaDetailSerializer, 
    ReciboNominaSerializer, CalculoNominaSerializer,
    BuzonIMSSSerializer
)
from .engine import PayrollCalculator

class NominaViewSet(viewsets.ModelViewSet):
    queryset = Nomina.objects.all().order_by('-fecha_inicio')
    permission_classes = [permissions.IsAuthenticated, HasPermissionForAction]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NominaDetailSerializer
        return NominaSerializer

    @decorators.action(detail=True, methods=['post'], url_path='calcular', permission_classes=[permissions.IsAuthenticated])
    def calcular_nomina(self, request, pk=None):
        """
        Ejecuta el motor de cálculo de nómina para esta nómina específica.
        Puede recibir una lista de empleados parcial o calcular todos.
        """
        nomina = self.get_object()
        
        if nomina.estado in ['TIMBRADA', 'CANCELADA']:
            return Response(
                {"detail": "No se puede recalcular una nómina cerrada o cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CalculoNominaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        empleados_ids = serializer.validated_data.get('empleados_ids')

        # 1. Definir Universo de Empleados
        if empleados_ids:
            empleados = Empleado.objects.filter(id__in=empleados_ids, activo=True)
        else:
            # Todos los activos (idealmente filtrar por periodicidad de pago coincidente con nómina)
            empleados = Empleado.objects.filter(activo=True)

        if not empleados.exists():
            return Response({"detail": "No hay empleados activos para calcular."}, status=400)

        # 2. Instanciar Motor
        try:
            calculator = PayrollCalculator(anio=nomina.fecha_fin.year)
        except ValueError as e:
            return Response({"detail": str(e)}, status=500)

        resultados = []
        errores = []

        try:
            with transaction.atomic():
                # Limpiar recibos PREVIOS de estos empleados en ESTA nómina para evitar duplicados
                ReciboNomina.objects.filter(nomina=nomina, empleado__in=empleados).delete()

                for emp in empleados:
                    try:
                        recibo = calculator.calcular_recibo(nomina, emp)
                        resultados.append(f"Empleado {emp.id}: Neto {recibo.neto}")
                    except Exception as e:
                        errores.append(f"Error con empleado {emp}: {str(e)}")

                # 3. Actualizar Totales de la Nómina
                totales = ReciboNomina.objects.filter(nomina=nomina).aggregate(
                    sum_percepciones=Sum('subtotal'), # Aprox
                    sum_deducciones=Sum('descuentos'),
                    sum_neto=Sum('neto')
                )
                nomina.total_percepciones = totales['sum_percepciones'] or 0
                nomina.total_deducciones = totales['sum_deducciones'] or 0
                nomina.total_neto = totales['sum_neto'] or 0
                nomina.estado = 'CALCULADA'
                nomina.save()

        except Exception as e:
             return Response({"detail": f"Error crítico transaccional: {str(e)} \n{traceback.format_exc()}"}, status=500)

        return Response({
            "detail": "Cálculo finalizado.",
            "procesados": len(resultados),
            "errores_count": len(errores),
            "errores": errores,
            "totales": {
                "neto": nomina.total_neto
            }
        })

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cerrar(self, request, pk=None):
        """Bloquea la nómina para evitar cambios futuros."""
        nomina = self.get_object()
        if nomina.estado != 'CALCULADA':
            return Response({"detail": "La nómina debe estar CALCULADA para poder cerrarse."}, status=400)
        
        nomina.estado = 'TIMBRADA' # O 'CERRADA' si el timbrado es un proceso externo
        nomina.save()

        return Response({"detail": "Nómina cerrada exitosamente."})

    @decorators.action(
        detail=False, 
        methods=['post'], 
        url_path='importar-pagadora', 
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
        permission_classes=[permissions.IsAuthenticated]
    )

    def importar_pagadora(self, request):
        """
        Importa nóminas históricas desde múltiples archivos Excel.
        """
        # Support both 'files' (for multiple) and 'file' (legacy/single) keys
        archivos = request.FILES.getlist('files')
        if not archivos:
            single_file = request.FILES.get('file')
            if single_file:
                archivos = [single_file]
                
        anio = int(request.data.get('anio', 2025))
        dry_run = request.data.get('dry_run', 'false').lower() == 'true'

        if not archivos:
            return Response({"detail": "No se proporcionaron archivos."}, status=400)

        valid_extensions = ['.xlsx', '.xlsm', '.xls']
        # Validate all files first? Or process valid ones? Let's process valid ones.
        
        from .services import NominaImporter
        importer = NominaImporter(stdout=None) 
        
        combined_results = []
        errors = []

        for archivo in archivos:
            if not any(archivo.name.lower().endswith(ext) for ext in valid_extensions):
                errors.append(f"Archivo ignorado (formato inválido): {archivo.name}")
                continue

            try:
                # importer.process_file now returns {'file': name, 'sheets': [...]}
                file_results = importer.process_file(archivo, anio=anio, dry_run=dry_run)
                combined_results.append(file_results)
                    
            except Exception as e:
                errors.append(f"Error procesando {archivo.name}: {str(e)}")

        if not combined_results and errors:
             return Response({
                 "detail": "Errores al procesar archivos.", 
                 "results": [],
                 "global_errors": errors
             }, status=status.HTTP_200_OK)

        # If we have some results, return them even if there were some errors
        return Response({
            "detail": "Proceso completado", 
            "results": combined_results,
            "global_errors": errors
        })



class ReciboNominaViewSet(viewsets.ModelViewSet):
    queryset = ReciboNomina.objects.all()
    serializer_class = ReciboNominaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=True, methods=['post'], url_path='recalcular')
    def recalcular(self, request, pk=None):
        recibo = self.get_object()
        nomina = recibo.nomina
        empleado = recibo.empleado
        
        dias_pagados = request.data.get('dias_pagados')
        
        recibo.delete()
        
        from .engine import PayrollCalculator
        calculator = PayrollCalculator(anio=nomina.fecha_fin.year)
        
        # Pass dias_pagados to calculate if possible, or patch after.
        new_recibo = calculator.calcular_recibo(nomina, empleado, dias_pagados=dias_pagados)
        
        self._update_grand_totals(nomina)
        
        return Response({"detail": "Recibo recalculado."})
    
    # ... (skipping generic methods, defined below)

    @decorators.action(detail=True, methods=['post'], url_path='agregar-concepto')
    def agregar_concepto(self, request, pk=None):
        recibo = self.get_object()
        concepto_id = request.data.get('concepto_id')
        monto = request.data.get('monto')
        
        from .models import ConceptoNomina, DetalleReciboItem
        concepto = get_object_or_404(ConceptoNomina, id=concepto_id)
        
        DetalleReciboItem.objects.create(
            recibo=recibo,
            concepto=concepto,
            nombre_concepto=concepto.nombre,
            clave_sat=concepto.clave_sat,
            monto_gravado=monto, 
            monto_exento=0,
            monto_total=monto
        )
        
        self._actualizar_totales(recibo)
        return Response({"detail": "Concepto agregado"})

    @decorators.action(detail=True, methods=['delete'], url_path='eliminar-concepto/(?P<item_id>[^/.]+)')
    def eliminar_concepto(self, request, pk=None, item_id=None):
        recibo = self.get_object()
        from .models import DetalleReciboItem
        item = get_object_or_404(DetalleReciboItem, id=item_id, recibo=recibo)
        item.delete()
        
        self._actualizar_totales(recibo)
        return Response({"detail": "Concepto eliminado"})

    def _actualizar_totales(self, recibo):
        detalles = recibo.detalles.select_related('concepto').all()
        
        subtotal = sum(d.monto_total for d in detalles if d.concepto.tipo == 'PERCEPCION')
        deducciones = sum(d.monto_total for d in detalles if d.concepto.tipo == 'DEDUCCION')
        otros = sum(d.monto_total for d in detalles if d.concepto.tipo == 'OTRO_PAGO')
        
        recibo.subtotal = subtotal
        recibo.descuentos = deducciones 
        recibo.neto = (subtotal + otros) - deducciones
        recibo.save()
        
        self._update_grand_totals(recibo.nomina)

    def _update_grand_totals(self, nomina):
        totales = ReciboNomina.objects.filter(nomina=nomina).aggregate(
            sum_per=Sum('subtotal'), sum_ded=Sum('descuentos'), sum_net=Sum('neto')
        )
        nomina.total_percepciones = totales['sum_per'] or 0
        nomina.total_deducciones = totales['sum_ded'] or 0
        nomina.total_neto = totales['sum_net'] or 0
        nomina.save()



class ConceptoNominaViewSet(viewsets.ReadOnlyModelViewSet):
    from .models import ConceptoNomina
    from .serializers_nomina import ConceptoNominaSerializer
    
    queryset = ConceptoNomina.objects.all().order_by('tipo', 'codigo')
    serializer_class = ConceptoNominaSerializer
    permission_classes = [permissions.IsAuthenticated]


class HistoricoNominaViewSet(viewsets.ReadOnlyModelViewSet):

    """
    Vista de solo lectura para visualizar la tabla centralizada de nómina histórica.
    """
    from .models import NominaCentralizada
    from .serializers_nomina import NominaCentralizadaSerializer

    queryset = NominaCentralizada.objects.all().order_by('-fecha_carga', 'periodo', 'nombre')
    serializer_class = NominaCentralizadaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['empresa', 'periodo', 'nombre', 'codigo']

    @decorators.action(detail=False, methods=['get'], url_path='exportar-excel')
    def exportar_excel(self, request):
        """Exporta el histórico filtrado a Excel."""
        import openpyxl
        from django.http import HttpResponse

        # Filtrar queryset con los mismos filtros de la vista
        qs = self.filter_queryset(self.get_queryset())
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Histórico Nómina"

        # Headers
        headers = [
            'Esquema', 'Tipo', 'Periodo', 'Empresa', 'Código', 'Nombre', 'Depto', 'Puesto',
            'Neto Mensual', 'SDO', 'Días', 'Sueldo', 'Vacaciones', 'Prima Vacacional', 'Aguinaldo',
            'Retroactivo', 'Subsidio', 'Total Percepciones', 'ISR', 'IMSS', 'Préstamo', 'Infonavit',
            'Total Deducciones', 'Neto', 'ISN', 'Previo Costo Social', 'Total Carga Social',
            'Total Nómina', 'Nóminas y Costos Tributario', 'Comisión', 'Sub-Total', 'IVA', 'Total Facturación'
        ]
        ws.append(headers)

        for item in qs:
            ws.append([
                item.esquema, item.tipo, item.periodo, item.empresa, item.codigo, item.nombre, item.departamento, item.puesto,
                item.neto_mensual, item.sueldo_diario, item.dias_trabajados, item.sueldo, 
                item.vacaciones, item.prima_vacacional, item.aguinaldo,
                item.retroactivo, item.subsidio, item.total_percepciones, item.isr, item.imss, item.prestamo, item.infonavit,
                item.total_deducciones, item.neto, item.isn, item.previo_costo_social, item.total_carga_social,
                item.total_nomina, item.nominas_y_costos, item.comision, item.sub_total, item.iva, item.total_facturacion
            ])
            
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="historico_nomina.xlsx"'
        wb.save(response)
        return response

    @decorators.action(detail=False, methods=['delete'], url_path='borrar-todo')
    def borrar_todo(self, request):
        """Elimina registros del histórico. Permite filtrar."""
        qs = self.filter_queryset(self.get_queryset())
        count = qs.count()
        qs.delete()
        return Response({"detail": f"Se eliminaron {count} registros del histórico."})


class BuzonIMSSViewSet(viewsets.ModelViewSet):
    queryset = BuzonIMSS.objects.all().order_by("-fecha_recibido")
    serializer_class = BuzonIMSSSerializer
    permission_classes = [permissions.IsAuthenticated]


class PTUViewSet(viewsets.ViewSet):
    """
    Vista para simulación y cálculo de PTU.
    """
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['post'], url_path='calcular-proyecto')
    def calcular_proyecto(self, request):
        """
        Recibe anio y monto_repartir.
        Retorna la lista de empleados y sus montos asignados.
        """
        anio = request.data.get('anio')
        monto = request.data.get('monto')

        if not anio or not monto:
            return Response({"error": "Año y Monto son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .services.calculo_ptu import CalculoPTUService
            proyecto = CalculoPTUService.calcular_preliminar(int(anio), float(monto))
            return Response(proyecto)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
