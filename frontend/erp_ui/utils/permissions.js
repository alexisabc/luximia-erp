// utils/permissions.js

const permissionTranslations = {
  // Permisos para Proyecto
  add_proyecto: "Añadir proyecto",
  change_proyecto: "Editar proyecto",
  delete_proyecto: "Inactivar proyecto",
  view_proyecto: "Ver proyecto",

  // Permisos para Cliente
  add_cliente: "Añadir cliente",
  change_cliente: "Editar cliente",
  delete_cliente: "Inactivar cliente",
  view_cliente: "Ver cliente",

  // Permisos para Empleado
  add_empleado: "Añadir empleado",
  change_empleado: "Editar empleado",
  delete_empleado: "Inactivar empleado",
  view_empleado: "Ver empleado",

  // Permisos para UPE
  add_upe: "Añadir UPE",
  change_upe: "Editar UPE",
  delete_upe: "Inactivar UPE",
  view_upe: "Ver UPE",

  // Permisos para Contrato
  add_contrato: "Añadir contrato",
  change_contrato: "Editar contrato",
  delete_contrato: "Inactivar contrato",
  view_contrato: "Ver contrato",

  // Permisos para Pago
  add_pago: "Registrar pago",
  change_pago: "Editar pago",
  delete_pago: "Cancelar transacción",
  view_pago: "Ver pago",

  // Permisos para Departamento
  add_departamento: "Añadir departamento",
  change_departamento: "Editar departamento",
  delete_departamento: "Inactivar departamento",
  view_departamento: "Ver departamento",

  // Permisos para Puesto
  add_puesto: "Añadir puesto",
  change_puesto: "Editar puesto",
  delete_puesto: "Inactivar puesto",
  view_puesto: "Ver puesto",

  // Permisos para Plan de Pagos
  add_planpago: "Añadir plan de pagos",
  change_planpago: "Editar plan de pagos",
  delete_planpago: "Eliminar plan de pagos",
  view_planpago: "Ver plan de pagos",

  // Permisos para Tipo de Cambio
  add_tipocambio: "Registrar tipo de cambio",
  change_tipocambio: "Editar tipo de cambio",
  delete_tipocambio: "Eliminar tipo de cambio",
  view_tipocambio: "Ver tipo de cambio",

  // Permisos para Moneda
  add_moneda: "Añadir moneda",
  change_moneda: "Editar moneda",
  delete_moneda: "Inactivar moneda",
  view_moneda: "Ver moneda",

  // Permisos para Banco
  add_banco: "Añadir banco",
  change_banco: "Editar banco",
  delete_banco: "Inactivar banco",
  view_banco: "Ver banco",

  // Permisos para Método de Pago
  add_metodopago: "Añadir método de pago",
  change_metodopago: "Editar método de pago",
  delete_metodopago: "Inactivar método de pago",
  view_metodopago: "Ver método de pago",

  // Permisos para Vendedor
  add_vendedor: "Añadir vendedor",
  change_vendedor: "Editar vendedor",
  delete_vendedor: "Inactivar vendedor",
  view_vendedor: "Ver vendedor",

  // Permisos para Forma de Pago
  add_formapago: "Añadir forma de pago",
  change_formapago: "Editar forma de pago",
  delete_formapago: "Inactivar forma de pago",
  view_formapago: "Ver forma de pago",

  // Permisos para Esquema de Comisión
  add_esquemacomision: "Añadir esquema de comisión",
  change_esquemacomision: "Editar esquema de comisión",
  delete_esquemacomision: "Inactivar esquema de comisión",
  view_esquemacomision: "Ver esquema de comisión",

  // Permisos para Presupuesto
  add_presupuesto: "Añadir presupuesto",
  change_presupuesto: "Editar presupuesto",
  delete_presupuesto: "Eliminar presupuesto",
  view_presupuesto: "Ver presupuesto",

  // Permisos para Razon Social
  add_razonsocial: "Añadir razón social",
  change_razonsocial: "Editar razón social",
  delete_razonsocial: "Inactivar razón social",
  view_razonsocial: "Ver razón social",

  // Permisos para Centro Trabajo
  add_centrotrabajo: "Añadir centro de trabajo",
  change_centrotrabajo: "Editar centro de trabajo",
  delete_centrotrabajo: "Inactivar centro de trabajo",
  view_centrotrabajo: "Ver centro de trabajo",

  // Permisos para Proveedor
  add_proveedor: "Añadir proveedor",
  change_proveedor: "Editar proveedor",
  delete_proveedor: "Inactivar proveedor",
  view_proveedor: "Ver proveedor",

  // Permisos para Factura
  add_factura: "Crear factura",
  change_factura: "Editar factura",
  delete_factura: "Cancelar factura", // Facturas usually aren't deleted
  view_factura: "Ver factura",

  // Permisos para Orden de Compra
  add_ordencompra: "Crear orden de compra",
  change_ordencompra: "Editar orden de compra",
  delete_ordencompra: "Cancelar orden de compra",
  view_ordencompra: "Ver orden de compra",

  // Permisos para Insumo
  add_insumo: "Añadir insumo",
  change_insumo: "Editar insumo",
  delete_insumo: "Inactivar insumo",
  view_insumo: "Ver insumo",

  // Permisos para Inventario (ActivoIT)
  add_activoit: "Añadir activo IT",
  change_activoit: "Editar activo IT",
  delete_activoit: "Inactivar activo IT",
  view_activoit: "Ver activo IT",

  // Permisos para Asignación de Equipo
  add_asignacionequipo: "Asignar equipo",
  change_asignacionequipo: "Editar asignación",
  delete_asignacionequipo: "Eliminar asignación",
  view_asignacionequipo: "Ver asignación",

  // Permisos para Turno (POS)
  add_turno: "Abrir turno",
  change_turno: "Cerrar/Editar turno",
  delete_turno: "Eliminar turno", // Rare
  view_turno: "Ver turno",

  // Permisos para Producto (POS)
  add_producto: "Añadir producto",
  change_producto: "Editar producto",
  delete_producto: "Inactivar producto",
  view_producto: "Ver producto",

  // Permisos para Cuenta Cliente (POS)
  add_cuentacliente: "Abrir cuenta POS",
  change_cuentacliente: "Editar cuenta POS",
  delete_cuentacliente: "Cerrar cuenta POS",
  view_cuentacliente: "Ver cuenta POS",

  // Permisos para Empresa
  add_empresa: "Añadir empresa",
  change_empresa: "Editar empresa",
  delete_empresa: "Inactivar empresa",
  view_empresa: "Ver empresa",

  // Permisos para Usuarios y Grupos (Roles)
  add_customuser: "Añadir usuario",
  change_customuser: "Editar usuario",
  delete_customuser: "Inactivar usuario",
  view_customuser: "Ver usuario",
  add_group: "Crear rol",
  change_group: "Editar rol",
  delete_group: "Eliminar rol",
  view_group: "Ver rol",

  // Permisos Extras (CustomUser Meta)
  view_dashboard: "Ver dashboard principal",
  view_consolidado: "Ver reportes consolidados (Multi-empresa)",

  // Permisos Globales (Sistema)
  view_inactive_records: "Ver registros inactivos (Global)",
  hard_delete_records: "Eliminar registros permanentemente (Global)",
  use_ai: "Usar funciones de Inteligencia Artificial",

  // Permisos para Ausencias e Incapacidades (RRHH)
  add_ausencia: "Registrar ausencia",
  change_ausencia: "Editar ausencia",
  delete_ausencia: "Cancelar ausencia",
  view_ausencia: "Ver ausencia",
  add_incapacidad: "Registrar incapacidad",
  change_incapacidad: "Editar incapacidad",
  delete_incapacidad: "Cancelar incapacidad",
  view_incapacidad: "Ver incapacidad",
  add_vacaciones: "Registrar vacaciones",
  change_vacaciones: "Editar vacaciones",
  delete_vacaciones: "Cancelar vacaciones",
  view_vacaciones: "Ver vacaciones",

  // Permisos para Nómina (Configuración y Procesos)
  add_nominacentralizada: "Cargar nómina histórica",
  change_nominacentralizada: "Editar registro nómina",
  delete_nominacentralizada: "Eliminar registro nómina",
  view_nominacentralizada: "Ver nómina histórica",
  add_tablaisr: "Añadir tabla ISR",
  change_tablaisr: "Editar tabla ISR",
  delete_tablaisr: "Eliminar tabla ISR",
  view_tablaisr: "Ver tabla ISR",
  add_subsidioempleo: "Añadir subsidio empleo",
  change_subsidioempleo: "Editar subsidio empleo",
  delete_subsidioempleo: "Eliminar subsidio empleo",
  view_subsidioempleo: "Ver subsidio empleo",

  // Permisos para Notificaciones
  add_notification: "Crear notificación",
  change_notification: "Editar notificación",
  delete_notification: "Eliminar notificación",
  view_notification: "Ver notificación",

  // Permisos para Auditoría
  view_logentry: "Ver bitácora de auditoría",
  delete_logentry: "Depurar bitácora", // Rare permission

  // Permisos para IA (Gestión interna)
  add_promptia: "Crear prompt IA",
  change_promptia: "Editar prompt IA",
  delete_promptia: "Eliminar prompt IA",
  view_promptia: "Ver prompt IA",

  // Permisos para Tesorería (Extras)
  add_cajachica: "Abrir caja chica",
  change_cajachica: "Arqueo/Editar caja",
  delete_cajachica: "Cerrar caja chica",
  view_cajachica: "Ver caja chica",
  add_movimiento: "Registrar movimiento",
  change_movimiento: "Editar movimiento",
  delete_movimiento: "Anular movimiento",
  view_movimiento: "Ver movimiento",

  // Permisos para Contabilidad Financiera
  add_cuentacontable: "Añadir cuenta contable",
  change_cuentacontable: "Editar cuenta contable",
  delete_cuentacontable: "Inactivar cuenta contable",
  view_cuentacontable: "Ver cuenta contable",
  add_centrocostos: "Añadir centro de costos",
  change_centrocostos: "Editar centro de costos",
  delete_centrocostos: "Inactivar centro de costos",
  view_centrocostos: "Ver centro de costos",
  add_poliza: "Crear póliza",
  change_poliza: "Editar póliza",
  delete_poliza: "Anular póliza",
  view_poliza: "Ver póliza",
  add_detallepoliza: "Añadir detalle póliza",
  change_detallepoliza: "Editar detalle póliza",
  delete_detallepoliza: "Eliminar detalle póliza",
  view_detallepoliza: "Ver detalle póliza",
  // Permisos para Cajas (POS)
  add_caja: "Añadir caja",
  change_caja: "Editar caja",
  delete_caja: "Inactivar caja",
  view_caja: "Ver caja",

  // Permisos para Ventas (POS)
  add_venta: "Registrar venta",
  change_venta: "Editar/Corregir venta",
  delete_venta: "Cancelar venta",
  view_venta: "Ver historial de ventas",

  // Permisos para Movimientos Caja (POS)
  add_movimientocaja: "Registrar retiro/ingreso",
  change_movimientocaja: "Editar movimiento caja",
  delete_movimientocaja: "Anular movimiento caja",
  view_movimientocaja: "Ver movimientos de caja",

  // Permisos para Movimientos Saldo Cliente (POS)
  add_movimientosaldocliente: "Ajustar saldo cliente",
  change_movimientosaldocliente: "Editar ajuste saldo",
  delete_movimientosaldocliente: "Anular ajuste saldo",
  view_movimientosaldocliente: "Ver estado de cuenta",

  // Permisos para Detalle Orden Compra
  add_detalleordencompra: "Añadir partida compra",
  change_detalleordencompra: "Editar partida compra",
  delete_detalleordencompra: "Eliminar partida compra",
  view_detalleordencompra: "Ver partida compra",

  // Permisos para Access Logs (Axes/Audit)
  add_accessattempt: "Añadir intento de acceso",
  change_accessattempt: "Editar intento de acceso",
  delete_accessattempt: "Eliminar intento de acceso",
  view_accessattempt: "Ver intento de acceso",

  add_accessfailurelog: "Añadir log de fallo de acceso",
  change_accessfailurelog: "Editar log de fallo de acceso",
  delete_accessfailurelog: "Eliminar log de fallo de acceso",
  view_accessfailurelog: "Ver log de fallo de acceso",

  add_accesslog: "Añadir log de acceso",
  change_accesslog: "Editar log de acceso",
  delete_accesslog: "Eliminar log de acceso",
  view_accesslog: "Ver log de acceso",

  // Knowledgebase
  add_knowledgebase: "Añadir base de conocimiento",
  change_knowledgebase: "Editar base de conocimiento",
  delete_knowledgebase: "Eliminar base de conocimiento",
  view_knowledgebase: "Ver base de conocimiento",

  // POS - Detalle Venta
  add_detalleventa: "Añadir detalle de venta",
  change_detalleventa: "Editar detalle de venta",
  delete_detalleventa: "Eliminar detalle de venta",
  view_detalleventa: "Ver detalle de venta",

  // RRHH - Nómina y Conceptos
  add_conceptonomina: "Añadir concepto de nómina",
  change_conceptonomina: "Editar concepto de nómina",
  delete_conceptonomina: "Inactivar concepto de nómina",
  view_conceptonomina: "Ver concepto de nómina",

  add_configuracioneconomica: "Añadir configuración económica",
  change_configuracioneconomica: "Editar configuración económica",
  delete_configuracioneconomica: "Inactivar configuración económica",
  view_configuracioneconomica: "Ver configuración económica",

  add_detallereciboitem: "Añadir detalle de recibo",
  change_detallereciboitem: "Editar detalle de recibo",
  delete_detallereciboitem: "Eliminar detalle de recibo",
  view_detallereciboitem: "Ver detalle de recibo",

  add_nomina: "Añadir nómina",
  change_nomina: "Editar nómina",
  delete_nomina: "Inactivar nómina",
  view_nomina: "Ver nómina",

  add_periodonomina: "Añadir periodo de nómina",
  change_periodonomina: "Editar periodo de nómina",
  delete_periodonomina: "Inactivar periodo de nómina",
  view_periodonomina: "Ver periodo de nómina",

  add_tablaisr: "Añadir tabla ISR",
  change_tablaisr: "Editar tabla ISR",
  delete_tablaisr: "Inactivar tabla ISR",
  view_tablaisr: "Ver tabla ISR",

  add_tablausr: "Añadir tabla ISR (USR)",
  change_tablausr: "Editar tabla ISR (USR)",
  delete_tablausr: "Inactivar tabla ISR (USR)",
  view_tablausr: "Ver tabla ISR (USR)",

  // RRHH - Nomina Detalles
  add_recibonomina: "Generar recibo de nómina",
  change_recibonomina: "Editar recibo de nómina",
  delete_recibonomina: "Inactivar recibo de nómina",
  view_recibonomina: "Ver recibo de nómina",

  add_renglontablaisr: "Añadir renglón ISR",
  change_renglontablaisr: "Editar renglón ISR",
  delete_renglontablaisr: "Eliminar renglón ISR",
  view_renglontablaisr: "Ver renglón ISR",

  add_renglonsubsidio: "Añadir renglón subsidio",
  change_renglonsubsidio: "Editar renglón subsidio",
  delete_renglonsubsidio: "Eliminar renglón subsidio",
  view_renglonsubsidio: "Ver renglón subsidio",

  // RRHH - Expediente y Empleado
  add_documentoexpediente: "Añadir documento de expediente",
  change_documentoexpediente: "Editar documento de expediente",
  delete_documentoexpediente: "Eliminar documento de expediente",
  view_documentoexpediente: "Ver documento de expediente",

  add_empleadodetallepersonal: "Añadir detalle personal (Empleado)",
  change_empleadodetallepersonal: "Editar detalle personal (Empleado)",
  delete_empleadodetallepersonal: "Eliminar detalle personal (Empleado)",
  view_empleadodetallepersonal: "Ver detalle personal (Empleado)",

  add_empleadodocumentacionoficial: "Añadir documentación oficial",
  change_empleadodocumentacionoficial: "Editar documentación oficial",
  delete_empleadodocumentacionoficial: "Eliminar documentación oficial",
  view_empleadodocumentacionoficial: "Ver documentación oficial",

  add_empleadodatoslaborales: "Añadir datos laborales",
  change_empleadodatoslaborales: "Editar datos laborales",
  delete_empleadodatoslaborales: "Eliminar datos laborales",
  view_empleadodatoslaborales: "Ver datos laborales",

  add_empleadonominabancaria: "Añadir nómina bancaria",
  change_empleadonominabancaria: "Editar nómina bancaria",
  delete_empleadonominabancaria: "Eliminar nómina bancaria",
  view_empleadonominabancaria: "Ver nómina bancaria",

  add_empleadocreditoinfonavit: "Añadir crédito Infonavit",
  change_empleadocreditoinfonavit: "Editar crédito Infonavit",
  delete_empleadocreditoinfonavit: "Eliminar crédito Infonavit",
  view_empleadocreditoinfonavit: "Ver crédito Infonavit",

  add_empleadocontactoemergencia: "Añadir contacto de emergencia",
  change_empleadocontactoemergencia: "Editar contacto de emergencia",
  delete_empleadocontactoemergencia: "Eliminar contacto de emergencia",
  view_empleadocontactoemergencia: "Ver contacto de emergencia",

  add_solicitudpermiso: "Añadir solicitud de permiso",
  change_solicitudpermiso: "Editar solicitud de permiso",
  delete_solicitudpermiso: "Inactivar solicitud de permiso",
  view_solicitudpermiso: "Ver solicitud de permiso",

  add_solicitudvacaciones: "Añadir solicitud de vacaciones",
  change_solicitudvacaciones: "Editar solicitud de vacaciones",
  delete_solicitudvacaciones: "Inactivar solicitud de vacaciones",
  view_solicitudvacaciones: "Ver solicitud de vacaciones",

  // Mapeo explicito "vacaciones" si aplica
  add_vacaciones: "Añadir vacaciones",
  change_vacaciones: "Editar vacaciones",
  delete_vacaciones: "Eliminar vacaciones",
  view_vacaciones: "Ver vacaciones",

  // Tesoreria
  add_contrarecibo: "Añadir contrarecibo",
  change_contrarecibo: "Editar contrarecibo",
  delete_contrarecibo: "Inactivar contrarecibo",
  view_contrarecibo: "Ver contrarecibo",

  add_programacionpago: "Añadir programación de pago",
  change_programacionpago: "Editar programación de pago",
  delete_programacionpago: "Inactivar programación de pago",
  view_programacionpago: "Ver programación de pago",

  add_detalleprogramacion: "Añadir detalle programacion",
  change_detalleprogramacion: "Editar detalle programacion",
  delete_detalleprogramacion: "Eliminar detalle programacion",
  view_detalleprogramacion: "Ver detalle programacion",

  // Sistemas / Inventario
  add_equipo: "Añadir equipo",
  change_equipo: "Editar equipo",
  delete_equipo: "Inactivar equipo",
  view_equipo: "Ver equipo",

  add_equiposm: "Añadir equipo (SM)",
  change_equiposm: "Editar equipo (SM)",
  delete_equiposm: "Inactivar equipo (SM)",
  view_equiposm: "Ver equipo (SM)",

  add_categoriaequipo: "Añadir categoría de equipo",
  change_categoriaequipo: "Editar categoría de equipo",
  delete_categoriaequipo: "Inactivar categoría de equipo",
  view_categoriaequipo: "Ver categoría de equipo",

  add_modeloequipo: "Añadir modelo de equipo",
  change_modeloequipo: "Editar modelo de equipo",
  delete_modeloequipo: "Inactivar modelo de equipo",
  view_modeloequipo: "Ver modelo de equipo",

  add_detalleasignacion: "Añadir detalle de asignación",
  change_detalleasignacion: "Editar detalle de asignación",
  delete_detalleasignacion: "Eliminar detalle de asignación",
  view_detalleasignacion: "Ver detalle de asignación",

  add_movimientoinventario: "Registrar movimiento inventario",
  change_movimientoinventario: "Editar movimiento inventario",
  delete_movimientoinventario: "Eliminar movimiento inventario",
  view_movimientoinventario: "Ver movimiento inventario",

  add_inventario: "Añadir inventario",
  change_inventario: "Editar inventario",
  delete_inventario: "Eliminar inventario",
  view_inventario: "Ver inventario",

  // ===== SISTEMA DE CANCELACIONES Y OPERACIONES SENSIBLES =====
  request_cancellation: "Solicitar cancelación de venta",
  authorize_cancellation: "Autorizar cancelación de venta",
  request_refund: "Solicitar devolución de producto",
  authorize_refund: "Autorizar devolución de producto",
  void_transaction: "Anular transacción del día",

  // ===== PUNTO DE VENTA (EXTENDIDO) =====
  open_cash_register: "Abrir turno de caja",
  close_cash_register: "Cerrar turno de caja",
  view_other_shifts: "Ver turnos de otros cajeros",
  modify_closed_shift: "Modificar turnos cerrados",
  view_all_sales: "Ver ventas de todos los cajeros",
  apply_special_discount: "Aplicar descuentos especiales (sin límite)",
  sell_on_credit: "Vender a crédito (cuenta corriente)",
  sell_below_cost: "Vender por debajo del costo",
  manage_customer_credit: "Gestionar crédito de clientes",
  receive_payments: "Recibir abonos de clientes",
  adjust_customer_balance: "Ajustar saldos de clientes",
  register_cash_income: "Registrar ingresos de efectivo",
  register_cash_withdrawal: "Registrar retiros de efectivo",
  view_pos_reports: "Ver reportes del Punto de Venta",
  export_pos_reports: "Exportar reportes del Punto de Venta",
  view_sales_statistics: "Ver estadísticas de ventas",

  // ===== SEGURIDAD Y AUDITORÍA (EXTENDIDO) =====
  impersonate_users: "Iniciar sesión como otro usuario",
  manage_user_permissions: "Gestionar permisos de usuarios",
  reset_user_credentials: "Restablecer credenciales de acceso",
  view_audit_logs: "Ver registros de auditoría",
  export_audit_logs: "Exportar registros de auditoría",
  view_security_alerts: "Ver alertas de seguridad",
  access_all_companies: "Acceder a todas las empresas",
  switch_company_context: "Cambiar contexto de empresa",
  manage_ai_settings: "Configurar parámetros de IA",

  // ===== TESORERÍA (EXTENDIDO) =====
  view_bank_balances: "Ver saldos bancarios",
  conciliate_bank: "Conciliar cuentas bancarias",
  register_bank_movement: "Registrar movimientos bancarios",
  create_payment_request: "Solicitar pagos/egresos",
  authorize_payment: "Autorizar pagos y egresos",
  execute_payment: "Ejecutar pagos (emisión)",
  void_payment: "Anular pagos emitidos",
  manage_petty_cash: "Gestionar caja chica",
  close_petty_cash: "Cerrar y reembolsar caja chica",
  approve_petty_cash_expense: "Aprobar gastos de caja chica",
  view_cash_flow: "Ver flujo de efectivo",
  create_cash_projection: "Crear proyecciones de flujo",
  view_treasury_reports: "Ver reportes de tesorería",
  export_treasury_reports: "Exportar reportes de tesorería",

  // ===== CONTABILIDAD (EXTENDIDO) =====
  manage_chart_of_accounts: "Gestionar catálogo de cuentas",
  close_accounting_period: "Cerrar períodos contables",
  create_journal_entry: "Crear pólizas contables",
  post_journal_entry: "Aplicar/Mayorizar pólizas",
  reverse_journal_entry: "Revertir pólizas aplicadas",
  issue_invoice: "Emitir facturas (CFDI)",
  cancel_invoice: "Cancelar facturas (CFDI)",
  view_fiscal_documents: "Ver documentos fiscales",
  manage_exchange_rates: "Gestionar tipos de cambio",
  view_financial_statements: "Ver estados financieros",
  export_financial_reports: "Exportar reportes financieros",
  view_diot: "Ver DIOT",
  generate_diot: "Generar DIOT",
  use_ai_accounting: "Usar IA para contabilidad",
};

