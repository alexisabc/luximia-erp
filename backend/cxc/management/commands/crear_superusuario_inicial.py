# cxc/management/commands/crear_superusuario_inicial.py

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Crea un superusuario inicial si no existe, usando variables de entorno.'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

        if not all([username, email, password]):
            self.stdout.write(self.style.ERROR(
                'Faltan variables de entorno para el superusuario.'))
            return

        if not User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f"Creando superusuario '{username}'..."))
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(
                f"Superusuario '{username}' creado con éxito."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Superusuario '{username}' ya existe. No se realizaron cambios."))
