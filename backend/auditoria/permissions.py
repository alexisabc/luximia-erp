from rest_framework import permissions


class CanViewAuditLog(permissions.BasePermission):
    """Permiso para acceder al registro de auditoría."""

    def has_permission(self, request, view):
        return request.user and (
            request.user.is_superuser or request.user.has_perm("auditoria.view_auditlog")
        )