export const translatePermission = (permission) => {
  // Ahora la función busca el 'codename' dentro del objeto de permiso
  return permissionTranslations[permission.codename] || permission.name;
};

const modelTranslations = {
  proyecto: 'Proyectos',
  cliente: 'Clientes',
  empleado: 'Empleados',
  departamento: 'Departamentos',
  puesto: 'Puestos',
  upe: 'UPEs',
  contrato: 'Contratos',
  pago: 'Pagos',
  moneda: 'Monedas',
  banco: 'Bancos',
  metodopago: 'Métodos de Pago',
  vendedor: 'Vendedores',
  formapago: 'Formas de Pago',
  planpago: 'Plan de Pagos',
  tipocambio: 'Tipos de Cambio',
  esquemacomision: 'Esquemas de Comisión',
  presupuesto: 'Presupuestos',
  customuser: 'Usuarios',
  group: 'Roles',
  razonsocial: 'Razones Sociales',
  centrotrabajo: 'Centros de Trabajo',
  proveedor: 'Proveedores',
  factura: 'Facturas',
  ordencompra: 'Órdenes de Compra',
  insumo: 'Insumos',
  activoit: 'Activos IT (Inventario)',
  asignacionequipo: 'Asignaciones de Equipo',
  // Contabilidad Financiera
  cuentacontable: 'Cuentas Contables (SAT)',
  centrocostos: 'Centros de Costo',
  poliza: 'Pólizas Contables',
  detallepoliza: 'Detalle de Póliza',

  turno: 'Turnos POS',
  producto: 'Productos POS',
  cuentacliente: 'Cuentas Clientes POS',
  empresa: 'Empresas',

  // RRHH & Nómina Adicionales
  ausencia: 'Control de Ausencias',
  vacaciones: 'Solicitudes Vacaciones',
  incapacidad: 'Incapacidades',
  nominacentralizada: 'Histórico de Nómina',
  tablaisr: 'Tablas ISR',
  subsidioempleo: 'Subsidio al Empleo',

  // Soporte
  notification: 'Notificaciones',
  promptia: 'Configuración IA',
  logentry: 'Bitácora de Auditoría',

  // Tesorería Adicional
  cajachica: 'Cajas Chicas',
  movimiento: 'Movimientos Tesorería',

  // POS Adicionales
  caja: 'Cajas POS',
  venta: 'Ventas POS (Tickets)',
  movimientocaja: 'Movimientos de Caja',
  movimientosaldocliente: 'Movimientos Saldo Cliente',

  // Compras Adicionales
  detalleordencompra: 'Partidas Orden de Compra',

  // Access Log
  accessattempt: 'Intentos de Acceso',
  accessfailurelog: 'Fallos de Acceso',
  accesslog: 'Logs de Acceso',
  knowledgebase: 'Base de Conocimiento',

  // POS
  detalleventa: 'Detalles de Venta',

  // RRHH - Nómina y Empleado
  conceptonomina: 'Conceptos de Nómina',
  configuracioneconomica: 'Configuración Económica',
  detallereciboitem: 'Detalles de Recibo',
  recibonomina: 'Recibos de Nómina',
  renglontablaisr: 'Renglones Tabla ISR',
  renglonsubsidio: 'Renglones Subsidio',
  documentoexpediente: 'Documentos de Expediente',
  empleadocontactoemergencia: 'Contactos de Emergencia',
  empleadodetallepersonal: 'Detalles Personales (Empleado)',
  empleadodocumentacionoficial: 'Documentación Oficial (Empleado)',
  empleadodatoslaborales: 'Datos Laborales',
  empleadonominabancaria: 'Datos Bancarios (Nómina)',
  empleadocreditoinfonavit: 'Créditos Infonavit',
  nomina: 'Nóminas',
  periodonomina: 'Periodos de Nómina',
  // tablaisr ya existe arriba line 345, pero la sobreescribimos o dejamos si el user quiere "tablausr" tambien
  tablausr: 'Tablas ISR (USR)',
  solicitudpermiso: 'Solicitudes de Permiso',
  solicitudvacaciones: 'Solicitudes de Vacaciones', // Matches vacations
  vacaciones: 'Vacaciones', // explicit match

  // Tesoreria
  contrarecibo: 'Contrarecibos',
  programacionpago: 'Programación de Pagos',
  detalleprogramacion: 'Detalles de Programación',

  // Sistemas / Inventario
  equipo: 'Equipos',
  equiposm: 'Equipos (SM)',
  categoriaequipo: 'Categorías de Equipo',
  modeloequipo: 'Modelos de Equipo',
  detalleasignacion: 'Detalles de Asignación',
  movimientoinventario: 'Movimientos de Inventario',
  inventario: 'Inventario',

  // Grupos especiales virtuales
  metasistema: 'Permisos del Sistema',
  ia: 'Inteligencia Artificial',
  solicitudcancelacion: 'Solicitudes de Cancelación',
};

export const translateModel = (model) => modelTranslations[model] || model;

// Modelos internos que no deben mostrarse en la interfaz
export const EXCLUDED_MODELS = [
  'logentry',
  'permission',
  'contenttype',
  'blacklistedtoken',
  'outstandingtoken',
  'enrollmenttoken',
  'session'
];

// Verifica si un permiso es visible para el usuario final
export const shouldDisplayPermission = (permission) => {
  const model = permission['content_type__model'];
  const codenameModel = permission.codename?.split('_').pop();
  return (
    !EXCLUDED_MODELS.includes(model) &&
    !EXCLUDED_MODELS.includes(codenameModel)
  );
};