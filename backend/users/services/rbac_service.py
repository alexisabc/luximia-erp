from django.shortcuts import get_object_or_404
from users.models import CustomUser, Role

class RBACService:
    """
    Servicio para gestión de Roles y Permisos.
    Automatiza la asignación y verificación de acceso.
    """

    @staticmethod
    def assign_role(user, role_name):
        """Asigna un rol a un usuario por nombre."""
        role = get_object_or_404(Role, nombre=role_name)
        user.roles.add(role)
        # Opcionalmente invalidar token para refrescar permisos
        user.update_token_version()
        return role

    @staticmethod
    def remove_role(user, role_name):
        """Remueve un rol de un usuario."""
        role = get_object_or_404(Role, nombre=role_name)
        user.roles.remove(role)
        user.update_token_version()
        return True

    @staticmethod
    def user_has_permission(user, perm_string):
        """
        Verifica si un usuario tiene un permiso específico (vía roles o directo).
        Formato perm_string: 'app_label.codename'
        """
        if not user.is_active:
            return False
        
        if user.is_superuser:
            return True
            
        return user.has_perm(perm_string)

    @staticmethod
    def get_user_roles(user):
        """Retorna la lista de nombres de roles del usuario."""
        return list(user.roles.values_list('nombre', flat=True))
