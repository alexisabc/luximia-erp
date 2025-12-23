from rest_framework import permissions

class HasPermissionForAction(permissions.BasePermission):
    """
    Permiso global que mapea automáticamente acciones de DRF a permisos de Django.
    
    Ejemplo:
    - GET /api/clientes/ (list) -> Requiere 'app.view_cliente'
    - POST /api/clientes/ (create) -> Requiere 'app.add_cliente'
    - DELETE /api/clientes/1/ (destroy) -> Requiere 'app.delete_cliente'
    """

    def has_permission(self, request, view):
        # Mapea las acciones de DRF a los nombres de permisos de Django
        perm_map = {
            "list": "view",
            "retrieve": "view",
            "create": "add",
            "update": "change",
            "partial_update": "change",
            "destroy": "delete",
            
            # Acciones personalizadas comunes
            "inactivos": "view",
            "hard_destroy": "delete",
            "restore": "delete", # Restaurar suele requerir privilegios de borrado/gestión
            "exportar_plantilla": "view",
            "importar_excel": "add",
        }

        # Obtiene la acción actual y el permiso requerido
        action = getattr(view, 'action', None)
        if not action:
            return True # Si no hay acción (ej. APIView simple), dejar pasar a otros permisos

        permission_type = perm_map.get(action)

        if permission_type:
            # Deducir el nombre del modelo
            try:
                model_cls = view.queryset.model
                app_label = model_cls._meta.app_label
                model_name = model_cls.__name__.lower()
                
                permission_codename = f"{app_label}.{permission_type}_{model_name}"

                # Si el usuario es superusuario, siempre tiene permiso
                if request.user and request.user.is_superuser:
                    return True

                # De lo contrario, comprueba si el usuario tiene el permiso
                return request.user and request.user.has_perm(permission_codename)
                
            except AttributeError:
                # Si la vista no tiene queryset o modelo definido,
                # este permiso no puede actuar automáticamente.
                return False

        return False
