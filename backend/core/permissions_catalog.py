# core/permissions_catalog.py
"""
Catálogo centralizado de permisos personalizados del sistema ERP.
Todos los permisos están traducidos al español y organizados por módulo.

Uso:
    from core.permissions_catalog import PERMISOS_USUARIOS, PERMISOS_POS, ...
    
    class Meta:
        permissions = PERMISOS_USUARIOS
"""

# =============================================================================
# MÓDULO: USUARIOS Y AUTENTICACIÓN
# =============================================================================
PERMISOS_USUARIOS = [
    # Dashboard y Vistas Generales
    ("view_dashboard", "Ver Panel Principal (Dashboard)"),
    ("view_inactive_records", "Ver registros inactivos en todo el sistema"),
    ("hard_delete_records", "Eliminar permanentemente registros (sin recuperación)"),
    ("view_consolidado", "Ver reportes consolidados multi-empresa"),
    
    # IA y Funciones Avanzadas
    ("use_ai", "Usar asistente de Inteligencia Artificial"),
    ("manage_ai_settings", "Configurar parámetros de IA"),
    
    # Gestión de Usuarios
    ("view_inactive_users", "Ver usuarios inactivos o suspendidos"),
    ("hard_delete_customuser", "Eliminar permanentemente usuarios"),
    ("impersonate_users", "Iniciar sesión como otro usuario (impersonar)"),
    ("manage_user_permissions", "Gestionar permisos de usuarios"),
    ("reset_user_credentials", "Restablecer credenciales de acceso de usuarios"),
    
    # Seguridad
    ("view_audit_logs", "Ver registros de auditoría"),
    ("export_audit_logs", "Exportar registros de auditoría"),
    ("view_security_alerts", "Ver alertas de seguridad"),
    
    # Multi-empresa
    ("access_all_companies", "Acceder a todas las empresas del sistema"),
    ("switch_company_context", "Cambiar contexto de empresa activa"),
]


# =============================================================================
# MÓDULO: PUNTO DE VENTA (POS)
# =============================================================================
PERMISOS_POS = [
    # Operaciones de Caja
    ("open_cash_register", "Abrir turno de caja"),
    ("close_cash_register", "Cerrar turno de caja"),
    ("view_other_shifts", "Ver turnos de otros cajeros"),
    ("modify_closed_shift", "Modificar turnos cerrados"),
    
    # Ventas
    ("create_sale", "Registrar ventas"),
    ("view_all_sales", "Ver ventas de todos los cajeros"),
    ("apply_discount", "Aplicar descuentos a ventas"),
    ("apply_special_discount", "Aplicar descuentos especiales (mayores al límite)"),
    ("sell_on_credit", "Vender a crédito (cuenta corriente)"),
    ("sell_below_cost", "Vender por debajo del costo"),
    
    # Cancelaciones y Devoluciones
    ("request_cancellation", "Solicitar cancelación de ventas"),
    ("authorize_cancellation", "Autorizar cancelaciones de ventas"),
    ("request_refund", "Solicitar devoluciones de productos"),
    ("authorize_refund", "Autorizar devoluciones de productos"),
    ("void_transaction", "Anular transacciones del día"),
    
    # Cuentas de Clientes
    ("manage_customer_credit", "Gestionar crédito de clientes"),
    ("receive_payments", "Recibir abonos de clientes"),
    ("adjust_customer_balance", "Ajustar saldos de clientes"),
    
    # Movimientos de Caja
    ("register_cash_income", "Registrar ingresos de efectivo"),
    ("register_cash_withdrawal", "Registrar retiros de efectivo"),
    ("view_cash_movements", "Ver movimientos de caja"),
    
    # Reportes POS
    ("view_pos_reports", "Ver reportes del punto de venta"),
    ("export_pos_reports", "Exportar reportes del punto de venta"),
    ("view_sales_statistics", "Ver estadísticas de ventas"),
]


# =============================================================================
# MÓDULO: TESORERÍA
# =============================================================================
PERMISOS_TESORERIA = [
    # Bancos
    ("view_bank_balances", "Ver saldos bancarios"),
    ("conciliate_bank", "Conciliar cuentas bancarias"),
    ("register_bank_movement", "Registrar movimientos bancarios"),
    
    # Egresos
    ("create_payment_request", "Solicitar pagos"),
    ("authorize_payment", "Autorizar pagos y egresos"),
    ("execute_payment", "Ejecutar pagos (emitir cheques/transferencias)"),
    ("void_payment", "Anular pagos emitidos"),
    
    # Caja Chica
    ("manage_petty_cash", "Gestionar caja chica"),
    ("close_petty_cash", "Cerrar y reembolsar caja chica"),
    ("approve_petty_cash_expense", "Aprobar gastos de caja chica"),
    
    # Flujo de Efectivo
    ("view_cash_flow", "Ver flujo de efectivo"),
    ("create_cash_projection", "Crear proyecciones de flujo"),
    
    # Reportes
    ("view_treasury_reports", "Ver reportes de tesorería"),
    ("export_treasury_reports", "Exportar reportes de tesorería"),
]


