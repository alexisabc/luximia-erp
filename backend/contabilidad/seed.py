# backend/contabilidad/seed.py

import os
import django
from faker import Faker
import random
from datetime import date, timedelta
from django.db import transaction
from django.contrib.auth import get_user_model

# Configura Django para que el script pueda acceder a los modelos
# Esto es necesario si ejecutas el script fuera de la shell de Django
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
# django.setup()

from contabilidad.models import (
    ModeloBaseActivo, Moneda, Banco, MetodoPago, Proyecto, Cliente,
    TipoCambio, Vendedor, FormaPago,
    UPE, PlanPago, EsquemaComision, Presupuesto, Contrato, Pago,
    DocumentEmbedding
)
from rrhh.models import (Departamento, Puesto, Empleado)

fake = Faker('es_MX')

def clean_db():
    """Borra todos los datos de los modelos de forma segura."""
    print("Borrando datos existentes...")
    models_to_clean = [
        Pago, Contrato, Presupuesto, PlanPago, UPE, FormaPago, Vendedor,
        TipoCambio, Empleado, Puesto, Departamento, Cliente, Proyecto,
        MetodoPago, Banco, Moneda, EsquemaComision, DocumentEmbedding
    ]
    # Se itera en orden normal (Hijo -> Padre) para evitar ProtectedError
    for model in models_to_clean:
        print(f"Eliminando {model.__name__}...")
        try:
            model.objects.all().delete()
        except:
             # Fallback manual deletion order if necessary (simplification)
             pass
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
        Banco.objects.create(clave="021", nombre_corto="HSBC", razon_social="HSBC México S.A."),
        Banco.objects.create(clave="044", nombre_corto="SCOTIABANK", razon_social="Scotiabank Inverlat S.A."),
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
        Departamento.objects.create(nombre="Legal"),
    ]
    puestos = [
        Puesto.objects.create(nombre="Gerente de Ventas", departamento=departamentos[0]),
        Puesto.objects.create(nombre="Ejecutivo de Ventas", departamento=departamentos[0]),
        Puesto.objects.create(nombre="Administrador", departamento=departamentos[1]),
        Puesto.objects.create(nombre="Contador", departamento=departamentos[2]),
        Puesto.objects.create(nombre="Abogado", departamento=departamentos[3]),
    ]
    return departamentos, puestos

def create_tipos_cambio():
    """Crea tipos de cambio de prueba para el último año."""
    print("Creando tipos de cambio (365 días)...")
    today = date.today()
    escenarios = ["PACTADO", "TOPADO", "BANXICO"]
    tipos_cambio = []
    
    # Generar histórico de 1 año
    for i in range(365):
        fecha = today - timedelta(days=i)
        base_val = 19.0 + (random.uniform(-1.5, 1.5)) # Variación aleatoria
        for escenario in escenarios:
            # Variación por escenario
            modifier = 0
            if escenario == "TOPADO": modifier = 0.5
            if escenario == "PACTADO": modifier = -0.2
            
            tipos_cambio.append(
                TipoCambio.objects.create(
                    escenario=escenario,
                    fecha=fecha,
                    valor=base_val + modifier + random.uniform(-0.1, 0.1)
                )
            )
    return tipos_cambio

def create_proyectos():
    """Crea proyectos de prueba."""
    print("Creando proyectos...")
    proyectos = []
    tipos_proyecto = ["Residencial", "Corporativo", "Comercial", "Usos Mixtos"]
    for i in range(12): # Más proyectos
        tipo = random.choice(tipos_proyecto)
        nombre = f"{tipo} {fake.city()} {i+1}"
        proyectos.append(
            Proyecto.objects.create(
                nombre=nombre,
                descripcion=fake.text(),
                numero_upes=random.randint(20, 100), # Más UPEs
                niveles=random.randint(5, 30),
                metros_cuadrados=random.uniform(2000, 50000),
                numero_estacionamientos=random.randint(50, 500),
                valor_total=random.uniform(50000000, 500000000)
            )
        )
    return proyectos

def create_clientes():
    """Crea clientes de prueba."""
    print("Creando clientes...")
    clientes = []
    for _ in range(80): # Más clientes
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
    for _ in range(15):
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
    for i in range(10):
        username = f"empleado_{i}_{random.randint(1000,9999)}"
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@test.com", "is_active": True}
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
    configs = [
        (30, 40, 30), (10, 80, 10), (20, 60, 20), (50, 0, 50), (90, 10, 0)
    ]
    for eng, mens, contra in configs:
        formas_pago.append(
            FormaPago.objects.create(
                enganche=eng,
                mensualidades=mens,
                meses=random.randint(12, 36),
                contra_entrega=contra
            )
        )
    return formas_pago

