"""
Smoke tests para verificar que la infraestructura de testing funciona correctamente.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model


class TestSanity:
    """Tests básicos para verificar que pytest funciona."""
    
    def test_basic_math(self):
        """Verifica que las operaciones matemáticas básicas funcionan."""
        assert 1 + 1 == 2
        assert 2 * 3 == 6
        assert 10 - 5 == 5
    
    def test_string_operations(self):
        """Verifica operaciones con strings."""
        assert "hello".upper() == "HELLO"
        assert "WORLD".lower() == "world"
        assert "test" in "this is a test"


@pytest.mark.django_db
class TestDatabaseConnection:
    """Tests para verificar que la conexión a la base de datos de prueba funciona."""
    
    def test_database_connection(self):
        """Verifica que podemos conectarnos a la base de datos de prueba."""
        User = get_user_model()
        
        # Crear un usuario de prueba
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Verificar que se creó correctamente
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert User.objects.count() == 1
    
    def test_user_creation_and_retrieval(self):
        """Verifica que podemos crear y recuperar usuarios."""
        User = get_user_model()
        
        # Crear usuario
        User.objects.create_user(
            username='john',
            email='john@example.com',
            password='pass123'
        )
        
        # Recuperar usuario
        user = User.objects.get(username='john')
        assert user.email == 'john@example.com'
        # Users are created with is_active=False by default (enrollment flow)
        assert user.is_active is False


class TestDjangoTestCase(TestCase):
    """Tests usando Django TestCase para verificar compatibilidad."""
    
    def test_django_testcase_works(self):
        """Verifica que Django TestCase funciona correctamente."""
        self.assertEqual(1 + 1, 2)
        self.assertTrue(True)
        self.assertFalse(False)
    
    def test_user_model_with_testcase(self):
        """Verifica creación de usuario con Django TestCase."""
        User = get_user_model()
        
        user = User.objects.create_user(
            username='django_test',
            email='django@test.com',
            password='testpass'
        )
        
        self.assertEqual(user.username, 'django_test')
        self.assertTrue(user.check_password('testpass'))