# =============================================================================
# MÓDULO: CONTABILIDAD
# =============================================================================
PERMISOS_CONTABILIDAD = [
    # Catálogo de Cuentas
    ("manage_chart_of_accounts", "Gestionar catálogo de cuentas contables"),
    ("close_accounting_period", "Cerrar períodos contables"),
    
    # Pólizas
    ("create_journal_entry", "Crear pólizas contables"),
    ("post_journal_entry", "Aplicar/Mayorizar pólizas"),
    ("reverse_journal_entry", "Revertir pólizas aplicadas"),
    ("delete_journal_entry", "Eliminar pólizas"),
    
    # Facturación
    ("issue_invoice", "Emitir facturas (CFDI)"),
    ("cancel_invoice", "Cancelar facturas (CFDI)"),
    ("view_fiscal_documents", "Ver documentos fiscales"),
    
    # Tipos de Cambio
    ("manage_exchange_rates", "Gestionar tipos de cambio"),
    
    # Reportes Contables
    ("view_financial_statements", "Ver estados financieros"),
    ("export_financial_reports", "Exportar reportes financieros"),
    ("view_diot", "Ver DIOT"),
    ("generate_diot", "Generar DIOT"),
    
    # IA Contable
    ("use_ai_accounting", "Usar IA para contabilidad"),
]


# =============================================================================
# MÓDULO: COMPRAS
# =============================================================================
PERMISOS_COMPRAS = [
    # Requisiciones
    ("create_requisition", "Crear requisiciones de compra"),
    ("approve_requisition", "Aprobar requisiciones"),
    
    # Órdenes de Compra
    ("create_purchase_order", "Crear órdenes de compra"),
    ("authorize_purchase_order", "Autorizar órdenes de compra"),
    ("cancel_purchase_order", "Cancelar órdenes de compra"),
    
    # Recepción
    ("receive_merchandise", "Recibir mercancía"),
    ("register_partial_receipt", "Registrar recepciones parciales"),
    
    # Proveedores
    ("manage_suppliers", "Gestionar proveedores"),
    ("view_supplier_history", "Ver historial de proveedores"),
    
    # Reportes
    ("view_purchase_reports", "Ver reportes de compras"),
]


# =============================================================================
# MÓDULO: RECURSOS HUMANOS
# =============================================================================
PERMISOS_RRHH = [
    # Empleados
    ("view_employee_data", "Ver datos de empleados"),
    ("manage_employee_data", "Gestionar datos de empleados"),
    ("view_salary_info", "Ver información salarial"),
    ("manage_salary_info", "Gestionar información salarial"),
    
    # Expedientes
    ("view_employee_files", "Ver expedientes de empleados"),
    ("manage_employee_files", "Gestionar expedientes de empleados"),
    
    # Nómina
    ("process_payroll", "Procesar nómina"),
    ("authorize_payroll", "Autorizar dispersión de nómina"),
    ("view_payroll_history", "Ver historial de nóminas"),
    
    # Asistencia
    ("manage_attendance", "Gestionar asistencia"),
    ("approve_absences", "Aprobar ausencias y permisos"),
    
    # IMSS
    ("submit_imss_movements", "Enviar movimientos al IMSS"),
    ("view_imss_history", "Ver historial IMSS"),
    
    # Organigrama
    ("manage_organization_chart", "Gestionar organigrama"),
    
    # Comisiones
    ("manage_commission_schemes", "Gestionar esquemas de comisión"),
    ("calculate_commissions", "Calcular comisiones"),
]


# =============================================================================
# MÓDULO: SISTEMAS / CONFIGURACIÓN
# =============================================================================
PERMISOS_SISTEMAS = [
    # Configuración General
    ("manage_system_settings", "Gestionar configuración del sistema"),
    ("manage_company_settings", "Gestionar datos de la empresa"),
    
    # Catálogos
    ("manage_catalogs", "Gestionar catálogos del sistema"),
    
    # Respaldos
    ("create_backup", "Crear respaldos de base de datos"),
    ("restore_backup", "Restaurar respaldos"),
    
    # Integraciones
    ("manage_integrations", "Gestionar integraciones externas"),
    ("view_api_logs", "Ver registros de API"),
    
    # Notificaciones
    ("manage_notifications", "Gestionar configuración de notificaciones"),
    ("send_bulk_notifications", "Enviar notificaciones masivas"),
]


