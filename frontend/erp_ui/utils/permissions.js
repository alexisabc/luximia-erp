// utils/permissions.js

const permissionTranslations = {
  // Permisos para Proyecto
  add_proyecto: "Añadir proyecto",
  change_proyecto: "Cambiar proyecto",
  delete_proyecto: "Eliminar proyecto",
  view_proyecto: "Ver proyecto",

  // Permisos para Cliente
  add_cliente: "Añadir cliente",
  change_cliente: "Cambiar cliente",
  delete_cliente: "Eliminar cliente",
  view_cliente: "Ver cliente",

  // Permisos para Empleado
  add_empleado: "Añadir empleado",
  change_empleado: "Cambiar empleado",
  delete_empleado: "Eliminar empleado",
  view_empleado: "Ver empleado",

  // Permisos para UPE
  add_upe: "Añadir UPE",
  change_upe: "Cambiar UPE",
  delete_upe: "Eliminar UPE",
  view_upe: "Ver UPE",

  // Permisos para Contrato
  add_contrato: "Añadir contrato",
  change_contrato: "Cambiar contrato",
  delete_contrato: "Eliminar contrato",
  view_contrato: "Ver contrato",

  // Permisos para Pago
  add_pago: "Añadir pago",
  change_pago: "Cambiar pago",
  delete_pago: "Eliminar pago",
  view_pago: "Ver pago",

  // Permisos para Departamento
  add_departamento: "Añadir departamento",
  change_departamento: "Cambiar departamento",
  delete_departamento: "Eliminar departamento",
  view_departamento: "Ver departamento",

  // Permisos para Puesto
  add_puesto: "Añadir puesto",
  change_puesto: "Cambiar puesto",
  delete_puesto: "Eliminar puesto",
  view_puesto: "Ver puesto",

  // Permisos para Plan de Pagos
  add_planpago: "Añadir plan de pagos", // Corregido: plandepagos -> planpago
  change_planpago: "Cambiar plan de pagos",
  delete_planpago: "Eliminar plan de pagos",
  view_planpago: "Ver plan de pagos",

  // Permisos para Tipo de Cambio
  add_tipocambio: "Añadir tipo de cambio", // Corregido: tipodecambio -> tipocambio
  change_tipocambio: "Cambiar tipo de cambio",
  delete_tipocambio: "Eliminar tipo de cambio",
  view_tipocambio: "Ver tipo de cambio",

  // Permisos para Moneda
  add_moneda: "Añadir moneda",
  change_moneda: "Cambiar moneda",
  delete_moneda: "Eliminar moneda",
  view_moneda: "Ver moneda",

  // Permisos para Banco
  add_banco: "Añadir banco",
  change_banco: "Cambiar banco",
  delete_banco: "Eliminar banco",
  view_banco: "Ver banco",

  // Permisos para Método de Pago
  add_metodopago: "Añadir método de pago",
  change_metodopago: "Cambiar método de pago",
  delete_metodopago: "Eliminar método de pago",
  view_metodopago: "Ver método de pago",

  // Permisos para Vendedor
  add_vendedor: "Añadir vendedor",
  change_vendedor: "Cambiar vendedor",
  delete_vendedor: "Eliminar vendedor",
  view_vendedor: "Ver vendedor",

  // Permisos para Forma de Pago
  add_formapago: "Añadir forma de pago",
  change_formapago: "Cambiar forma de pago",
  delete_formapago: "Eliminar forma de pago",
  view_formapago: "Ver forma de pago",

  // Permisos para Esquema de Comisión
  add_esquemacomision: "Añadir esquema de comisión",
  change_esquemacomision: "Cambiar esquema de comisión",
  delete_esquemacomision: "Eliminar esquema de comisión",
  view_esquemacomision: "Ver esquema de comisión",

  // Permisos para Presupuesto
  add_presupuesto: "Añadir presupuesto",
  change_presupuesto: "Cambiar presupuesto",
  delete_presupuesto: "Eliminar presupuesto",
  view_presupuesto: "Ver presupuesto",

  // Permisos para Usuarios y Grupos (Roles)
  add_customuser: "Añadir usuario",      // <-- Importante: Django usa el nombre del modelo
  change_customuser: "Cambiar usuario",
  delete_customuser: "Eliminar usuario",
  view_customuser: "Ver usuario",
  add_group: "Añadir rol",
  change_group: "Cambiar rol",
  delete_group: "Eliminar rol",
  view_group: "Ver rol",

  // Permisos Extras
  can_view_dashboard: "Ver dashboard",
  can_use_ai: "Usar IA",
  can_view_inactive_records: "Ver registros inactivos",
  can_delete_permanently: "Eliminar permanentemente",
  can_view_auditlog: "Ver auditoría",
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