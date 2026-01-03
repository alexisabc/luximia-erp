from .xml_generator import CFDIBuilder
from .xml_signer import XMLSigner
from .pac_provider import MockPACProvider, SWSapienProvider
from contabilidad.models import Factura, EmpresaFiscal
from pos.models import Venta
from core.services.config_service import ConfigService
from django.core.files.base import ContentFile
from django.utils import timezone
import logging
from lxml import etree

logger = logging.getLogger(__name__)

class FacturacionService:
    def __init__(self):
        self.config_service = ConfigService()
        
    def procesar_venta(self, venta_id: int):
        """
        Orquesta el proceso de facturación: Generar XML -> Firmar -> Timbrar -> Persistir.
        """
        logger.info(f"Iniciando proceso de facturación para Venta ID: {venta_id}")
        
        # 1. Generar XML Estructura
        builder = CFDIBuilder(venta_id)
        xml_estructura = builder.construir_xml()
        logger.debug("XML Estructura generado.")
        
        # 2. Firmar XML (Sellar)
        empresa_fiscal = builder.empresa_fiscal
        # Verify cert
        if not empresa_fiscal.certificado_sello:
             raise ValueError("La empresa no tiene certificado configurado para firmar.")
             
        signer = XMLSigner(empresa_fiscal)
        xml_sellado, cadena_original = signer.firmar_xml(xml_estructura)
        logger.debug("XML firmado y sellado.")
        
        # 3. Timbrar (PAC)
        pac_provider = self._get_pac_provider()
        xml_timbrado, uuid_fiscal = pac_provider.timbrar(xml_sellado)
        logger.info(f"Timbrado exitoso. UUID: {uuid_fiscal}")
        
        # 4. Persistir Factura
        self._guardar_factura(builder, xml_timbrado, uuid_fiscal)
        
        return {
            'xml_timbrado': xml_timbrado,
            'cadena_original': cadena_original,
            'uuid': uuid_fiscal
        }

    def _get_pac_provider(self):
        provider_name = self.config_service.get_value("FISCAL_PAC_PROVIDER", "MOCK")
        if provider_name == "SW_SAPIENS":
            token = self.config_service.get_value("FISCAL_PAC_TOKEN")
            return SWSapienProvider(token=token)
        else:
            return MockPACProvider()

    def _guardar_factura(self, builder, xml_timbrado, uuid_fiscal):
        # Extract basic timestamps from XML ideally, but using current time for MVP
        from datetime import datetime
        
        fecha_emision = timezone.now()
        fecha_timbrado = timezone.now()
        
        venta = builder.venta
        cliente = builder.cliente
        empresa = builder.empresa_fiscal.empresa
        
        factura = Factura.objects.create(
            uuid=uuid_fiscal,
            fecha_emision=fecha_emision,
            fecha_timbrado=fecha_timbrado,
            
            # Emisor
            emisor_rfc=empresa.rfc,
            emisor_nombre=empresa.razon_social,
            emisor_regimen=builder.empresa_fiscal.regimen_fiscal.codigo,
            
            # Receptor
            receptor_rfc=cliente.rfc,
            receptor_nombre=cliente.razon_social or cliente.nombre_completo,
            # receptor_regimen... (Factura field exists but charfield? Checking model...)
            # Factura model has receptor_regimen CharField.
            receptor_regimen=cliente.regimen_fiscal.codigo if cliente.regimen_fiscal else None,
            uso_cfdi=cliente.uso_cfdi.codigo if cliente.uso_cfdi else None,
            
            # Totales
            subtotal=venta.subtotal,
            total=venta.total,
            impuestos_trasladados=venta.impuestos,
            # impuestos_retenidos=0,
            
            # FKs
            # moneda... defaulting to MXN (need lookup if model strict)
            # metodo_pago... need lookup
            tipo_comprobante='I',
            estado_sat='VIGENTE',
            
            # Relaciones
            cliente=cliente,
            venta=venta
        )
        
        # Save XML file
        file_name = f"{uuid_fiscal}.xml"
        factura.xml_archivo.save(file_name, ContentFile(xml_timbrado.encode('utf-8')))
        factura.save()