# =============================================================================
# TODOS LOS PERMISOS (para referencia rápida)
# =============================================================================
TODOS_LOS_PERMISOS = {
    'usuarios': PERMISOS_USUARIOS,
    'pos': PERMISOS_POS,
    'tesoreria': PERMISOS_TESORERIA,
    'contabilidad': PERMISOS_CONTABILIDAD,
    'compras': PERMISOS_COMPRAS,
    'rrhh': PERMISOS_RRHH,
    'sistemas': PERMISOS_SISTEMAS,
}


# =============================================================================
# GRUPOS PREDEFINIDOS (roles típicos)
# =============================================================================
GRUPOS_PREDEFINIDOS = {
    'Cajero': [
        'pos.open_cash_register',
        'pos.close_cash_register',
        'pos.create_sale',
        'pos.apply_discount',
        'pos.request_cancellation',
        'pos.receive_payments',
        'pos.view_cash_movements',
    ],
    'Supervisor POS': [
        'pos.open_cash_register',
        'pos.close_cash_register',
        'pos.create_sale',
        'pos.view_all_sales',
        'pos.view_other_shifts',
        'pos.apply_discount',
        'pos.apply_special_discount',
        'pos.sell_on_credit',
        'pos.request_cancellation',
        'pos.authorize_cancellation',
        'pos.authorize_refund',
        'pos.manage_customer_credit',
        'pos.receive_payments',
        'pos.adjust_customer_balance',
        'pos.register_cash_income',
        'pos.register_cash_withdrawal',
        'pos.view_cash_movements',
        'pos.view_pos_reports',
    ],
    'Contador': [
        'contabilidad.manage_chart_of_accounts',
        'contabilidad.create_journal_entry',
        'contabilidad.post_journal_entry',
        'contabilidad.view_financial_statements',
        'contabilidad.export_financial_reports',
        'contabilidad.view_diot',
        'contabilidad.generate_diot',
        'contabilidad.issue_invoice',
        'contabilidad.view_fiscal_documents',
    ],
    'Tesorero': [
        'tesoreria.view_bank_balances',
        'tesoreria.conciliate_bank',
        'tesoreria.register_bank_movement',
        'tesoreria.create_payment_request',
        'tesoreria.authorize_payment',
        'tesoreria.execute_payment',
        'tesoreria.view_cash_flow',
        'tesoreria.view_treasury_reports',
    ],
    'Recursos Humanos': [
        'rrhh.view_employee_data',
        'rrhh.manage_employee_data',
        'rrhh.view_employee_files',
        'rrhh.manage_employee_files',
        'rrhh.process_payroll',
        'rrhh.view_payroll_history',
        'rrhh.manage_attendance',
        'rrhh.approve_absences',
        'rrhh.submit_imss_movements',
        'rrhh.view_imss_history',
        'rrhh.manage_organization_chart',
    ],
    'Comprador': [
        'compras.create_requisition',
        'compras.create_purchase_order',
        'compras.receive_merchandise',
        'compras.manage_suppliers',
        'compras.view_purchase_reports',
    ],
    'Gerente': [
        # Acceso amplio pero no total
        'usuarios.view_dashboard',
        'usuarios.view_consolidado',
        'pos.view_all_sales',
        'pos.view_pos_reports',
        'pos.view_sales_statistics',
        'tesoreria.view_bank_balances',
        'tesoreria.view_cash_flow',
        'tesoreria.view_treasury_reports',
        'contabilidad.view_financial_statements',
        'rrhh.view_employee_data',
        'compras.view_purchase_reports',
    ],
}


def get_permission_choices():
    """
    Retorna todos los permisos en formato de choices para formularios.
    """
    choices = []
    for module, perms in TODOS_LOS_PERMISOS.items():
        module_choices = [(f"{module}.{code}", label) for code, label in perms]
        choices.extend(module_choices)
    return choices


def get_permissions_by_module():
    """
    Retorna permisos agrupados por módulo para mostrar en UI.
    """
    return {
        'Usuarios y Seguridad': PERMISOS_USUARIOS,
        'Punto de Venta': PERMISOS_POS,
        'Tesorería': PERMISOS_TESORERIA,
        'Contabilidad': PERMISOS_CONTABILIDAD,
        'Compras': PERMISOS_COMPRAS,
        'Recursos Humanos': PERMISOS_RRHH,
        'Sistemas': PERMISOS_SISTEMAS,
    }
