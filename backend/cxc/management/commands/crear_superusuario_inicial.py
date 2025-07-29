# backend/cxc/management/commands/crear_superusuario_inicial.py

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission


class Command(BaseCommand):
    help = 'Crea o actualiza un superusuario inicial usando variables de entorno.'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

        if not all([username, password]):
            self.stdout.write(self.style.ERROR(
                'Faltan DJANGO_SUPERUSER_USERNAME o DJANGO_SUPERUSER_PASSWORD.'))
            return

        # Busca o crea el usuario
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            }
        )

        # Siempre establece la contraseña para asegurar que sea la correcta
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(
                f"Superusuario '{username}' creado con éxito."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Superusuario '{username}' actualizado con la contraseña del entorno."))

        # Crear o actualizar el grupo Administradores con todos los permisos
        admin_group, _ = Group.objects.get_or_create(name="Administradores")
        all_permissions = Permission.objects.all()
        admin_group.permissions.set(all_permissions)
        admin_group.save()

        # Asignar el grupo al superusuario
        user.groups.add(admin_group)
        user.save()

        self.stdout.write(self.style.SUCCESS(
            "Grupo 'Administradores' asegurado y asignado al superusuario."))
