import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal

class NominaXMLGenerator:
    @staticmethod
    def generar_xml(recibo):
        """
        Genera el XML (CFDI 4.0 + Nomina 1.2) para un ReciboNomina dado.
        """
        # Namespaces
        CFDI_NS = "http://www.sat.gob.mx/cfd/4"
        NOMINA_NS = "http://www.sat.gob.mx/nomina12"
        XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"
        
        ET.register_namespace('cfdi', CFDI_NS)
        ET.register_namespace('nomina12', NOMINA_NS)
        ET.register_namespace('xsi', XSI_NS)
        
        # Root Comprobante
        root = ET.Element(f"{{{CFDI_NS}}}Comprobante")
        root.set("Version", "4.0")
        root.set("Serie", "N")
        root.set("Folio", str(recibo.id))
        root.set("Fecha", datetime.now().strftime("%Y-%m-%dT%H:%M:%S"))
        root.set("Sello", "MOCK_SELLO_DIGITAL_DE_PRUEBA_SYSTEMA_ERP_XYZ")
        root.set("NoCertificado", "30001000000500003416") 
        root.set("Certificado", "MOCK_CERTIFICADO_BASE64_STRING")
        
        # Totales
        subtotal = recibo.subtotal
        descuentos = recibo.descuentos
        total = recibo.neto
        
        root.set("SubTotal", f"{subtotal:.2f}")
        root.set("Descuento", f"{descuentos:.2f}")
        root.set("Moneda", "MXN")
        root.set("Total", f"{total:.2f}")
        root.set("TipoDeComprobante", "N")
        root.set("Exportacion", "01")
        root.set("MetodoPago", "PUE")
        root.set("LugarExpedicion", "20000") # Hardcoded for prototyping
        
        root.set(f"{{{XSI_NS}}}schemaLocation", f"{CFDI_NS} http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd {NOMINA_NS} http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd")

        # Emisor
        emisor = ET.SubElement(root, f"{{{CFDI_NS}}}Emisor")
        rs = recibo.nomina.razon_social
        emisor.set("Rfc", rs.rfc or "AAA010101AAA")
        emisor.set("Nombre", rs.nombre_o_razon_social)
        emisor.set("RegimenFiscal", "601")

        # Receptor
        receptor = ET.SubElement(root, f"{{{CFDI_NS}}}Receptor")
        emp = recibo.empleado
        doc_oficial = getattr(emp, 'documentacion_oficial', None)
        # Fallback RFC for test
        receptor_rfc = doc_oficial.rfc if doc_oficial and doc_oficial.rfc else "XAXX010101000"
        
        receptor.set("Rfc", receptor_rfc)
        receptor.set("Nombre", f"{emp.nombres} {emp.apellido_paterno}".strip())
        receptor.set("DomicilioFiscalReceptor", "20000")
        receptor.set("RegimenFiscalReceptor", "605")
        receptor.set("UsoCFDI", "Cn01")

        # Conceptos (1 Concepto Genérico)
        conceptos = ET.SubElement(root, f"{{{CFDI_NS}}}Conceptos")
        concepto = ET.SubElement(conceptos, f"{{{CFDI_NS}}}Concepto")
        concepto.set("ClaveProdServ", "84111505")
        concepto.set("Cantidad", "1")
        concepto.set("ClaveUnidad", "ACT")
        concepto.set("Descripcion", "Pago de nómina")
        concepto.set("ValorUnitario", f"{subtotal:.2f}")
        concepto.set("Importe", f"{subtotal:.2f}")
        concepto.set("Descuento", f"{descuentos:.2f}")
        concepto.set("ObjetoImp", "01")

        # Complemento
        complemento = ET.SubElement(root, f"{{{CFDI_NS}}}Complemento")
        
        # Nomina12
        nomina_node = ET.SubElement(complemento, f"{{{NOMINA_NS}}}Nomina")
        nomina_node.set("Version", "1.2")
        nomina_node.set("TipoNomina", "O")
        
        # Fechas
        nheader = recibo.nomina
        nomina_node.set("FechaPago", nheader.fecha_pago.strftime("%Y-%m-%d"))
        nomina_node.set("FechaInicialPago", nheader.fecha_inicio.strftime("%Y-%m-%d"))
        nomina_node.set("FechaFinalPago", nheader.fecha_fin.strftime("%Y-%m-%d"))
        nomina_node.set("NumDiasPagados", f"{recibo.dias_pagados:.3f}")
        
        # Totales Nomina 
        detalles = list(recibo.detalles.all().select_related('concepto'))
        
        total_p = sum(d.monto_total for d in detalles if d.concepto.tipo == 'PERCEPCION')
        total_d = sum(d.monto_total for d in detalles if d.concepto.tipo == 'DEDUCCION')
        
        nomina_node.set("TotalPercepciones", f"{total_p:.2f}")
        nomina_node.set("TotalDeducciones", f"{total_d:.2f}")
        
        # Emisor Nomina
        n_emisor = ET.SubElement(nomina_node, f"{{{NOMINA_NS}}}Emisor")
        n_emisor.set("RegistroPatronal", "Y543219810") 

        # Receptor Nomina
        curp_receptor = doc_oficial.curp if doc_oficial and doc_oficial.curp else "AAAA010101AAAAAA01"
        n_receptor = ET.SubElement(nomina_node, f"{{{NOMINA_NS}}}Receptor")
        n_receptor.set("Curp", curp_receptor)
        n_receptor.set("NumEmpleado", emp.no_empleado or str(emp.id))
        n_receptor.set("PeriodicidadPago", "04") # Quincenal
        n_receptor.set("TipoContrato", "01")
        n_receptor.set("TipoRegimen", "02")
        n_receptor.set("ClaveEntFed", "DIF") 
        n_receptor.set("Antiguedad", "P1W") 
        
        n_receptor.set("SalarioBaseCotApor", f"{recibo.sbc:.2f}")
        n_receptor.set("SalarioDiarioIntegrado", f"{recibo.sbc:.2f}")
        
        # Percepciones Node
        n_percepciones = ET.SubElement(nomina_node, f"{{{NOMINA_NS}}}Percepciones")
        
        total_sueldos = total_p # Aprox logic
        total_gravado_p = sum(d.monto_gravado for d in detalles if d.concepto.tipo == 'PERCEPCION')
        total_exento_p = sum(d.monto_exento for d in detalles if d.concepto.tipo == 'PERCEPCION')
        
        n_percepciones.set("TotalSueldos", f"{total_sueldos:.2f}")
        n_percepciones.set("TotalGravado", f"{total_gravado_p:.2f}")
        n_percepciones.set("TotalExento", f"{total_exento_p:.2f}")
        
        for d in detalles:
            if d.concepto.tipo == 'PERCEPCION':
                p_node = ET.SubElement(n_percepciones, f"{{{NOMINA_NS}}}Percepcion")
                p_node.set("TipoPercepcion", d.clave_sat or "001")
                p_node.set("Clave", d.concepto.codigo)
                p_node.set("Concepto", d.nombre_concepto)
                p_node.set("ImporteGravado", f"{d.monto_gravado:.2f}")
                p_node.set("ImporteExento", f"{d.monto_exento:.2f}")

        # Deducciones Node
        n_deducciones = ET.SubElement(nomina_node, f"{{{NOMINA_NS}}}Deducciones")
        
        impuestos_ret = sum(d.monto_total for d in detalles if d.concepto.tipo == 'DEDUCCION' and d.clave_sat == '002')
        otras_ded = sum(d.monto_total for d in detalles if d.concepto.tipo == 'DEDUCCION' and d.clave_sat != '002')
        
        n_deducciones.set("TotalOtrasDeducciones", f"{otras_ded:.2f}")
        n_deducciones.set("TotalImpuestosRetenidos", f"{impuestos_ret:.2f}")
        
        for d in detalles:
             if d.concepto.tipo == 'DEDUCCION':
                ded_node = ET.SubElement(n_deducciones, f"{{{NOMINA_NS}}}Deduccion")
                ded_node.set("TipoDeduccion", d.clave_sat or "001")
                ded_node.set("Clave", d.concepto.codigo)
                ded_node.set("Concepto", d.nombre_concepto)
                ded_node.set("Importe", f"{d.monto_total:.2f}")

        return ET.tostring(root, encoding='utf-8', method='xml').decode('utf-8')
