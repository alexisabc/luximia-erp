from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import TestCase
import os


class CrearSuperusuarioInicialTests(TestCase):
    def setUp(self):
        os.environ['DJANGO_SUPERUSER_USERNAME'] = 'admin'
        os.environ['DJANGO_SUPERUSER_EMAIL'] = 'admin@example.com'
        os.environ['DJANGO_SUPERUSER_PASSWORD'] = 'password123'

    def tearDown(self):
        del os.environ['DJANGO_SUPERUSER_USERNAME']
        del os.environ['DJANGO_SUPERUSER_EMAIL']
        del os.environ['DJANGO_SUPERUSER_PASSWORD']

    def test_superusuario_y_grupo_creados_con_permisos(self):
        call_command('crear_superusuario_inicial')
        User = get_user_model()
        user = User.objects.get(username='admin')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.check_password('password123'))
        admin_group = Group.objects.get(name='Administradores')
        self.assertTrue(user.groups.filter(name='Administradores').exists())
        self.assertEqual(admin_group.permissions.count(), Permission.objects.count())
