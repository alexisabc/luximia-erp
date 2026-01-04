"""
Servicio para generación de XML CFDI 4.0 según Anexo 20 del SAT
"""
from decimal import Decimal
from datetime import datetime
from lxml import etree
from django.conf import settings
from contabilidad.models import Factura, ConceptoFactura, ImpuestoConcepto


class CFDIService:
    """
    Servicio principal para generación de CFDI 4.0
    """
    
    # Namespaces según SAT
    NAMESPACES = {
        'cfdi': 'http://www.sat.gob.mx/cfd/4',
        'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    }
    
    SCHEMA_LOCATION = 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'
    
    @classmethod
    def generar_xml(cls, factura_id: int) -> str:
        """
        Genera el XML de una factura según CFDI 4.0
        
        Args:
            factura_id: ID de la factura a generar
            
        Returns:
            str: XML generado como string
        """
        factura = Factura.objects.select_related(
            'empresa', 'cliente', 'forma_pago', 'metodo_pago'
        ).prefetch_related(
            'conceptos__impuestos'
        ).get(id=factura_id)
        
        # Validar que la factura esté en estado correcto
        if factura.estado not in ['BORRADOR', 'ERROR']:
            raise ValueError(f"La factura está en estado {factura.estado}, no se puede regenerar XML")
        
        # Crear elemento raíz
        nsmap = {None: cls.NAMESPACES['cfdi'], 'xsi': cls.NAMESPACES['xsi']}
        root = etree.Element(
            f"{{{cls.NAMESPACES['cfdi']}}}Comprobante",
            nsmap=nsmap,
            attrib={
                'Version': '4.0',
                'Serie': factura.serie or '',
                'Folio': factura.folio,
                'Fecha': factura.fecha.strftime('%Y-%m-%dT%H:%M:%S'),
                'FormaPago': factura.forma_pago.clave,
                'CondicionesDePago': factura.condiciones_pago or '',
                'SubTotal': f"{factura.subtotal:.2f}",
                'Descuento': f"{factura.descuento:.2f}" if factura.descuento > 0 else '',
                'Moneda': factura.moneda,
                'TipoCambio': f"{factura.tipo_cambio:.6f}" if factura.moneda != 'MXN' else '',
                'Total': f"{factura.total:.2f}",
                'TipoDeComprobante': factura.tipo_comprobante,
                'MetodoPago': factura.metodo_pago.clave,
                'LugarExpedicion': factura.lugar_expedicion or factura.empresa.codigo_postal,
                f"{{{cls.NAMESPACES['xsi']}}}schemaLocation": cls.SCHEMA_LOCATION,
            }
        )
        
        # Agregar Emisor
        cls._agregar_emisor(root, factura)
        
        # Agregar Receptor
        cls._agregar_receptor(root, factura)
        
        # Agregar Conceptos
        cls._agregar_conceptos(root, factura)
        
        # Agregar Impuestos (resumen)
        cls._agregar_impuestos_resumen(root, factura)
        
        # Convertir a string
        xml_string = etree.tostring(
            root,
            pretty_print=True,
            xml_declaration=True,
            encoding='UTF-8'
        ).decode('utf-8')
        
        # Guardar XML original en la factura
        factura.xml_original = xml_string
        factura.save(update_fields=['xml_original'])
        
        return xml_string
    
    @classmethod
    def _agregar_emisor(cls, root, factura):
        """Agrega el nodo Emisor"""
        empresa = factura.empresa
        config_fiscal = getattr(empresa, 'configuracion_fiscal', None)
        
        emisor = etree.SubElement(
            root,
            f"{{{cls.NAMESPACES['cfdi']}}}Emisor",
            attrib={
                'Rfc': empresa.rfc,
                'Nombre': empresa.razon_social,
                'RegimenFiscal': config_fiscal.regimen_fiscal.clave if config_fiscal else '601',
            }
        )
        
        return emisor
    
    @classmethod
    def _agregar_receptor(cls, root, factura):
        """Agrega el nodo Receptor"""
        cliente = factura.cliente
        
        # Determinar UsoCFDI - por ahora usar G03 por defecto
        uso_cfdi = 'G03'  # Gastos en general
        
        receptor = etree.SubElement(
            root,
            f"{{{cls.NAMESPACES['cfdi']}}}Receptor",
            attrib={
                'Rfc': cliente.rfc,
                'Nombre': cliente.nombre_completo,
                'DomicilioFiscalReceptor': cliente.codigo_postal or '00000',
                'RegimenFiscalReceptor': getattr(cliente, 'regimen_fiscal_clave', '616'),
                'UsoCFDI': uso_cfdi,
            }
        )
        
        return receptor
    
    @classmethod
    def _agregar_conceptos(cls, root, factura):
        """Agrega el nodo Conceptos y sus hijos"""
        conceptos_node = etree.SubElement(
            root,
            f"{{{cls.NAMESPACES['cfdi']}}}Conceptos"
        )
        
        for concepto in factura.conceptos.all().order_by('numero_linea'):
            concepto_attrs = {
                'ClaveProdServ': concepto.clave_prod_serv.clave,
                'NoIdentificacion': concepto.no_identificacion or '',
                'Cantidad': f"{concepto.cantidad:.2f}",
                'ClaveUnidad': concepto.clave_unidad.clave,
                'Unidad': concepto.clave_unidad.nombre,
                'Descripcion': concepto.descripcion,
                'ValorUnitario': f"{concepto.valor_unitario:.6f}",
                'Importe': f"{concepto.importe:.2f}",
                'ObjetoImp': concepto.objeto_imp,
            }
            
            if concepto.descuento > 0:
                concepto_attrs['Descuento'] = f"{concepto.descuento:.2f}"
            
            concepto_node = etree.SubElement(
                conceptos_node,
                f"{{{cls.NAMESPACES['cfdi']}}}Concepto",
                attrib=concepto_attrs
            )
            
            # Agregar impuestos del concepto
            cls._agregar_impuestos_concepto(concepto_node, concepto)
        
        return conceptos_node
    
    @classmethod
    def _agregar_impuestos_concepto(cls, concepto_node, concepto):
        """Agrega impuestos a un concepto"""
        impuestos = concepto.impuestos.all()
        
        if not impuestos.exists():
            return
        
        impuestos_node = etree.SubElement(
            concepto_node,
            f"{{{cls.NAMESPACES['cfdi']}}}Impuestos"
        )
        
        # Separar traslados y retenciones
        traslados = impuestos.filter(tipo='TRASLADO')
        retenciones = impuestos.filter(tipo='RETENCION')
        
        # Agregar traslados
        if traslados.exists():
            traslados_node = etree.SubElement(
                impuestos_node,
                f"{{{cls.NAMESPACES['cfdi']}}}Traslados"
            )
            
            for traslado in traslados:
                etree.SubElement(
                    traslados_node,
                    f"{{{cls.NAMESPACES['cfdi']}}}Traslado",
                    attrib={
                        'Base': f"{traslado.base:.2f}",
                        'Impuesto': traslado.impuesto,
                        'TipoFactor': traslado.tipo_factor,
                        'TasaOCuota': f"{traslado.tasa_o_cuota:.6f}",
                        'Importe': f"{traslado.importe:.2f}",
                    }
                )
        
        # Agregar retenciones
        if retenciones.exists():
            retenciones_node = etree.SubElement(
                impuestos_node,
                f"{{{cls.NAMESPACES['cfdi']}}}Retenciones"
            )
            
            for retencion in retenciones:
                etree.SubElement(
                    retenciones_node,
                    f"{{{cls.NAMESPACES['cfdi']}}}Retencion",
                    attrib={
                        'Base': f"{retencion.base:.2f}",
                        'Impuesto': retencion.impuesto,
                        'TipoFactor': retencion.tipo_factor,
                        'TasaOCuota': f"{retencion.tasa_o_cuota:.6f}",
                        'Importe': f"{retencion.importe:.2f}",
                    }
                )
    
    @classmethod
    def _agregar_impuestos_resumen(cls, root, factura):
        """Agrega el nodo Impuestos con el resumen de impuestos"""
        # Calcular totales de impuestos
        totales = cls._calcular_totales_impuestos(factura)
        
        if not totales['traslados'] and not totales['retenciones']:
            return
        
        impuestos_attrs = {}
        
        if totales['total_retenciones'] > 0:
            impuestos_attrs['TotalImpuestosRetenidos'] = f"{totales['total_retenciones']:.2f}"
        
        if totales['total_traslados'] > 0:
            impuestos_attrs['TotalImpuestosTrasladados'] = f"{totales['total_traslados']:.2f}"
        
        impuestos_node = etree.SubElement(
            root,
            f"{{{cls.NAMESPACES['cfdi']}}}Impuestos",
            attrib=impuestos_attrs
        )
        
        # Agregar retenciones
        if totales['retenciones']:
            retenciones_node = etree.SubElement(
                impuestos_node,
                f"{{{cls.NAMESPACES['cfdi']}}}Retenciones"
            )
            
            for impuesto, importe in totales['retenciones'].items():
                etree.SubElement(
                    retenciones_node,
                    f"{{{cls.NAMESPACES['cfdi']}}}Retencion",
                    attrib={
                        'Impuesto': impuesto,
                        'Importe': f"{importe:.2f}",
                    }
                )
        
        # Agregar traslados
        if totales['traslados']:
            traslados_node = etree.SubElement(
                impuestos_node,
                f"{{{cls.NAMESPACES['cfdi']}}}Traslados"
            )
            
            for key, data in totales['traslados'].items():
                etree.SubElement(
                    traslados_node,
                    f"{{{cls.NAMESPACES['cfdi']}}}Traslado",
                    attrib={
                        'Base': f"{data['base']:.2f}",
                        'Impuesto': data['impuesto'],
                        'TipoFactor': data['tipo_factor'],
                        'TasaOCuota': f"{data['tasa']:.6f}",
                        'Importe': f"{data['importe']:.2f}",
                    }
                )
    
    @classmethod
    def _calcular_totales_impuestos(cls, factura):
        """Calcula los totales de impuestos de la factura"""
        from collections import defaultdict
        
        traslados = defaultdict(lambda: {'base': Decimal('0'), 'importe': Decimal('0'), 'impuesto': '', 'tipo_factor': '', 'tasa': Decimal('0')})
        retenciones = defaultdict(Decimal)
        
        for concepto in factura.conceptos.all():
            for impuesto in concepto.impuestos.all():
                if impuesto.tipo == 'TRASLADO':
                    key = f"{impuesto.impuesto}_{impuesto.tasa_o_cuota}"
                    traslados[key]['base'] += impuesto.base
                    traslados[key]['importe'] += impuesto.importe
                    traslados[key]['impuesto'] = impuesto.impuesto
                    traslados[key]['tipo_factor'] = impuesto.tipo_factor
                    traslados[key]['tasa'] = impuesto.tasa_o_cuota
                else:  # RETENCION
                    retenciones[impuesto.impuesto] += impuesto.importe
        
        return {
            'traslados': dict(traslados),
            'retenciones': dict(retenciones),
            'total_traslados': sum(t['importe'] for t in traslados.values()),
            'total_retenciones': sum(retenciones.values()),
        }
    
    @classmethod
    def generar_cadena_original(cls, xml_string: str) -> str:
        """
        Genera la cadena original del comprobante
        
        Args:
            xml_string: XML del CFDI
            
        Returns:
            str: Cadena original
        """
        # TODO: Implementar transformación XSLT con el archivo del SAT
        # Por ahora retornar placeholder
        return "||CADENA_ORIGINAL_PLACEHOLDER||"
    
    @classmethod
    def validar_xml(cls, xml_string: str) -> tuple[bool, list[str]]:
        """
        Valida el XML contra el XSD del SAT
        
        Args:
            xml_string: XML a validar
            
        Returns:
            tuple: (es_valido, lista_errores)
        """
        # TODO: Implementar validación contra XSD
        # Por ahora retornar True
        return True, []
