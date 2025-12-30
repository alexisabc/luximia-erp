from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import Permission
from .models import CustomUser

class RolePermissionBackend(ModelBackend):
    """
    Backend de autenticación que permite a Django reconocer los permisos 
    asignados a través de Roles personalizados.
    """
    def get_user_permissions(self, user_obj, obj=None):
        if not user_obj.is_active or user_obj.is_anonymous or obj is not None:
            return set()

        # Obtener todos los permisos de todos los roles asignados
        perms = Permission.objects.filter(
            roles__users=user_obj
        ).values_list('content_type__app_label', 'codename').distinct()
        
        return {f"{app_label}.{codename}" for app_label, codename in perms}

    def get_all_permissions(self, user_obj, obj=None):
        if not user_obj.is_active or user_obj.is_anonymous or obj is not None:
            return set()

        # Combinar permisos nativos de Django con permisos de Roles
        return super().get_all_permissions(user_obj, obj) | self.get_user_permissions(user_obj, obj)

    def has_perm(self, user_obj, perm, obj=None):
        if not user_obj.is_active or user_obj.is_anonymous:
            return False
        
        # Superusuario tiene todo
        if user_obj.is_superuser:
            return True
            
        return perm in self.get_all_permissions(user_obj, obj)
