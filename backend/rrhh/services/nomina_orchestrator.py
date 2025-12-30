from django.db import transaction
from decimal import Decimal
from rrhh.models import Nomina, ReciboNomina, DetalleReciboItem, Empleado, ConceptoNomina, TipoConcepto
from .calculo_nomina_service import CalculoNominaService

class NominaOrchestrator:
    @staticmethod
    def procesar_nomina(nomina_id):
        """
        Calcula la nómina completa para todos los empleados de la Razón Social.
        Genera Recibos y Detalles.
        """
        with transaction.atomic():
            nomina = Nomina.objects.get(pk=nomina_id)
            
            # 1. Limpieza (Idempotencia): Eliminar recibos previos de esta nómina
            # Al ser SoftDelete, si queremos recalcular limpio, borramos físicamente o marcamos inactivo.
            # Para evitar duplicados en queries, usaremos borrado físico de los items detalle y recibo 
            # (o confiar en que la logica de Negocio maneje versiones).
            # Simplificación: Hard delete de Recibos asociados a esta nomina borrador para regenerar.
            ReciboNomina.objects.filter(nomina=nomina).delete() # Soft delete by default manager?
            # Si usamos .filter().delete(), llama al delete() del Queryset. Si es SoftDeleteManager, hace soft delete.
            # Para recalculo, mejor hard delete o reactivar?
            # Asumiremos que está bien generar nuevos y los viejos quedan inactivos.
            
            empleados = Empleado.objects.filter(activo=True, razon_social=nomina.razon_social)
            
            total_percepciones_global = Decimal(0)
            total_deducciones_global = Decimal(0)
            total_neto_global = Decimal(0)
            
            # Determinar días
            dias_periodo = (nomina.fecha_fin - nomina.fecha_inicio).days + 1
            dias_pagar = 15 if 13 <= dias_periodo <= 16 else dias_periodo
            
            for emp in empleados:
                # Calcular
                resultado = CalculoNominaService.calcular_proyeccion(emp, dias=dias_pagar, anio=nomina.fecha_inicio.year)
                
                # Crear Recibo Header
                # Extraer info para columnas especificas
                imss_ret = sum(d['monto_total'] for d in resultado['deducciones'] if 'IMSS' in d['concepto'])
                isr_ret = sum(d['monto_total'] for d in resultado['deducciones'] if 'ISR' in d['concepto'])
                
                recibo = ReciboNomina.objects.create(
                    nomina=nomina,
                    empleado=emp,
                    salario_diario=emp.datos_laborales.salario_diario,
                    sbc=getattr(emp.datos_laborales, 'salario_diario_integrado', 0),
                    dias_pagados=dias_pagar,
                    subtotal=resultado['total_percepciones'],
                    descuentos=resultado['total_deducciones'],
                    neto=resultado['neto'],
                    impuestos_retenidos=isr_ret,
                    imss_retenido=imss_ret
                )
                
                # Detalles (Items)
                items_to_create = []
                
                def procesar_lista(lista, tipo_enum):
                    for item in lista:
                        # Buscar concepto (Upsert logic simplificada)
                        # Buscamos por nombre exacto o creamos
                        nombre = item['concepto']
                        concepto_obj = ConceptoNomina.objects.filter(nombre__iexact=nombre).first()
                        if not concepto_obj:
                            concepto_obj = ConceptoNomina.objects.create(
                                codigo=item.get('clave_sat', 'GEN'),
                                nombre=nombre,
                                tipo=tipo_enum,
                                clave_sat=item.get('clave_sat')
                            )
                        
                        items_to_create.append(DetalleReciboItem(
                            recibo=recibo,
                            concepto=concepto_obj,
                            clave_sat=item.get('clave_sat'),
                            nombre_concepto=nombre,
                            monto_gravado=item.get('monto_gravado', 0),
                            monto_exento=item.get('monto_exento', 0),
                            monto_total=item['monto_total']
                        ))

                procesar_lista(resultado['percepciones'], TipoConcepto.PERCEPCION)
                procesar_lista(resultado['deducciones'], TipoConcepto.DEDUCCION)
                
                DetalleReciboItem.objects.bulk_create(items_to_create)
                
                total_percepciones_global += resultado['total_percepciones']
                total_deducciones_global += resultado['total_deducciones']
                total_neto_global += resultado['neto']
            
            # Actualizar Cabecera
            nomina.total_percepciones = total_percepciones_global
            nomina.total_deducciones = total_deducciones_global
            nomina.total_neto = total_neto_global
            nomina.estado = 'CALCULADA'
            nomina.save()

    @staticmethod
    def timbrar_nomina(nomina_id):
        """
        Genera el XML de cada recibo y solicita el timbrado al PAC.
        """
        from contabilidad.services.pac.factory import PACFactory
        from .xml_generator import NominaXMLGenerator
        from django.utils import timezone
        
        with transaction.atomic():
            nomina = Nomina.objects.select_for_update().get(pk=nomina_id)
            
            # Instanciar PAC (Mock o Real según settings)
            provider = PACFactory.get_provider()
            
            recibos = ReciboNomina.objects.filter(nomina=nomina).select_related('empleado', 'nomina', 'empleado__documentacion_oficial', 'nomina__razon_social')
            
            timbrados_count = 0
            
            for recibo in recibos:
                if recibo.uuid:
                    timbrados_count += 1
                    continue
                
                try:
                    # 1. Generar XML
                    xml_content = NominaXMLGenerator.generar_xml(recibo)
                    
                    # 2. Enviar al PAC
                    resultado = provider.timbrar(xml_content)
                    
                    if resultado['success']:
                        recibo.uuid = resultado['uuid']
                        recibo.xml_timbrado = resultado['xml_timbrado']
                        recibo.fecha_timbrado = timezone.now()
                        recibo.save()
                        timbrados_count += 1
                    else:
                        # TODO: Manejo de errores granular
                        print(f"Error PAC: {resultado.get('error')}")
                        
                except Exception as e:
                    print(f"Excepción al timbrar recibo {recibo.id}: {str(e)}")
            
            # Actualizar estado de la Nómina
            if timbrados_count == recibos.count() and recibos.count() > 0:
                nomina.estado = 'TIMBRADA'
            elif timbrados_count > 0:
                nomina.estado = 'PARCIAL' # Estado intermedio si fallaron algunos
            
            nomina.save()
            return {"timbrados": timbrados_count, "total": recibos.count()}
