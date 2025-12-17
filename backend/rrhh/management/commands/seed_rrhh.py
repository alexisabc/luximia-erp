from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from faker import Faker
import random
from datetime import date
from decimal import Decimal

from rrhh.models import (
    Departamento, Puesto, CentroTrabajo, RazonSocial, Empleado,
    EmpleadoDatosLaborales, EmpleadoNominaBancaria,
    Nomina, ReciboNomina, DetalleReciboItem,
    ConceptoNomina, TipoConcepto, TablaISR
)

fake = Faker('es_MX')

class Command(BaseCommand):
    help = "Genera datos de prueba completos para el módulo de RRHH y Nóminas."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando generación de datos de RRHH y Nómina...")
        
        with transaction.atomic():
            self.create_organizacion()
            empleados = self.create_empleados()
            self.create_nomina_demo(empleados)
            
        self.stdout.write(self.style.SUCCESS("¡Datos generados exitosamente!"))

    def create_organizacion(self):
        self.stdout.write("- Creando estructura organizacional...")
        
        # Departamentos
        deptos_data = ["Dirección", "Capital Humano", "Finanzas", "Tecnología", "Operaciones", "Ventas"]
        self.departamentos = {}
        for d in deptos_data:
            obj, _ = Departamento.objects.get_or_create(nombre=d)
            self.departamentos[d] = obj

        # Puestos
        self.puestos_config = {
            "Dirección": ["Director General", "Asistente de Dirección"],
            "Capital Humano": ["Gerente de RH", "Generalista RH", "Analista de Nómina"],
            "Finanzas": ["Director Financiero", "Contador Sr", "Analista Contable"],
            "Tecnología": ["CTO", "Tech Lead", "Fullstack Developer", "QA Engineer"],
            "Operaciones": ["COO", "Supervisor de Obra", "Coordinador de Proyectos"],
            "Ventas": ["Gerente Comercial", "Asesor de Ventas Senior", "Asesor Junior"]
        }

        self.puestos = {}
        for depto_name, puestos_list in self.puestos_config.items():
            depto = self.departamentos[depto_name]
            for p_name in puestos_list:
                puesto, _ = Puesto.objects.get_or_create(nombre=p_name, defaults={"departamento": depto})
                self.puestos[p_name] = puesto

        # Centros de Trabajo y Razones Sociales
        self.centro, _ = CentroTrabajo.objects.get_or_create(
            nombre="Torre Luximia", 
            defaults={"direccion": "Blvd. Kukulcan Km 12, Zona Hotelera, Cancún, Q.R."}
        )
        
        self.razon_social, _ = RazonSocial.objects.get_or_create(
            nombre_o_razon_social="Luximia Developments S.A. de C.V.",
            defaults={"rfc": "LDE150101XYZ"}
        )

    def create_user_and_employee(self, puesto, supervisor=None):
        sexo = random.choice(['M', 'F'])
        nombre = fake.first_name_male() if sexo == 'M' else fake.first_name_female()
        apellido = fake.last_name()
        apellido2 = fake.last_name()
        
        # Usuario normalizado
        username = f"{nombre[:1]}{apellido}{random.randint(10,99)}".lower().replace(" ", "")
        email = f"{username}@luximia.mx"
        
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "first_name": nombre,
                "last_name": f"{apellido} {apellido2}",
                "email": email,
                "is_active": True
            }
        )
        if created:
            user.set_password("luximia123")
            user.save()

        # Empleado
        empleado, created = Empleado.objects.get_or_create(
            user=user,
            defaults={
                "nombres": nombre,
                "apellidos": f"{apellido} {apellido2}",
                "correo_laboral": email,
                "telefono": fake.phone_number(),
                "genero": sexo,
                "fecha_nacimiento": fake.date_of_birth(minimum_age=23, maximum_age=55),
                "puesto": puesto,
                "departamento": puesto.departamento,
                "centro_trabajo": self.centro,
                "razon_social": self.razon_social,
                "supervisor": supervisor
            }
        )
        
        if created:
             # Datos Laborales
            salario_diario = Decimal(random.uniform(400, 3500)).quantize(Decimal("0.01"))
            EmpleadoDatosLaborales.objects.create(
                empleado=empleado,
                fecha_ingreso=fake.date_between(start_date='-4y', end_date='today'),
                tipo_contrato="Tiempo Indeterminado",
                periodicidad_pago="Quincenal",
                jornada="Diurna",
                salario_diario=salario_diario,
                salario_diario_integrado=salario_diario * Decimal("1.0452"),
                ingresos_mensuales_brutos=salario_diario * 30
            )
            
            # Bancarios
            EmpleadoNominaBancaria.objects.create(
                empleado=empleado,
                numero_cuenta=fake.bban(),
                clabe=fake.clabe(),
                tipo_cuenta="Nómina",
                banco=None
            )
        
        return empleado

    def create_empleados(self):
        self.stdout.write("- Creando empleados y asignando jerarquías...")
        
        empleados_creados = []
        
        # 1. Nivel 1: Director General (Root)
        director_general = self.create_user_and_employee(self.puestos["Director General"], supervisor=None)
        empleados_creados.append(director_general)

        # 2. Nivel 2: Directores de Área y Gerentes de Depto (Reportan a DG)
        # Identificar las cabezas de área según el puesto más alto definido en create_organizacion
        
        # Asistente de Dirección -> Director General
        asistente = self.create_user_and_employee(self.puestos["Asistente de Dirección"], supervisor=director_general)
        empleados_creados.append(asistente)

        # Mapa de cabezas de área para asignar sus subordinados
        jefes_de_area = {}

        # Definir quién es el jefe de cada área (Hardcodeado para coincidir con puestos_config)
        jefes_config = {
            "Capital Humano": "Gerente de RH",
            "Finanzas": "Director Financiero",
            "Tecnología": "CTO",
            "Operaciones": "COO",
            "Ventas": "Gerente Comercial"
        }

        for depto, puesto_jefe in jefes_config.items():
            puesto_obj = self.puestos[puesto_jefe]
            jefe = self.create_user_and_employee(puesto_obj, supervisor=director_general)
            jefes_de_area[depto] = jefe
            empleados_creados.append(jefe)

        # 3. Nivel 3 y 4: Subordinados
        # Iterar sobre todos los puestos restantes y asignarlos al jefe de su área
        for depto_name, puestos_list in self.puestos_config.items():
            if depto_name == "Dirección": continue # Ya tratados

            jefe_area = jefes_de_area.get(depto_name)
            
            for p_name in puestos_list:
                # Si es el jefe ya lo creamos, saltar
                if p_name == jefes_config[depto_name]: continue

                puesto_obj = self.puestos[p_name]
                
                # Crear empleados para este puesto (e.g. 2 o 3 Desarrolladores)
                cantidad = 1
                if "Asesor" in p_name or "Developer" in p_name or "Contador" in p_name:
                    cantidad = random.randint(2, 4)
                
                for _ in range(cantidad):
                    # Asignar supervisor: El jefe de área
                    # Opcional: Si es un puesto muy junior, podría reportar a un intermedio creado antes.
                    # Para simplicidad de este seed MVP, reportan al Jefe de Área.
                    
                    subordinado = self.create_user_and_employee(puesto_obj, supervisor=jefe_area)
                    empleados_creados.append(subordinado)

        return empleados_creados

    def create_nomina_demo(self, empleados):
        self.stdout.write("- Generando nómina demo (1ra Qna Enero 2025)...")
        
        # Asegurar conceptos básicos
        p001, _ = ConceptoNomina.objects.get_or_create(
            codigo="P001", defaults={"nombre": "Sueldo", "tipo": TipoConcepto.PERCEPCION, "es_fiscal": True}
        )
        d001, _ = ConceptoNomina.objects.get_or_create(
            codigo="D001", defaults={"nombre": "ISR Retenido", "tipo": TipoConcepto.DEDUCCION, "es_fiscal": True}
        )
        d002, _ = ConceptoNomina.objects.get_or_create(
            codigo="D002", defaults={"nombre": "IMSS", "tipo": TipoConcepto.DEDUCCION, "es_fiscal": True}
        )

        # Crear Nómina
        nomina = Nomina.objects.create(
            descripcion="Nómina Ordinaria 1Q Enero 2025",
            fecha_inicio=date(2025, 1, 1),
            fecha_fin=date(2025, 1, 15),
            fecha_pago=date(2025, 1, 15),
            tipo='ORDINARIA',
            estado='CALCULADA',
            razon_social=self.razon_social
        )

        total_percepciones = Decimal(0)
        total_deducciones = Decimal(0)

        for emp in empleados:
            # Calcular montos dummy
            sd = emp.datos_laborales.salario_diario
            sueldo = sd * 15
            isr = sueldo * Decimal("0.16") # Aprox
            imss = sueldo * Decimal("0.025") # Aprox
            neto = sueldo - isr - imss
            
            # Crear Recibo (solo si no existe para evitar dupes en re-runs parciales)
            if not ReciboNomina.objects.filter(nomina=nomina, empleado=emp).exists():
                recibo = ReciboNomina.objects.create(
                    nomina=nomina,
                    empleado=emp,
                    salario_diario=sd,
                    sbc=emp.datos_laborales.salario_diario_integrado,
                    dias_pagados=Decimal(15),
                    subtotal=sueldo,
                    impuestos_retenidos=isr,
                    imss_retenido=imss,
                    neto=neto
                )

                # Detalles
                DetalleReciboItem.objects.create(
                    recibo=recibo, concepto=p001, nombre_concepto="Sueldo Normal",
                    monto_gravado=sueldo, monto_exento=0, monto_total=sueldo
                )
                DetalleReciboItem.objects.create(
                    recibo=recibo, concepto=d001, nombre_concepto="ISR Retenido",
                    monto_gravado=0, monto_exento=0, monto_total=isr
                )
                DetalleReciboItem.objects.create(
                    recibo=recibo, concepto=d002, nombre_concepto="Cuota IMSS",
                    monto_gravado=0, monto_exento=0, monto_total=imss
                )

                total_percepciones += sueldo
                total_deducciones += (isr + imss)

        # Actualizar totales nómina
        nomina.total_percepciones = total_percepciones
        nomina.total_deducciones = total_deducciones
        nomina.total_neto = total_percepciones - total_deducciones
        nomina.save()
