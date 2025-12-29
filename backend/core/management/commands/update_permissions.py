from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from django.apps import apps


class Command(BaseCommand):
    help = 'Actualiza las traducciones de permisos al español'

    # Mapeo de permisos estándar de Django
    STANDARD_PERMISSIONS = {
        'add': 'Puede agregar',
        'change': 'Puede modificar',
        'delete': 'Puede eliminar',
        'view': 'Puede ver',
    }

    # Traducciones de modelos por app
    MODEL_TRANSLATIONS = {
        # USERS
        'customuser': 'Usuario',
        'enrollmenttoken': 'Token de Enrolamiento',
        
        # RRHH
        'empleado': 'Empleado',
        'departamento': 'Departamento',
        'puesto': 'Puesto',
        'centrotrabajo': 'Centro de Trabajo',
        'razonsocial': 'Razón Social',
        'empleadodetallepersonal': 'Detalle Personal del Empleado',
        'empleadodocumentacionoficial': 'Documentación Oficial del Empleado',
        'empleadodatoslaborales': 'Datos Laborales del Empleado',
        'empleadonomina bancaria': 'Nómina Bancaria del Empleado',
        'empleadocreditoinfonavit': 'Crédito Infonavit del Empleado',
        'empleadocontactoemergencia': 'Contacto de Emergencia',
        'nominacentralizada': 'Nómina Centralizada',
        'periodonom ina': 'Periodo de Nómina',
        'nomina': 'Nómina',
        'recibonomina': 'Recibo de Nómina',
        'detallereceiptoitem': 'Detalle de Recibo',
        'conceptonomina': 'Concepto de Nómina',
        'tablaisr': 'Tabla ISR',
        'renglontablaisr': 'Renglón Tabla ISR',
        'configuracioneconomica': 'Configuración Económica',
        'subsidioempleo': 'Subsidio al Empleo',
        'renglonsubsidio': 'Renglón Subsidio',
        'buzonimss': 'Buzón IMSS',
        'solicitudvacaciones': 'Solicitud de Vacaciones',
        'solicitudpermiso': 'Solicitud de Permiso',
        'incapacidad': 'Incapacidad',
        'documentoexpediente': 'Documento de Expediente',
        
        # CONTABILIDAD
        'banco': 'Banco',
        'moneda': 'Moneda',
        'metodopago': 'Método de Pago',
        'proyecto': 'Proyecto',
        'cliente': 'Cliente',
        'tipocambio': 'Tipo de Cambio',
        'vendedor': 'Vendedor',
        'formapago': 'Forma de Pago',
        'upe': 'UPE (Unidad Privativa)',
        'planpago': 'Plan de Pago',
        'esquemacomision': 'Esquema de Comisión',
        'presupuesto': 'Presupuesto',
        'contrato': 'Contrato',
        'pago': 'Pago',
        'cuentacontable': 'Cuenta Contable',
        'centrocostos': 'Centro de Costos',
        'poliza': 'Póliza Contable',
        'detallepoliza': 'Detalle de Póliza',
        'factura': 'Factura',
        'plantillaasiento': 'Plantilla de Asiento',
        'reglaasiento': 'Regla de Asiento',
        'certificadodigital': 'Certificado Digital (FIEL)',
        'reportefinanciero': 'Reporte Financiero',
        'buzonmensaje': 'Buzón Tributario',
        'opinioncumplimiento': 'Opinión de Cumplimiento SAT',
        
        # COMPRAS
        'proveedor': 'Proveedor',
        'insumo': 'Insumo',
        'ordencompra': 'Orden de Compra',
        'detalleordencompra': 'Detalle de Orden de Compra',
        
        # TESORERÍA
        'cuentabancaria': 'Cuenta Bancaria',
        'cajachica': 'Caja Chica',
        'movimientocaja': 'Movimiento de Caja',
        'egreso': 'Egreso',
        'planpagoproveedor': 'Plan de Pago a Proveedor',
        
        # JURÍDICO
        'contratojuridico': 'Contrato Jurídico',
        'expediente': 'Expediente Legal',
        
        # SISTEMAS
        'auditlog': 'Registro de Auditoría',
        'configuracionsistema': 'Configuración del Sistema',
        'parametro': 'Parámetro',
        'catalogogeneral': 'Catálogo General',
        
        # CORE
        'empresa': 'Empresa',
        
        # POS
        'terminal': 'Terminal POS',
        'producto': 'Producto',
        'venta': 'Venta',
        'detalleventa': 'Detalle de Venta',
        'turno': 'Turno',
        'cortecaja': 'Corte de Caja',
        
        # IA
        'documentembedding': 'Documento con Embeddings',
        'conversacion': 'Conversación IA',
        
        # NOTIFICATIONS
        'notificacion': 'Notificación',
    }

    # Permisos personalizados con traducciones
    CUSTOM_PERMISSIONS = {
        # Users
        'users.view_dashboard': 'Ver Dashboard',
        'users.view_inactive_records': 'Ver registros inactivos globalmente',
        'users.hard_delete_records': 'Eliminar permanentemente registros',
        'users.view_consolidado': 'Ver reportes consolidados entre empresas',
        'users.use_ai': 'Usar funciones de IA',
        'users.view_inactive_users': 'Ver usuarios inactivos',
        'users.hard_delete_customuser': 'Eliminar permanentemente usuarios',
        
        # RRHH - Nómina
        'rrhh.calcular_nomina': 'Calcular Nómina',
        'rrhh.autorizar_nomina': 'Autorizar Nómina',
        'rrhh.timbrar_nomina': 'Timbrar Recibos de Nómina (CFDI)',
        'rrhh.cancelar_nomina': 'Cancelar Nómina',
        'rrhh.exportar_sua': 'Exportar archivos SUA',
        'rrhh.exportar_idse': 'Exportar archivos IDSE',
        'rrhh.calcular_ptu': 'Calcular PTU',
        'rrhh.calcular_finiquito': 'Calcular Finiquito/Liquidación',
        'rrhh.view_salary_details': 'Ver detalles salariales',
        'rrhh.modify_salary': 'Modificar salarios',
        'rrhh.view_imss_data': 'Ver datos IMSS',
        'rrhh.manage_infonavit': 'Gestionar créditos Infonavit',
        
        # Contabilidad
        'contabilidad.cerrar_periodo': 'Cerrar Periodo Contable',
        'contabilidad.reabrir_periodo': 'Reabrir Periodo Contable',
        'contabilidad.autorizar_poliza': 'Autorizar Pólizas',
        'contabilidad.cancelar_poliza': 'Cancelar Pólizas',
        'contabilidad.generar_xml_sat': 'Generar XML para SAT',
        'contabilidad.timbrar_factura': 'Timbrar Facturas (CFDI)',
        'contabilidad.cancelar_factura': 'Cancelar Facturas',
        'contabilidad.view_reportes_fiscales': 'Ver Reportes Fiscales',
        'contabilidad.export_contabilidad_electronica': 'Exportar Contabilidad Electrónica',
        
        # Compras
        'compras.solicitar_vobo': 'Solicitar VoBo en Órdenes de Compra',
        'compras.dar_vobo': 'Dar VoBo a Órdenes de Compra',
        'compras.autorizar_oc': 'Autorizar Órdenes de Compra',
        'compras.rechazar_oc': 'Rechazar Órdenes de Compra',
        
        # Tesorería
        'tesoreria.autorizar_egreso': 'Autorizar Egresos',
        'tesoreria.realizar_pago': 'Realizar Pagos',
        'tesoreria.conciliar_banco': 'Conciliar Cuentas Bancarias',
        'tesoreria.cerrar_caja': 'Cerrar Caja Chica',
        
        # POS
        'pos.abrir_turno': 'Abrir Turno',
        'pos.cerrar_turno': 'Cerrar Turno',
        'pos.realizar_corte': 'Realizar Corte de Caja',
        'pos.cancelar_venta': 'Cancelar Ventas',
        'pos.aplicar_descuento': 'Aplicar Descuentos',
    }

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Actualizando traducciones de permisos...'))
        
        updated_count = 0
        created_count = 0

        # 1. Actualizar permisos estándar de Django
        for permission in Permission.objects.all():
            content_type = permission.content_type
            model_name = content_type.model.lower()
            
            # Obtener la acción (add, change, delete, view)
            codename_parts = permission.codename.split('_')
            if len(codename_parts) >= 2:
                action = codename_parts[0]
                
                # Traducir el modelo
                model_translation = self.MODEL_TRANSLATIONS.get(model_name, model_name.title())
                
                # Traducir la acción
                action_translation = self.STANDARD_PERMISSIONS.get(action, action.title())
                
                # Construir el nombre traducido
                new_name = f"{action_translation} {model_translation}"
                
                if permission.name != new_name:
                    permission.name = new_name
                    permission.save()
                    updated_count += 1
                    self.stdout.write(f"  ✓ {permission.codename}: {new_name}")

        # 2. Crear/Actualizar permisos personalizados
        for perm_code, perm_name in self.CUSTOM_PERMISSIONS.items():
            app_label, codename = perm_code.split('.')
            
            try:
                # Buscar el ContentType apropiado
                # Para permisos globales, usamos el modelo principal de la app
                model_map = {
                    'users': 'customuser',
                    'rrhh': 'empleado',
                    'contabilidad': 'proyecto',
                    'compras': 'ordencompra',
                    'tesoreria': 'contrarecibo',
                    'pos': 'venta',
                }
                
                model_name = model_map.get(app_label, 'customuser')
                content_type = ContentType.objects.get(app_label=app_label, model=model_name)
                
                permission, created = Permission.objects.get_or_create(
                    codename=codename,
                    content_type=content_type,
                    defaults={'name': perm_name}
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Creado: {perm_code} - {perm_name}"))
                elif permission.name != perm_name:
                    permission.name = perm_name
                    permission.save()
                    updated_count += 1
                    self.stdout.write(f"  ✓ Actualizado: {perm_code} - {perm_name}")
                    
            except ContentType.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  ⚠ No se encontró ContentType para {app_label}.{model_name}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error con {perm_code}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Proceso completado:'))
        self.stdout.write(f'   • {updated_count} permisos actualizados')
        self.stdout.write(f'   • {created_count} permisos personalizados creados')
