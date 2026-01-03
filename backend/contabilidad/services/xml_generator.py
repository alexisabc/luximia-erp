import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
from django.utils import timezone
from core.services.config_service import ConfigService
from contabilidad.models import EmpresaFiscal, Factura
from pos.models import Venta
from rest_framework.exceptions import ValidationError

class CFDIBuilder:
    MAP_FORMA_PAGO = {
        'EFECTIVO': '01',
        'TARJETA': '04',
        'TRANSFERENCIA': '03',
        'CREDITO': '99', # Por definir en Pago
        'ANTICIPO': '12', # Dación en pago ? O 30
        'MIXTO': '99'
    }

    def __init__(self, venta_id):
        self.venta = Venta.objects.get(pk=venta_id)
        self.cliente = self.venta.cliente
        self.empresa_fiscal = EmpresaFiscal.objects.first()
        self.config_service = ConfigService()
        
        self.is_sandbox = self.config_service.is_feature_enabled("FISCAL_SANDBOX_MODE")
        self.pac_provider = self.config_service.get_value("FISCAL_PAC_PROVIDER", "SW_SAPIENS")

    def validar_requisitos(self):
        if not self.empresa_fiscal:
            raise ValueError("No existe configuración fiscal para la empresa emisor.")
        
        # Validar Cliente
        if not self.cliente:
             # Logic for public general would go here
             raise ValueError("Venta no tiene cliente asignado.")
        
        if not self.cliente.rfc:
            raise ValueError(f"El cliente {self.cliente.nombre_completo} no tiene RFC registrado.")
            
        if not self.cliente.codigo_postal:
            raise ValueError(f"El cliente {self.cliente.nombre_completo} no tiene Código Postal.")

        # Validar Productos
        for detalle in self.venta.detalles.all():
            if detalle.producto:
                prod = detalle.producto
                if not getattr(prod, 'clave_sat_producto', None):
                    raise ValueError(f"El producto '{prod.nombre}' no tiene Clave SAT (clave_sat_producto).")
                if not getattr(prod, 'clave_sat_unidad', None):
                    raise ValueError(f"El producto '{prod.nombre}' no tiene Clave Unidad SAT (clave_sat_unidad).")

    def construir_xml(self):
        self.validar_requisitos()
        
        # Namespaces
        CFDI_NS = "http://www.sat.gob.mx/cfd/4"
        XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"
        
        ET.register_namespace('cfdi', CFDI_NS)
        ET.register_namespace('xsi', XSI_NS)
        
        # Comprobante (Root)
        root = ET.Element(f"{{{CFDI_NS}}}Comprobante")
        root.set("Version", "4.0")
        root.set("Serie", self.empresa_fiscal.empresa.serie_factura or "A") 
        root.set("Folio", str(self.venta.folio).replace("T-",""))
        root.set("Fecha", timezone.now().strftime("%Y-%m-%dT%H:%M:%S"))
        root.set("Sello", "")
        # Forma Pago Mapeada
        forma_pago_sat = self.MAP_FORMA_PAGO.get(self.venta.metodo_pago, '01')
        root.set("FormaPago", forma_pago_sat)
        root.set("NoCertificado", "")
        root.set("Certificado", "")
        
        # Montos
        subtotal = self.venta.subtotal
        total = self.venta.total
        
        root.set("SubTotal", f"{subtotal:.2f}")
        root.set("Moneda", "MXN") # Hardcoded MVP
        root.set("Total", f"{total:.2f}")
        root.set("TipoDeComprobante", "I")
        root.set("Exportacion", "01")
        root.set("MetodoPago", "PUE") 
        root.set("LugarExpedicion", self.empresa_fiscal.codigo_postal)
        
        # Schema Location
        root.set(f"{{{XSI_NS}}}schemaLocation", f"{CFDI_NS} http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd")

        # Emisor
        emisor = ET.SubElement(root, f"{{{CFDI_NS}}}Emisor")
        emisor.set("Rfc", self.empresa_fiscal.empresa.rfc)
        emisor.set("Nombre", self.empresa_fiscal.empresa.razon_social)
        emisor.set("RegimenFiscal", self.empresa_fiscal.regimen_fiscal.codigo)
        
        # Receptor
        receptor = ET.SubElement(root, f"{{{CFDI_NS}}}Receptor")
        receptor.set("Rfc", self.cliente.rfc)
        receptor.set("Nombre", self.cliente.razon_social or self.cliente.nombre_completo)
        receptor.set("DomicilioFiscalReceptor", self.cliente.codigo_postal)
        receptor.set("RegimenFiscalReceptor", "616") 
        receptor.set("UsoCFDI", "G03") 
        
        if self.cliente.regimen_fiscal:
             receptor.set("RegimenFiscalReceptor", self.cliente.regimen_fiscal.codigo)
        if self.cliente.uso_cfdi:
             receptor.set("UsoCFDI", self.cliente.uso_cfdi.codigo)

        # Conceptos
        conceptos_elem = ET.SubElement(root, f"{{{CFDI_NS}}}Conceptos")
        
        total_impuestos_trasladados = Decimal('0.00')
        base_iva_16 = Decimal('0.00')
        importe_iva_16 = Decimal('0.00')

        for detalle in self.venta.detalles.all():
            prod = detalle.producto
            if not prod: continue # Skip insumos if not supported yet
            
            concepto = ET.SubElement(conceptos_elem, f"{{{CFDI_NS}}}Concepto")
            
            concepto.set("ClaveProdServ", prod.clave_sat_producto)
            concepto.set("NoIdentificacion", prod.codigo)
            concepto.set("Cantidad", f"{detalle.cantidad:.2f}")
            concepto.set("ClaveUnidad", prod.clave_sat_unidad)
            concepto.set("Unidad", prod.unidad_medida)
            concepto.set("Descripcion", prod.nombre)
            concepto.set("ValorUnitario", f"{detalle.precio_unitario:.2f}")
            concepto.set("Importe", f"{detalle.subtotal:.2f}")
            concepto.set("ObjetoImp", "02")
            
            # Impuestos (Assuming standard 16% for MVP)
            impuestos_c = ET.SubElement(concepto, f"{{{CFDI_NS}}}Impuestos")
            traslados_c = ET.SubElement(impuestos_c, f"{{{CFDI_NS}}}Traslados")
            traslado_c = ET.SubElement(traslados_c, f"{{{CFDI_NS}}}Traslado")
            
            base = detalle.subtotal
            impuesto = base * Decimal('0.16')
            
            base_iva_16 += base
            importe_iva_16 += impuesto
            total_impuestos_trasladados += impuesto
            
            traslado_c.set("Base", f"{base:.2f}")
            traslado_c.set("Impuesto", "002")
            traslado_c.set("TipoFactor", "Tasa")
            traslado_c.set("TasaOCuota", "0.160000")
            traslado_c.set("Importe", f"{impuesto:.2f}")

        # Impuestos Globales
        impuestos_g = ET.SubElement(root, f"{{{CFDI_NS}}}Impuestos")
        impuestos_g.set("TotalImpuestosTrasladados", f"{total_impuestos_trasladados:.2f}")
        
        traslados_g = ET.SubElement(impuestos_g, f"{{{CFDI_NS}}}Traslados")
        traslado_g = ET.SubElement(traslados_g, f"{{{CFDI_NS}}}Traslado")
        traslado_g.set("Base", f"{base_iva_16:.2f}")
        traslado_g.set("Impuesto", "002")
        traslado_g.set("TipoFactor", "Tasa")
        traslado_g.set("TasaOCuota", "0.160000")
        traslado_g.set("Importe", f"{importe_iva_16:.2f}")

        return ET.tostring(root, encoding='UTF-8').decode('UTF-8')
    def construir_rep(self, pagos_data):
        """
        Construye un Complemento de Pago (REP 2.0).
        pagos_data: list of dicts {monto, fecha, forma_pago, uuid_factura, saldo_anterior, saldo_insoluto, num_parcialidad}
        """
        CFDI_NS = "http://www.sat.gob.mx/cfd/4"
        PAGO_NS = "http://www.sat.gob.mx/Pagos20"
        XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"
        
        ET.register_namespace('cfdi', CFDI_NS)
        ET.register_namespace('pago20', PAGO_NS)
        ET.register_namespace('xsi', XSI_NS)
        
        root = ET.Element(f"{{{CFDI_NS}}}Comprobante")
        root.set("Version", "4.0")
        root.set("Fecha", timezone.now().strftime("%Y-%m-%dT%H:%M:%S"))
        root.set("Sello", "")
        root.set("NoCertificado", "")
        root.set("Certificado", "")
        root.set("SubTotal", "0")
        root.set("Moneda", "XXX")
        root.set("Total", "0")
        root.set("TipoDeComprobante", "P")
        root.set("Exportacion", "01")
        root.set("LugarExpedicion", self.empresa_fiscal.codigo_postal)
        root.set(f"{{{XSI_NS}}}schemaLocation", f"{CFDI_NS} http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd {PAGO_NS} http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd")

        # Emisor / Receptor (Igual que factura)
        emisor = ET.SubElement(root, f"{{{CFDI_NS}}}Emisor")
        emisor.set("Rfc", self.empresa_fiscal.empresa.rfc)
        emisor.set("Nombre", self.empresa_fiscal.empresa.razon_social)
        emisor.set("RegimenFiscal", self.empresa_fiscal.regimen_fiscal.codigo)
        
        receptor = ET.SubElement(root, f"{{{CFDI_NS}}}Receptor")
        receptor.set("Rfc", self.cliente.rfc)
        receptor.set("Nombre", self.cliente.razon_social or self.cliente.nombre_completo)
        receptor.set("DomicilioFiscalReceptor", self.cliente.codigo_postal)
        receptor.set("RegimenFiscalReceptor", self.cliente.regimen_fiscal.codigo if self.cliente.regimen_fiscal else "616")
        receptor.set("UsoCFDI", "CP01") # UsoCFDI para pagos

        # Concepto (Especial para REP)
        conceptos = ET.SubElement(root, f"{{{CFDI_NS}}}Conceptos")
        concepto = ET.SubElement(conceptos, f"{{{CFDI_NS}}}Concepto")
        concepto.set("ClaveProdServ", "84111506")
        concepto.set("Cantidad", "1")
        concepto.set("ClaveUnidad", "ACT")
        concepto.set("Descripcion", "Pago")
        concepto.set("ValorUnitario", "0")
        concepto.set("Importe", "0")
        concepto.set("ObjetoImp", "01")

        # Complemento
        complemento = ET.SubElement(root, f"{{{CFDI_NS}}}Complemento")
        pagos_root = ET.SubElement(complemento, f"{{{PAGO_NS}}}Pagos")
        pagos_root.set("Version", "2.0")
        
        # Totales del pago
        monto_total_pagos = sum(p['monto'] for p in pagos_data)
        totales = ET.SubElement(pagos_root, f"{{{PAGO_NS}}}Totales")
        totales.set("MontoTotalPagos", f"{monto_total_pagos:.2f}")
        
        for p_info in pagos_data:
            pago_elem = ET.SubElement(pagos_root, f"{{{PAGO_NS}}}Pago")
            pago_elem.set("FechaPago", p_info['fecha'])
            pago_elem.set("FormaDePagoP", p_info['forma_pago'])
            pago_elem.set("MonedaP", "MXN")
            pago_elem.set("TipoCambioP", "1")
            pago_elem.set("Monto", f"{p_info['monto']:.2f}")
            
            docto_relacionado = ET.SubElement(pago_elem, f"{{{PAGO_NS}}}DoctoRelacionado")
            docto_relacionado.set("IdDocumento", p_info['uuid_factura'])
            docto_relacionado.set("MonedaDR", "MXN")
            docto_relacionado.set("EquivalenciaDR", "1")
            docto_relacionado.set("NumParcialidad", str(p_info['num_parcialidad']))
            docto_relacionado.set("ImpSaldoAnt", f"{p_info['saldo_anterior']:.2f}")
            docto_relacionado.set("ImpPagado", f"{p_info['monto']:.2f}")
            docto_relacionado.set("ImpSaldoInsoluto", f"{p_info['saldo_insoluto']:.2f}")
            docto_relacionado.set("ObjetoImpDR", "02") # Si la factura tiene impuestos

        return ET.tostring(root, encoding='UTF-8').decode('UTF-8')
