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
  add_plandepagos: "Añadir plan de pagos",
  change_plandepagos: "Cambiar plan de pagos",
  delete_plandepagos: "Eliminar plan de pagos",
  view_plandepagos: "Ver plan de pagos",

  // Permisos para Tipo de Cambio
  add_tipodecambio: "Añadir tipo de cambio",
  change_tipodecambio: "Cambiar tipo de cambio",
  delete_tipodecambio: "Eliminar tipo de cambio",
  view_tipodecambio: "Ver tipo de cambio",

  // Permisos para Usuarios y Grupos (Roles)
  add_user: "Añadir usuario",
  change_user: "Cambiar usuario",
  delete_user: "Eliminar usuario",
  view_user: "Ver usuario",
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
  // La función busca el 'codename' en nuestro diccionario.
  // Si lo encuentra, devuelve la traducción.
  // Si no, devuelve el 'name' original en inglés para no mostrar nada vacío.
  return permissionTranslations[permission.codename] || permission.name;
};

const modelTranslations = {
  proyecto: 'Proyectos',
  cliente: 'Clientes',
  upe: 'UPEs',
  contrato: 'Contratos',
  pago: 'Pagos',
  departamento: 'Departamentos',
  puesto: 'Puestos',
  plandepagos: 'Plan de Pagos',
  tipodecambio: 'Tipos de Cambio',
  user: 'Usuarios',
  group: 'Roles',
};

export const translateModel = (model) => modelTranslations[model] || model;