def create_upes(proyectos, monedas):
    """Crea UPEs de prueba."""
    print("Creando UPEs...")
    upes = []
    for proyecto in proyectos:
        for i in range(proyecto.numero_upes):
            estado_key = random.choice(UPE.ESTADO_CHOICES)[0]
            # Peso hacia "DISPONIBLE" o "VENDIDA" para tener variedad
            if random.random() < 0.6: 
                estado_key = "VENDIDA"
            
            upes.append(
                UPE.objects.create(
                    proyecto=proyecto,
                    identificador=f"{proyecto.id}-{proyecto.nombre[:3].upper()}-{i+1:03d}",
                    nivel=random.randint(1, proyecto.niveles),
                    metros_cuadrados=random.uniform(50, 300),
                    estacionamientos=random.randint(1, 3),
                    valor_total=random.uniform(2000000, 15000000),
                    moneda=random.choice(monedas),
                    estado=estado_key
                )
            )
    return upes

def create_esquemas_comision():
    """Crea esquemas de comisión de prueba."""
    print("Creando esquemas de comisión...")
    esquemas = []
    esquemas.append(EsquemaComision.objects.create(esquema="RENTA", escenario="ESTANDAR", porcentaje=10.0))
    esquemas.append(EsquemaComision.objects.create(esquema="VENTA", escenario="PLAN-A (Seniors)", porcentaje=5.5))
    esquemas.append(EsquemaComision.objects.create(esquema="VENTA", escenario="PLAN-B (Juniors)", porcentaje=3.0))
    esquemas.append(EsquemaComision.objects.create(esquema="VENTA", escenario="PLAN-C (Externos)", porcentaje=6.0))
    return esquemas


def create_planes_pago(clientes, upes, formas_pago, monedas):
    """Crea planes de pago de prueba."""
    print("Creando planes de pago...")
    planes = []
    for _ in range(50):
        cliente = random.choice(clientes)
        upe = random.choice(upes)
        moneda = random.choice(monedas)
        forma = random.choice(formas_pago)
        
        planes.append(
            PlanPago.objects.create(
                cliente=cliente,
                upe=upe,
                apartado_monto=random.uniform(5000, 50000),
                moneda_apartado=moneda,
                fecha_apartado=date.today() - timedelta(days=random.randint(0, 100)),
                forma_pago_enganche=forma,
                monto_enganche=upe.valor_total * (forma.enganche / 100),
                moneda_enganche=moneda,
                fecha_enganche=date.today() - timedelta(days=random.randint(0, 60)),
                forma_pago_mensualidades=forma,
                monto_mensualidades=upe.valor_total * (forma.mensualidades / 100),
                moneda_mensualidades=moneda,
                forma_pago_meses=forma,
                meses=forma.meses,
                monto_mensual=(upe.valor_total * (forma.mensualidades / 100)) / forma.meses if forma.meses > 0 else 0,
                moneda_mensual=moneda,
                forma_pago_contra_entrega=forma,
                monto_contra_entrega=upe.valor_total * (forma.contra_entrega / 100),
                moneda_contra_entrega=moneda,
            )
        )
    return planes


