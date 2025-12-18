
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "luximia_erp.settings")
django.setup()

from rrhh.models import Empleado

print("--- DB EMPLOYEES ---")
for e in Empleado.objects.all():
    print(f"'{e.nombre_completo}'")
print("--------------------")
