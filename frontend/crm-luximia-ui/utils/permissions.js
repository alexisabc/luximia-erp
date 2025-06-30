// utils/permissions.js

const permissionTranslations = {
    // Permisos para Proyecto
    'add_proyecto': 'Añadir proyecto',
    'change_proyecto': 'Cambiar proyecto',
    'delete_proyecto': 'Eliminar proyecto',
    'view_proyecto': 'Ver proyecto',

    // Permisos para Cliente
    'add_cliente': 'Añadir cliente',
    'change_cliente': 'Cambiar cliente',
    'delete_cliente': 'Eliminar cliente',
    'view_cliente': 'Ver cliente',

    // Permisos para UPE
    'add_upe': 'Añadir UPE',
    'change_upe': 'Cambiar UPE',
    'delete_upe': 'Eliminar UPE',
    'view_upe': 'Ver UPE',

    // Permisos para Contrato
    'add_contrato': 'Añadir contrato',
    'change_contrato': 'Cambiar contrato',
    'delete_contrato': 'Eliminar contrato',
    'view_contrato': 'Ver contrato',

    // Permisos para Pago
    'add_pago': 'Añadir pago',
    'change_pago': 'Cambiar pago',
    'delete_pago': 'Eliminar pago',
    'view_pago': 'Ver pago',

    // Permisos para Usuarios y Grupos (Roles)
    'add_user': 'Añadir usuario',
    'change_user': 'Cambiar usuario',
    'delete_user': 'Eliminar usuario',
    'view_user': 'Ver usuario',
    'add_group': 'Añadir rol',
    'change_group': 'Cambiar rol',
    'delete_group': 'Eliminar rol',
    'view_group': 'Ver rol',
};

export const translatePermission = (permission) => {
    // La función busca el 'codename' en nuestro diccionario.
    // Si lo encuentra, devuelve la traducción.
    // Si no, devuelve el 'name' original en inglés para no mostrar nada vacío.
    return permissionTranslations[permission.codename] || permission.name;
  };