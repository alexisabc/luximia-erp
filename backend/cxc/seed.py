# backend/cxc/seed.py

import os
import django
from faker import Faker
import random
from datetime import date, timedelta
from django.db import transaction
from django.contrib.auth import get_user_model

# Configura Django para que el script pueda acceder a los modelos
# Esto es necesario si ejecutas el script fuera de la shell de Django
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'luximia_erp.settings')
# django.setup()

from cxc.models import (
    ModeloBaseActivo, Moneda, Banco, MetodoPago, Proyecto, Cliente,
    Departamento, Puesto, Empleado, TipoCambio, Vendedor, FormaPago,
    UPE, PlanPago, EsquemaComision, Presupuesto, Contrato, Pago,
    DocumentEmbedding
)

fake = Faker('es_MX')

def clean_db():
    """Borra todos los datos de los modelos de forma segura."""
    print("Borrando datos existentes...")
    models_to_clean = [
        Pago, Contrato, Presupuesto, PlanPago, UPE, FormaPago, Vendedor,
        TipoCambio, Empleado, Puesto, Departamento, Cliente, Proyecto,
        MetodoPago, Banco, Moneda, DocumentEmbedding
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

def create_tipos_cambio():
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
    User = get_user_model()
    for i in range(5):
        user, _ = User.objects.get_or_create(
            username=f"empleado_{i}",
            defaults={"email": f"empleado{i}@test.com", "is_active": True}
        )
        empleados.append(
            Empleado.objects.create(
                user=user,
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


def create_planes_pago(clientes, upes, formas_pago, monedas):
    """Crea planes de pago de prueba."""
    print("Creando planes de pago...")
    planes = []
    for _ in range(10):
        cliente = random.choice(clientes)
        upe = random.choice(upes)
        moneda = random.choice(monedas)
        forma_enganche = random.choice(formas_pago)
        forma_mensualidades = random.choice(formas_pago)
        forma_meses = random.choice(formas_pago)
        forma_contra = random.choice(formas_pago)
        planes.append(
            PlanPago.objects.create(
                cliente=cliente,
                upe=upe,
                apartado_monto=random.uniform(5000, 20000),
                moneda_apartado=moneda,
                fecha_apartado=date.today() - timedelta(days=random.randint(0, 30)),
                forma_pago_enganche=forma_enganche,
                monto_enganche=random.uniform(10000, 50000),
                moneda_enganche=moneda,
                fecha_enganche=date.today() - timedelta(days=random.randint(0, 30)),
                forma_pago_mensualidades=forma_mensualidades,
                monto_mensualidades=random.uniform(50000, 200000),
                moneda_mensualidades=moneda,
                forma_pago_meses=forma_meses,
                meses=random.randint(6, 24),
                monto_mensual=random.uniform(1000, 5000),
                moneda_mensual=moneda,
                forma_pago_contra_entrega=forma_contra,
                monto_contra_entrega=random.uniform(50000, 150000),
                moneda_contra_entrega=moneda,
            )
        )
    return planes


def create_document_embeddings():
    """Crea embeddings de documentos de prueba."""
    print("Creando document embeddings...")
    embeddings = []
    for _ in range(5):
        content = fake.paragraph(nb_sentences=3)
        vector = [random.uniform(-1, 1) for _ in range(1536)]
        embeddings.append(DocumentEmbedding.objects.create(content=content, embedding=vector))
    return embeddings


def run():
    """Función principal para generar todos los datos de prueba."""
    with transaction.atomic():
        clean_db()

        # Dependencias principales
        monedas = create_monedas()
        bancos = create_bancos()
        metodos_pago = create_metodos_pago()
        departamentos, puestos = create_departamentos_puestos()
        tipos_cambio = create_tipos_cambio()
        proyectos = create_proyectos()
        clientes = create_clientes()
        vendedores = create_vendedores()
        empleados = create_empleados(departamentos, puestos)
        formas_pago = create_formas_pago()
        upes = create_upes(proyectos, monedas)
        esquemas_comision = create_esquemas_comision()
        planes_pago = create_planes_pago(clientes, upes, formas_pago, monedas)
        document_embeddings = create_document_embeddings()
        
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
