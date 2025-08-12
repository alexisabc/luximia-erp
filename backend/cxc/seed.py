# backend/cxc/seed.py

import os
import django
from faker import Faker
import random
from datetime import date, timedelta
from django.db import transaction

# Configura Django para que el script pueda acceder a los modelos
# Esto es necesario si ejecutas el script fuera de la shell de Django
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'luximia_erp.settings')
# django.setup()

from cxc.models import (
    ModeloBaseActivo, Moneda, Banco, MetodoPago, Proyecto, Cliente,
    Departamento, Puesto, Empleado, TipoCambio, Vendedor, FormaPago,
    UPE, PlanPago, EsquemaComision, Presupuesto, Contrato, Pago
)

fake = Faker('es_MX')

def clean_db():
    """Borra todos los datos de los modelos de forma segura."""
    print("Borrando datos existentes...")
    models_to_clean = [
        Pago, Contrato, Presupuesto, PlanPago, UPE, FormaPago, Vendedor, 
        TipoCambio, Empleado, Puesto, Departamento, Cliente, Proyecto, 
        MetodoPago, Banco, Moneda
    ]
    for model in reversed(models_to_clean):
        model.objects.all().delete()
    print("Datos borrados exitosamente.")

def create_monedas():
    """Crea monedas de prueba."""
    print("Creando monedas...")
    monedas = [
        Moneda.objects.create(codigo="MXN", nombre="Peso Mexicano"),
        Moneda.objects.create(codigo="USD", nombre="Dólar Estadounidense"),
        Moneda.objects.create(codigo="EUR", nombre="Euro"),
    ]
    return monedas

def create_bancos():
    """Crea bancos de prueba."""
    print("Creando bancos...")
    bancos = [
        Banco.objects.create(clave="002", nombre_corto="BANAMEX", razon_social="Banco Nacional de México S.A."),
        Banco.objects.create(clave="012", nombre_corto="BANCOMER", razon_social="BBVA México S.A."),
        Banco.objects.create(clave="014", nombre_corto="SANTANDER", razon_social="Banco Santander México S.A."),
    ]
    return bancos

def create_metodos_pago():
    """Crea métodos de pago de prueba."""
    print("Creando métodos de pago...")
    metodos = []
    for choice, _ in MetodoPago.METODO_CHOICES:
        metodos.append(MetodoPago.objects.create(nombre=choice))
    return metodos

def create_departamentos_puestos():
    """Crea departamentos y puestos de prueba."""
    print("Creando departamentos y puestos...")
    departamentos = [
        Departamento.objects.create(nombre="Ventas"),
        Departamento.objects.create(nombre="Administración"),
        Departamento.objects.create(nombre="Contabilidad"),
    ]
    puestos = [
        Puesto.objects.create(nombre="Gerente de Ventas", departamento=departamentos[0]),
        Puesto.objects.create(nombre="Ejecutivo de Ventas", departamento=departamentos[0]),
        Puesto.objects.create(nombre="Administrador", departamento=departamentos[1]),
        Puesto.objects.create(nombre="Contador", departamento=departamentos[2]),
    ]
    return departamentos, puestos

def create_tipos_cambio(moneda_usd):
    """Crea tipos de cambio de prueba."""
    print("Creando tipos de cambio...")
    today = date.today()
    escenarios = ["PACTADO", "TOPADO", "BANXICO"]
    tipos_cambio = []
    for i in range(10):
        fecha = today - timedelta(days=i)
        for escenario in escenarios:
            tipos_cambio.append(
                TipoCambio.objects.create(
                    escenario=escenario,
                    fecha=fecha,
                    valor=random.uniform(18.50, 20.50)
                )
            )
    return tipos_cambio

def create_proyectos():
    """Crea proyectos de prueba."""
    print("Creando proyectos...")
    proyectos = []
    for _ in range(5):
        proyectos.append(
            Proyecto.objects.create(
                nombre=f"Proyecto {fake.city()}",
                descripcion=fake.text(),
                numero_upes=random.randint(5, 50),
                niveles=random.randint(1, 10),
                metros_cuadrados=random.uniform(500, 5000),
                numero_estacionamientos=random.randint(10, 100),
                valor_total=random.uniform(1000000, 10000000)
            )
        )
    return proyectos

def create_clientes():
    """Crea clientes de prueba."""
    print("Creando clientes...")
    clientes = []
    for _ in range(20):
        clientes.append(
            Cliente.objects.create(
                nombre_completo=fake.name(),
                email=fake.email(),
                telefono=fake.phone_number()
            )
        )
    return clientes

def create_vendedores():
    """Crea vendedores de prueba."""
    print("Creando vendedores...")
    vendedores = []
    for _ in range(5):
        vendedores.append(
            Vendedor.objects.create(
                tipo=random.choice(["INTERNO", "EXTERNO"]),
                nombre_completo=fake.name(),
                email=fake.email(),
                telefono=fake.phone_number()
            )
        )
    return vendedores

def create_empleados(departamentos, puestos):
    """Crea empleados de prueba."""
    print("Creando empleados...")
    empleados = []
    for i in range(5):
        # Necesitas un usuario existente para el Empleado
        # Aquí asumimos que ya tienes usuarios creados,
        # o que puedes crearlos con 'from django.contrib.auth import get_user_model'
        # y get_user_model().objects.create_user(...)
        # Por ahora, solo usamos la relación OneToOne.
        # Si no tienes usuarios, este paso fallará.
        # Por simplicidad, solo crearemos un objeto Empleado sin usuario real.
        # Si tienes el modelo User definido, cámbialo.
        
        # Ejemplo con un usuario
        # from django.contrib.auth import get_user_model
        # User = get_user_model()
        # user, created = User.objects.get_or_create(username=f"empleado_{i}", email=f"empleado{i}@test.com")

        empleados.append(
            Empleado.objects.create(
                user_id=1, # Reemplaza con un ID de usuario existente
                nombre_completo=fake.name(),
                puesto=random.choice(puestos),
                departamento=random.choice(departamentos)
            )
        )
    return empleados

