#!/usr/bin/env python
"""
Script: seed_demo_data.py
Descripción: Genera datos de demostración realistas para el Sistema ERP
Uso: python seed_demo_data.py
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from random import randint, choice

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Empresa
from contabilidad.models import Cliente, Moneda, Banco, MetodoPago, FormaPago
from tesoreria.models import CuentaBancaria, Egreso
from rrhh.models import Empleado, Departamento, Puesto
from pos.models import Producto, Categoria

User = get_user_model()

def create_empresa():
    """Crea la empresa principal de demostración"""
    print("📊 Creando empresa...")
    
    empresa, created = Empresa.objects.get_or_create(
        codigo="SISTEMA_ERP",
        defaults={
            'razon_social': 'Sistema ERP Desarrollos S.A. de C.V.',
            'nombre_comercial': 'Sistema ERP',
            'rfc': 'LDE850101ABC',
            'regimen_fiscal': '601',
            'codigo_postal': '64000',
        }
    )
    
    if created:
        print(f"  ✅ Empresa creada: {empresa.razon_social}")
    else:
        print(f"  ℹ️  Empresa ya existe: {empresa.razon_social}")
    
    return empresa

def create_monedas():
    """Crea monedas básicas"""
    print("\n💰 Creando monedas...")
    
    monedas_data = [
        {'codigo': 'MXN', 'nombre_corto': 'Peso Mexicano', 'descripcion': 'Peso Mexicano'},
        {'codigo': 'USD', 'nombre_corto': 'Dólar Americano', 'descripcion': 'Dólar de Estados Unidos'},
        {'codigo': 'EUR', 'nombre_corto': 'Euro', 'descripcion': 'Euro'},
    ]
    
    for data in monedas_data:
        moneda, created = Moneda.objects.get_or_create(
            codigo=data['codigo'],
            defaults=data
        )
        if created:
            print(f"  ✅ Moneda creada: {moneda.codigo}")

def create_bancos():
    """Crea bancos y cuentas bancarias"""
    print("\n🏦 Creando bancos y cuentas...")
    
    empresa = Empresa.objects.get(codigo="SISTEMA_ERP")
    mxn = Moneda.objects.get(codigo='MXN')
    
    banco, _ = Banco.objects.get_or_create(
        nombre_corto="BBVA",
        defaults={'razon_social': 'BBVA Bancomer S.A.'}
    )
    
    cuenta, created = CuentaBancaria.objects.get_or_create(
        empresa=empresa,
        banco=banco,
        numero_cuenta="0123456789",
        defaults={
            'clabe': '012345678901234567',
            'moneda': mxn,
            'saldo_actual': Decimal('500000.00'),
            'alias': 'Cuenta Principal BBVA'
        }
    )
    
    if created:
        print(f"  ✅ Cuenta bancaria creada: {cuenta.alias}")

def create_departamentos_y_puestos(empresa):
    """Crea departamentos y puestos"""
    print("\n🏢 Creando departamentos y puestos...")
    
    departamentos_data = [
        {'nombre': 'Dirección General', 'puestos': ['Director General', 'Asistente de Dirección']},
        {'nombre': 'Ventas', 'puestos': ['Gerente de Ventas', 'Asesor de Ventas', 'Coordinador de Ventas']},
        {'nombre': 'Construcción', 'puestos': ['Gerente de Obra', 'Ingeniero Residente', 'Maestro de Obra']},
        {'nombre': 'Administración', 'puestos': ['Contador', 'Auxiliar Contable', 'Tesorero']},
        {'nombre': 'Recursos Humanos', 'puestos': ['Gerente de RRHH', 'Reclutador']},
    ]
    
    for dept_data in departamentos_data:
        dept, created = Departamento.objects.get_or_create(
            empresa=empresa,
            nombre=dept_data['nombre'],
            defaults={'descripcion': f'Departamento de {dept_data["nombre"]}'}
        )
        
        if created:
            print(f"  ✅ Departamento creado: {dept.nombre}")
        
        for puesto_nombre in dept_data['puestos']:
            puesto, created = Puesto.objects.get_or_create(
                empresa=empresa,
                nombre=puesto_nombre,
                defaults={
                    'departamento': dept,
                    'descripcion': f'Puesto de {puesto_nombre}',
                    'salario_base': Decimal(randint(15000, 50000))
                }
            )
            if created:
                print(f"    ✅ Puesto creado: {puesto.nombre}")

def create_empleados(empresa):
    """Crea empleados de demostración"""
    print("\n👥 Creando empleados...")
    
    empleados_data = [
        {
            'nombre': 'Carlos',
            'apellido_paterno': 'Rodríguez',
            'apellido_materno': 'García',
            'puesto': 'Director General',
            'email': 'carlos.rodriguez@sistemaerp.com',
            'telefono': '8112345678',
        },
        {
            'nombre': 'María',
            'apellido_paterno': 'Hernández',
            'apellido_materno': 'López',
            'puesto': 'Gerente de Ventas',
            'email': 'maria.hernandez@sistemaerp.com',
            'telefono': '8112345679',
        },
        {
            'nombre': 'José',
            'apellido_paterno': 'Martínez',
            'apellido_materno': 'Sánchez',
            'puesto': 'Gerente de Obra',
            'email': 'jose.martinez@sistemaerp.com',
            'telefono': '8112345680',
        },
        {
            'nombre': 'Ana',
            'apellido_paterno': 'González',
            'apellido_materno': 'Ramírez',
            'puesto': 'Contador',
            'email': 'ana.gonzalez@sistemaerp.com',
            'telefono': '8112345681',
        },
        {
            'nombre': 'Luis',
            'apellido_paterno': 'Pérez',
            'apellido_materno': 'Torres',
            'puesto': 'Asesor de Ventas',
            'email': 'luis.perez@sistemaerp.com',
            'telefono': '8112345682',
        },
    ]
    
    for emp_data in empleados_data:
        puesto = Puesto.objects.filter(empresa=empresa, nombre=emp_data['puesto']).first()
        
        if puesto:
            empleado, created = Empleado.objects.get_or_create(
                empresa=empresa,
                email=emp_data['email'],
                defaults={
                    'nombre': emp_data['nombre'],
                    'apellido_paterno': emp_data['apellido_paterno'],
                    'apellido_materno': emp_data['apellido_materno'],
                    'puesto': puesto,
                    'telefono': emp_data['telefono'],
                    'rfc': f"{emp_data['apellido_paterno'][:2]}{emp_data['apellido_materno'][0]}{emp_data['nombre'][:2]}850101ABC",
                    'nss': f"{randint(10000000, 99999999)}{randint(10, 99)}",
                    'curp': f"{emp_data['apellido_paterno'][:2]}{emp_data['apellido_materno'][0]}{emp_data['nombre'][:2]}850101HNLXXX00",
                    'fecha_ingreso': datetime.now().date() - timedelta(days=randint(30, 1000)),
                    'salario_diario': puesto.salario_base / 30,
                    'foto': f'https://i.pravatar.cc/300?u={emp_data["email"]}',
                }
            )
            
            if created:
                print(f"  ✅ Empleado creado: {empleado.nombre_completo}")

def create_clientes(empresa):
    """Crea clientes de demostración"""
    print("\n👤 Creando clientes...")
    
    clientes_data = [
        {'nombre': 'Roberto Garza Martínez', 'rfc': 'GAMR850101ABC', 'email': 'roberto.garza@email.com'},
        {'nombre': 'Patricia Ruiz Hernández', 'rfc': 'RUHP900215XYZ', 'email': 'patricia.ruiz@email.com'},
        {'nombre': 'Fernando López Castro', 'rfc': 'LOCF880330DEF', 'email': 'fernando.lopez@email.com'},
        {'nombre': 'Gabriela Sánchez Díaz', 'rfc': 'SADG920512GHI', 'email': 'gabriela.sanchez@email.com'},
        {'nombre': 'Constructora del Norte S.A.', 'rfc': 'CDN850101ABC', 'email': 'contacto@constructoradelnorte.com'},
    ]
    
    for cliente_data in clientes_data:
        cliente, created = Cliente.objects.get_or_create(
            empresa=empresa,
            rfc=cliente_data['rfc'],
            defaults={
                'nombre': cliente_data['nombre'],
                'email': cliente_data['email'],
                'telefono': f"81{randint(10000000, 99999999)}",
            }
        )
        
        if created:
            print(f"  ✅ Cliente creado: {cliente.nombre}")

def create_productos():
    """Crea productos para POS"""
    print("\n🛒 Creando productos de ferretería...")
    
    # Crear categorías
    categorias_data = [
        'Herramientas',
        'Material Eléctrico',
        'Plomería',
        'Pintura',
        'Construcción',
    ]
    
    categorias = {}
    for cat_nombre in categorias_data:
        cat, created = Categoria.objects.get_or_create(
            nombre=cat_nombre,
            defaults={'descripcion': f'Productos de {cat_nombre}'}
        )
        categorias[cat_nombre] = cat
        if created:
            print(f"  ✅ Categoría creada: {cat.nombre}")
    
    # Crear productos
    productos_data = [
        {'nombre': 'Martillo de Garra 16oz', 'categoria': 'Herramientas', 'precio': 250.00, 'stock': 25},
        {'nombre': 'Destornillador Phillips #2', 'categoria': 'Herramientas', 'precio': 45.00, 'stock': 50},
        {'nombre': 'Taladro Inalámbrico 18V', 'categoria': 'Herramientas', 'precio': 1850.00, 'stock': 8},
        {'nombre': 'Cable THW Cal. 12', 'categoria': 'Material Eléctrico', 'precio': 12.50, 'stock': 500},
        {'nombre': 'Apagador Sencillo', 'categoria': 'Material Eléctrico', 'precio': 25.00, 'stock': 100},
        {'nombre': 'Foco LED 9W', 'categoria': 'Material Eléctrico', 'precio': 45.00, 'stock': 150},
        {'nombre': 'Tubo PVC 1/2" x 3m', 'categoria': 'Plomería', 'precio': 35.00, 'stock': 75},
        {'nombre': 'Codo PVC 1/2"', 'categoria': 'Plomería', 'precio': 5.00, 'stock': 200},
        {'nombre': 'Llave de Paso 1/2"', 'categoria': 'Plomería', 'precio': 85.00, 'stock': 30},
        {'nombre': 'Pintura Vinílica Blanca 4L', 'categoria': 'Pintura', 'precio': 320.00, 'stock': 40},
        {'nombre': 'Brocha 3"', 'categoria': 'Pintura', 'precio': 45.00, 'stock': 60},
        {'nombre': 'Rodillo 9"', 'categoria': 'Pintura', 'precio': 55.00, 'stock': 45},
        {'nombre': 'Cemento Gris 50kg', 'categoria': 'Construcción', 'precio': 185.00, 'stock': 120},
        {'nombre': 'Arena de Río m³', 'categoria': 'Construcción', 'precio': 350.00, 'stock': 15},
        {'nombre': 'Grava 3/4" m³', 'categoria': 'Construcción', 'precio': 380.00, 'stock': 12},
        {'nombre': 'Block 15x20x40', 'categoria': 'Construcción', 'precio': 12.00, 'stock': 500},
        {'nombre': 'Varilla 3/8" x 6m', 'categoria': 'Construcción', 'precio': 95.00, 'stock': 80},
        {'nombre': 'Alambre Recocido kg', 'categoria': 'Construcción', 'precio': 22.00, 'stock': 150},
        {'nombre': 'Clavos 2.5" kg', 'categoria': 'Construcción', 'precio': 28.00, 'stock': 100},
        {'nombre': 'Tornillos 1" caja', 'categoria': 'Construcción', 'precio': 65.00, 'stock': 75},
    ]
    
    for prod_data in productos_data:
        categoria = categorias[prod_data['categoria']]
        
        producto, created = Producto.objects.get_or_create(
            nombre=prod_data['nombre'],
            defaults={
                'categoria': categoria,
                'precio': Decimal(str(prod_data['precio'])),
                'stock': prod_data['stock'],
                'codigo_barras': f"{randint(1000000000000, 9999999999999)}",
                'descripcion': f'{prod_data["nombre"]} - Producto de calidad',
            }
        )
        
        if created:
            print(f"  ✅ Producto creado: {producto.nombre} - Stock: {producto.stock}")

def main():
    """Función principal"""
    print("=" * 70)
    print("  GENERACIÓN DE DATOS DE DEMOSTRACIÓN - SISTEMA_ERP ERP")
    print("=" * 70)
    print("")
    
    try:
        empresa = create_empresa()
        create_monedas()
        create_bancos()
        create_departamentos_y_puestos(empresa)
        create_empleados(empresa)
        create_clientes(empresa)
        create_productos()
        
        print("")
        print("=" * 70)
        print("  ✅ DATOS DE DEMOSTRACIÓN GENERADOS EXITOSAMENTE")
        print("=" * 70)
        print("")
        print("Resumen:")
        print(f"  - Empresa: Sistema ERP Desarrollos S.A. de C.V.")
        print(f"  - Empleados: {Empleado.objects.filter(empresa=empresa).count()}")
        print(f"  - Clientes: {Cliente.objects.filter(empresa=empresa).count()}")
        print(f"  - Productos: {Producto.objects.count()}")
        print(f"  - Departamentos: {Departamento.objects.filter(empresa=empresa).count()}")
        print(f"  - Puestos: {Puesto.objects.filter(empresa=empresa).count()}")
        print("")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
