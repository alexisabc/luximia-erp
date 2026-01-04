import os
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rrhh.models import Empleado, Departamento, Puesto, RazonSocial
from rrhh.models.empleado import EmpleadoDatosLaborales, EmpleadoDocumentacionOficial
from users.models import CustomUser as User
from core.models import Empresa

def seed_employee():
    print("Seeding employee for Sprint 25 verification...")
    
    # 1. Get or create Empresa
    empresa, _ = Empresa.objects.get_or_create(
        rfc="LUX123456789", 
        defaults={"razon_social": "Luximia Constructora S.A. de C.V.", "nombre_comercial": "Luximia"}
    )
    
    # 2. Setup Org structure
    dept, _ = Departamento.objects.get_or_create(nombre="Tecnología", empresa=empresa)
    puesto, _ = Puesto.objects.get_or_create(nombre="Desarrollador Senior", departamento=dept, empresa=empresa)
    razon, _ = RazonSocial.objects.get_or_create(nombre_o_razon_social="Luximia S.A. de C.V.", empresa=empresa)
    
    # 3. Create User
    user, created = User.objects.get_or_create(
        username="juan.perez",
        email="juan.perez@example.com",
        defaults={"first_name": "Juan", "last_name": "Pérez"}
    )
    if created:
        user.set_password("perez123")
        user.save()
    
    # 4. Create Empleado
    empleado, _ = Empleado.objects.get_or_create(
        user=user,
        empresa=empresa,
        defaults={
            "nombres": "Juan",
            "apellido_paterno": "Pérez",
            "puesto": puesto,
            "departamento": dept,
            "razon_social": razon,
            "no_empleado": "EMP-001"
        }
    )
    
    # 5. Setup Official Doc
    EmpleadoDocumentacionOficial.objects.get_or_create(
        empleado=empleado,
        defaults={
            "curp": "PERJ800101HXXXXX01",
            "rfc": "PEHJ800101XXX",
            "nss": "12345678901",
            "tipo_regimen": "Sueldos y Salarios"
        }
    )
    
    # 6. Setup Laboral Data
    EmpleadoDatosLaborales.objects.get_or_create(
        empleado=empleado,
        defaults={
            "salario_diario": Decimal('500.00'),
            "salario_diario_integrado": Decimal('525.00'),
            "tipo_contrato": "Indeterminado",
            "regimen_contratacion": "02 - Sueldos",
            "periodicidad_pago": "04 - Quincenal"
        }
    )
    
    print(f"✅ Empleado {empleado} creado con sueldo diario de $500.00")

if __name__ == "__main__":
    seed_employee()
