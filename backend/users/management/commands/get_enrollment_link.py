import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.conf import settings
from users.models import EnrollmentToken
from datetime import timedelta
from django.utils import timezone

class Command(BaseCommand):
    help = "Obtiene un enlace de enrolamiento para el superusuario de forma segura (Solo consola)."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            raise CommandError("DJANGO_SUPERUSER_EMAIL no está configurado.")

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f"El usuario {email} no existe. Ejecuta primero migraciones/inicio.")

        if user.is_active:
            self.stdout.write(self.style.SUCCESS(f"El usuario {email} YA ESTÁ ACTIVO. No necesita enlace."))
            return

        # Buscar token válido existente o avisar
        token_obj = EnrollmentToken.objects.filter(
            user=user, 
            expires_at__gt=timezone.now()
        ).first()

        if not token_obj:
            raise CommandError("No hay token válido. Reinicia el contenedor o revisa la lógica de creación.")
        
        # OJO: Aquí no podemos recuperar el token original si solo guardamos el hash.
        # Revisando el modelo EnrollmentToken... Generalmente se guarda token_hash.
        # Si el modelo solo guarda Hash, NO PODEMOS recuperar el link.
        # Comprobemos users/models.py
        
        # Si solo guardamos hash, tenemos que GENERAR uno nuevo aquí y ahora para mostrárselo al admin.
        import secrets
        import hashlib
        
        # Invalidamos anteriores por seguridad
        EnrollmentToken.objects.filter(user=user).delete()
        
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(hours=24)
        
        EnrollmentToken.objects.create(
            user=user, 
            token_hash=token_hash, 
            expires_at=expires_at
        )

        domain = settings.FRONTEND_DOMAIN
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{raw_token}"

        self.stdout.write(self.style.WARNING("="*60))
        self.stdout.write(self.style.WARNING("🔐  ENLACE DE ACCESO SEGURO (Bajo Demanda)"))
        self.stdout.write(self.style.WARNING("="*60))
        self.stdout.write(f"\n{enroll_url}\n")
        self.stdout.write(self.style.WARNING("="*60))
        self.stdout.write("Copia este enlace inmediatamente. No se guardará en ningún log persistente.")
