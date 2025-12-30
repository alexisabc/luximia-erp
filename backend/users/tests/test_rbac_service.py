import pytest
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import CustomUser, Role
from users.services.rbac_service import RBACService

@pytest.mark.django_db
class TestRBACService:
    def setup_method(self):
        # Setup: Usuario y Role
        self.user = CustomUser.objects.create_user(
            username="testuser", 
            email="test@example.com",
            is_active=True
        )
        self.role_admin = Role.objects.create(nombre="Administrador", descripcion="Acceso total")
        self.role_tesorero = Role.objects.create(nombre="Tesorero", descripcion="Manejo de bancos")
        
        # Crear un permiso dummy
        content_type = ContentType.objects.get_for_model(CustomUser)
        self.permission = Permission.objects.create(
            codename="can_do_something",
            name="Can Do Something",
            content_type=content_type,
        )
        self.role_tesorero.permissions.add(self.permission)

    def test_assign_role(self):
        # Asignar rol
        RBACService.assign_role(self.user, "Tesorero")
        
        # Assert: Usuario tiene el rol
        assert self.user.roles.filter(nombre="Tesorero").exists()
        
        # Assert: Usuario tiene el permiso (vía rol)
        # Nota: Dependerá de si implementamos un backend de permisos o sync manual
        assert RBACService.user_has_permission(self.user, "users.can_do_something")

    def test_remove_role(self):
        # Preparar: Asignar role
        RBACService.assign_role(self.user, "Tesorero")
        assert self.user.roles.filter(nombre="Tesorero").exists()
        
        # Remover rol
        RBACService.remove_role(self.user, "Tesorero")
        
        # Assert: Ya no tiene el rol
        assert not self.user.roles.filter(nombre="Tesorero").exists()
        assert not RBACService.user_has_permission(self.user, "users.can_do_something")

    def test_sync_roles_to_django_permissions(self):
        """
        Prueba que los roles se sincronicen con los grupos/permisos nativos de Django
        para compatibilidad con @permission_required y IsAuthenticated.
        """
        RBACService.assign_role(self.user, "Tesorero")
        
        # Django nativo: user.has_perm
        # Para esto necesitamos sincronizar o usar un Backend
        assert self.user.has_perm("users.can_do_something")
