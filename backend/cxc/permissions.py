# cxc/permissions.py
from rest_framework import permissions


class HasPermissionForAction(permissions.BasePermission):
    """
    Permiso personalizado que comprueba si el usuario tiene el permiso requerido para cada acción.
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
        }

        # Obtiene la acción actual y el permiso requerido
        action = view.action
        permission_type = perm_map.get(action)

        if permission_type:
            model_name = view.queryset.model.__name__.lower()
            permission_codename = (
                f"{view.queryset.model._meta.app_label}.{permission_type}_{model_name}"
            )

            # Si el usuario es superusuario, siempre tiene permiso
            if request.user and request.user.is_superuser:
                return True

            # De lo contrario, comprueba si el usuario tiene el permiso
            return request.user and request.user.has_perm(permission_codename)

        return False


class CanViewAuditLog(permissions.BasePermission):
    """Permiso para acceder al registro de auditoría."""

    def has_permission(self, request, view):
        return request.user and (
            request.user.is_superuser or request.user.has_perm("cxc.can_view_auditlog")
        )
