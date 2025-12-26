import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
null_pass_users = User.objects.filter(password__isnull=True)
count = null_pass_users.count()
print(f"Encontrados {count} usuarios con password NULL.")

if count > 0:
    for user in null_pass_users:
        user.set_unusable_password()
        user.save()
    print("Passwords corregidos a 'unusable'.")
else:
    print("No se requieren correcciones.")