def create_formas_pago():
    """Crea formas de pago de prueba."""
    print("Creando formas de pago...")
    formas_pago = []
    for _ in range(5):
        formas_pago.append(
            FormaPago.objects.create(
                enganche=random.randint(10, 30),
                mensualidades=random.randint(30, 60),
                meses=random.randint(10, 24),
                contra_entrega=random.randint(10, 30)
            )
        )
    return formas_pago

def create_upes(proyectos, monedas):
    """Crea UPEs de prueba."""
    print("Creando UPEs...")
    upes = []
    for proyecto in proyectos:
        for i in range(proyecto.numero_upes):
            # Obtén solo la clave del choice (el primer elemento de la tupla)
            estado_key = random.choice(UPE.ESTADO_CHOICES)[0]
            upes.append(
                UPE.objects.create(
                    proyecto=proyecto,
                    identificador=f"{proyecto.nombre.replace(' ', '')}-{i+1}",
                    nivel=random.randint(1, proyecto.niveles),
                    metros_cuadrados=random.uniform(50, 200),
                    estacionamientos=random.randint(0, 2),
                    valor_total=random.uniform(500000, 5000000),
                    moneda=random.choice(monedas),
                    estado=estado_key # <-- Usar la clave corregida
                )
            )
    return upes

def create_esquemas_comision():
    """Crea esquemas de comisión de prueba."""
    print("Creando esquemas de comisión...")
    esquemas = []
    esquemas.append(EsquemaComision.objects.create(esquema="RENTA", escenario="NUEVO", porcentaje=10.0))
    esquemas.append(EsquemaComision.objects.create(esquema="VENTA", escenario="PLAN-A", porcentaje=5.5))
    esquemas.append(EsquemaComision.objects.create(esquema="VENTA", escenario="PLAN-B", porcentaje=6.0))
    return esquemas


def run():
    """Función principal para generar todos los datos de prueba."""
    with transaction.atomic():
        clean_db()

        # Dependencias principales
        monedas = create_monedas()
        bancos = create_bancos()
        metodos_pago = create_metodos_pago()
        departamentos, puestos = create_departamentos_puestos()
        moneda_mxn = Moneda.objects.get(codigo="MXN")
        tipos_cambio = create_tipos_cambio(moneda_mxn)
        proyectos = create_proyectos()
        clientes = create_clientes()
        vendedores = create_vendedores()
        empleados = [] # create_empleados(departamentos, puestos) # Descomentar si tienes usuarios
        formas_pago = create_formas_pago()
        upes = create_upes(proyectos, monedas)
        esquemas_comision = create_esquemas_comision()
        
        print("Creando Presupuestos, Contratos y Pagos...")
        for i in range(10):
            # Selecciona registros aleatorios para las FKs
            cliente = random.choice(clientes)
            upe = random.choice(upes)
            moneda = random.choice(monedas)
            tipo_cambio = random.choice(tipos_cambio)
            forma_pago = random.choice(formas_pago)
            vendedor1 = random.choice(vendedores) if vendedores else None
            esquema_comision = random.choice(esquemas_comision)
            metodo_pago = random.choice(metodos_pago)
            
            # Crea un Presupuesto
            presupuesto = Presupuesto.objects.create(
                cliente=cliente,
                upe=upe,
                moneda=moneda,
                tipo_cambio=tipo_cambio,
                forma_pago=forma_pago,
                precio_m2=random.uniform(100, 500),
                precio_lista=upe.valor_total,
                descuento=random.uniform(0, 100000),
                precio_con_descuento=upe.valor_total - random.uniform(0, 100000),
                enganche=random.uniform(50000, 200000),
                saldo=upe.valor_total - random.uniform(50000, 200000),
                vendedor1=vendedor1,
                esquema_comision=esquema_comision,
                metodo_pago=metodo_pago,
                aprobado=random.choice([True, False])
            )
            
            # Crea un Contrato si el Presupuesto está aprobado
            if presupuesto.aprobado:
                contrato = Contrato.objects.create(
                    presupuesto=presupuesto,
                    saldo_presupuesto=presupuesto.saldo,
                    abonado=presupuesto.enganche,
                    fecha_ultimo_abono=date.today(),
                    monto_ultimo_abono=presupuesto.enganche,
                    moneda=presupuesto.moneda,
                    tipo_cambio=presupuesto.tipo_cambio.valor,
                    monto_mxn=presupuesto.enganche * presupuesto.tipo_cambio.valor,
                    saldo=presupuesto.saldo - presupuesto.enganche
                )
                
                # Crea un Pago
                if contrato:
                    Pago.objects.create(
                        contrato=contrato,
                        tipo_pago="PAGO",
                        fecha_pago=date.today(),
                        fecha_ingreso=date.today(),
                        metodo_pago=metodo_pago,
                        monto=random.uniform(1000, 10000),
                        moneda=moneda,
                        tipo_cambio=tipo_cambio,
                        valor_mxn=random.uniform(1000, 10000) * tipo_cambio.valor,
                        banco_destino=random.choice(bancos)
                    )

    print("Generación de datos de prueba finalizada. 🥳")