def create_document_embeddings():
    """Crea embeddings de documentos de prueba."""
    print("Creando document embeddings...")
    embeddings = []
    for _ in range(10):
        content = fake.paragraph(nb_sentences=5)
        # vector = [random.uniform(-1, 1) for _ in range(1536)]
        # embeddings.append(DocumentEmbedding.objects.create(content=content, embedding=vector))
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
        
        print("Generando transacciones (Presupuestos, Contratos, Pagos)...")
        
        today = date.today()
        # Generar datos dispersos en los últimos 12 meses
        
        # Iterar para crear volumen (350 transacciones)
        for i in range(350):
            cliente = random.choice(clientes)
            # Intentar elegir una UPE que no esté vendida si es posible, o reutilizar (demo)
            upe = random.choice(upes)
            moneda = upe.moneda
            
            # Fecha aleatoria en el último año
            days_ago = random.randint(0, 365)
            trans_date = today - timedelta(days=days_ago)
            
            # Buscar tipo de cambio cercano a la fecha
            # (Simplificación: usar uno aleatorio del mes o el más cercano)
            tc_val = 1.0
            if moneda.codigo != 'MXN':
                # Filtrar TC por fecha exacta o aproximada
                tcs = [tc for tc in tipos_cambio if tc.fecha <= trans_date]
                if tcs:
                    tc_obj = tcs[-1] # El más reciente anterior a la fecha
                else:
                    tc_obj = tipos_cambio[0] # Fallback
            else:
                tc_obj = tipos_cambio[0] # Dummy


            forma_pago = random.choice(formas_pago)
            vendedor1 = random.choice(vendedores)
            esquema_comision = random.choice(esquemas_comision)
            metodo_pago = random.choice(metodos_pago)
            
            valor_upe = float(upe.valor_total)
            descuento = random.uniform(0, valor_upe * 0.1) # Max 10% descuento
            precio_final = valor_upe - descuento
            enganche = precio_final * (forma_pago.enganche / 100.0)
            
            # 1. Crear Presupuesto
            presupuesto = Presupuesto.objects.create(
                cliente=cliente,
                upe=upe,
                moneda=moneda,
                tipo_cambio=tc_obj,
                forma_pago=forma_pago,
                precio_m2=float(upe.valor_total) / float(upe.metros_cuadrados),
                precio_lista=valor_upe,
                descuento=descuento,
                precio_con_descuento=precio_final,
                enganche=enganche,
                saldo=precio_final - enganche,
                vendedor1=vendedor1,
                esquema_comision=esquema_comision,
                metodo_pago=metodo_pago,
                aprobado=True # Mayoría aprobados para generar ventas
            )
            # Ajustar fecha de creación (hack para time-series)
            Presupuesto.objects.filter(id=presupuesto.id).update(fecha=trans_date, creado=trans_date)
            
            # 2. Convertir a Contrato (80% chance)
            if random.random() < 0.8:
                saldo_contrato = precio_final - enganche
                
                contrato = Contrato.objects.create(
                    presupuesto=presupuesto,
                    saldo_presupuesto=presupuesto.saldo,
                    abonado=enganche, # Asumimos que pagó el enganche al firmar
                    fecha_ultimo_abono=trans_date,
                    monto_ultimo_abono=enganche,
                    moneda=moneda,
                    tipo_cambio=tc_obj.valor,
                    monto_mxn=float(enganche) * float(tc_obj.valor),
                    saldo=saldo_contrato
                )
                Contrato.objects.filter(id=contrato.id).update(fecha=trans_date, creado=trans_date)
                
                # 3. Generar Pagos (Historial de pagos posteriores al contrato)
                # Crear pago inicial (enganche)
                Pago.objects.create(
                    contrato=contrato,
                    tipo_pago="APARTADO",
                    fecha_pago=trans_date,
                    fecha_ingreso=trans_date,
                    metodo_pago=metodo_pago,
                    monto=enganche,
                    moneda=moneda,
                    tipo_cambio=tc_obj,
                    valor_mxn=float(enganche) * float(tc_obj.valor),
                    banco_destino=random.choice(bancos)
                )

                # Pagos mensuales aleatorios hasta hoy
                current_saldo = saldo_contrato
                num_pagos_extra = random.randint(0, 12)
                
                last_pay_date = trans_date
                
                for _ in range(num_pagos_extra):
                    if current_saldo <= 0: break
                    
                    next_pay_date = last_pay_date + timedelta(days=30)
                    if next_pay_date > today: break # No pagos futuros en este seed
                    
                    # Monto aleatorio (simulando mensualidad)
                    monto_pago = random.uniform(5000, 50000)
                    if monto_pago > current_saldo: monto_pago = current_saldo
                    
                     # TC a la fecha del pago
                    if moneda.codigo != 'MXN':
                        tcs_p = [tc for tc in tipos_cambio if tc.fecha <= next_pay_date]
                        tc_pago = tcs_p[-1] if tcs_p else tipos_cambio[0]
                    else:
                        tc_pago = tipos_cambio[0]

                    Pago.objects.create(
                        contrato=contrato,
                        tipo_pago="MENSUALIDAD",
                        fecha_pago=next_pay_date,
                        fecha_ingreso=next_pay_date,
                        metodo_pago=random.choice(metodos_pago),
                        monto=monto_pago,
                        moneda=moneda,
                        tipo_cambio=tc_pago,
                        valor_mxn=float(monto_pago) * float(tc_pago.valor),
                        banco_destino=random.choice(bancos)
                    )
                    
                    current_saldo -= monto_pago
                    last_pay_date = next_pay_date
                
                # Actualizar saldo final del contrato
                Contrato.objects.filter(id=contrato.id).update(saldo=current_saldo, abonado=(precio_final - current_saldo))

    print("Generación de datos de prueba MASIVA finalizada. 🚀")
