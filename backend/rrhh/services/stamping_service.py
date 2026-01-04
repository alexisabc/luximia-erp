from datetime import datetime
from django.db import transaction
from rrhh.models.nomina import PeriodoNomina, NominaCentralizada
from rrhh.services.xml_generator import NominaXMLGenerator
import uuid

class NominaStampingService:
    @staticmethod
    def timbrar_periodo(periodo_id):
        """
        Itera sobre todos los registros de NominaCentralizada de un periodo
        y genera sus XMLs simulando timbrado.
        """
        try:
            periodo = PeriodoNomina.objects.get(pk=periodo_id)
        except PeriodoNomina.DoesNotExist:
             raise ValueError("Periodo no existe")
             
        registros = NominaCentralizada.objects.filter(periodo=str(periodo.numero), uuid__isnull=True)
        timbrados_count = 0
        
        for row in registros:
            # 1. Generate XML
            xml_content = NominaXMLGenerator.generar_xml_from_centralizada(row, periodo)
            
            # 2. Mock Stamping (Assign UUID)
            fake_uuid = str(uuid.uuid4())
            
            # 3. Save
            row.xml_timbrado = xml_content
            row.uuid = fake_uuid
            row.fecha_timbrado = datetime.now()
            row.save()
            
            timbrados_count += 1
            
        return {
            'status': 'OK',
            'timbrados': timbrados_count,
            'total': registros.count() + timbrados_count
        }
