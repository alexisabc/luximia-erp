from datetime import datetime
from decimal import Decimal
from django.db import transaction
from obras.models import Estimacion
from contabilidad.models import Factura # Assuming this exists or using a generic one
from contabilidad.services.xml_generator import CFDIBuilder

class FacturaService:
    @staticmethod
    def generar_factura_estimacion(estimacion_id, user):
        """
        Genera una Factura (CFDI 4.0) para una Estimación autorizada.
        """
        try:
            estimacion = Estimacion.objects.get(pk=estimacion_id)
        except Estimacion.DoesNotExist:
            raise ValueError("La estimación no existe.")
            
        if estimacion.estado not in ['AUTORIZADA']:
             raise ValueError(f"La estimación debe estar AUTORIZADA (Estado actual: {estimacion.estado})")
             
        # 1. Preparar Datos Genéricos para CFDIBuilder
        detalles = []
        
        # Concepto único por el total de la estimación (simplificado)
        # En producción, podrías desglosar amortización, pero fiscalmente facturamos el Subtotal
        detalles.append({
            'clave_prod': '84111506', # Servicios de facturación (o Obra Civil)
            'no_ident': estimacion.folio,
            'cantidad': 1,
            'clave_unidad': 'E48', # Unidad de servicio
            'unidad': 'Servicio',
            'descripcion': f"Estimación {estimacion.folio} - {estimacion.obra.nombre}",
            'precio': estimacion.subtotal, 
            'importe': estimacion.subtotal,
            'objeto_imp': '02'
        })
        
        invoice_data = {
            'cliente': estimacion.obra.cliente, # Asumimos que Obra tiene Cliente y este Cliente tiene datos fiscales
            'folio': estimacion.folio.replace("OBR", "F"), # Generar folio fiscal interno
            'metodo_pago': 'PPD', # Pago en parcialidades o diferido (Standard for construction)
            'forma_pago': '99', # Por definir (Standard for PPD)
            'subtotal': estimacion.subtotal,
            'total': estimacion.total,
            'detalles': detalles
        }
        
        # 2. Generar XML (Builder -> Signer)
        builder = CFDIBuilder(invoice_data)
        xml_content = builder.construir_xml()
        
        # 3. Guardar Registro (Mock Stamping)
        # Aquí llamaríamos al PAC para timbrar. Simularemos éxito.
        uuid_mock = "11111111-2222-3333-4444-555555555555"
        
        with transaction.atomic():
            # Crear registro Factura
            # Nota: Ajustar modelo Factura según esquema real
            # fac = Factura.objects.create(...)
            
            # Actualizar Estimación
            estimacion.estado = 'FACTURADA'
            # estimacion.factura_uuid = uuid_mock
            estimacion.save()
            
            # Guardar archivo XML en disco (simulado)
            # save_xml_file(xml_content, uuid_mock)
            
        return {
            'xml': xml_content,
            'uuid': uuid_mock,
            'mensaje': "Factura generada y timbrada (Simulación) correctamente."
        }
