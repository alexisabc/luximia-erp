# 🌱 Guía de Seeds - Sistema ERP

## 📋 Comando Global de Seeds

Se ha creado un comando unificado `seed_all` que reemplaza y centraliza todos los comandos de seed individuales.

---

## 🚀 Uso Básico

### Poblar Toda la Base de Datos
```bash
# Con Docker
docker-compose exec backend python manage.py seed_all

# Local
python manage.py seed_all
```

### Poblar App Específica
```bash
# Solo Core (Empresas)
python manage.py seed_all --app core

# Solo RRHH
python manage.py seed_all --app rrhh

# Solo Contabilidad
python manage.py seed_all --app contabilidad

# Solo Tesorería
python manage.py seed_all --app tesoreria
```

### Omitir Apps Específicas
```bash
# Poblar todo excepto RRHH y POS
python manage.py seed_all --skip rrhh pos

# Poblar todo excepto Sistemas
python manage.py seed_all --skip sistemas
```

### Modo Minimal (Datos Mínimos)
```bash
# Crear solo 1 registro por modelo (ideal para testing rápido)
python manage.py seed_all --minimal

# Modo minimal para app específica
python manage.py seed_all --app tesoreria --minimal
```

---

## 📦 Apps Disponibles

El comando ejecuta los seeds en el siguiente orden (importante por dependencias):

| # | App | Descripción | Datos Creados |
|---|-----|-------------|---------------|
| 1 | **core** | Empresas y configuración base | Empresas |
| 2 | **rrhh** | Recursos Humanos | Departamentos, Puestos, Empleados |
| 3 | **contabilidad** | Contabilidad | Monedas, Bancos, Clientes |
| 4 | **compras** | Compras | Proveedores, Insumos |
| 5 | **tesoreria** | Tesorería | Cuentas Bancarias, Cajas Chicas |
| 6 | **pos** | Punto de Venta | Productos, Categorías |
| 7 | **sistemas** | Sistemas | Activos IT |

---

## 📊 Datos Creados por App

### 1. Core (Empresas)
- ✅ **3 Empresas demo** (1 en modo minimal)
  - ERP01: EMPRESA DEMO S.A. DE C.V.
  - ERP02: CORPORATIVO EJEMPLO S.A. DE C.V.
  - ERP03: SERVICIOS PROFESIONALES MUESTRA S.C.

### 2. Contabilidad
- ✅ **3 Monedas**
  - MXN (Peso Mexicano)
  - USD (Dólar Estadounidense)
  - EUR (Euro)
- ✅ **5 Bancos**
  - BANAMEX (002)
  - BBVA (012)
  - SANTANDER (014)
  - BANORTE (072)
  - SCOTIABANK (044)
- ✅ **2 Métodos de Pago SAT**
  - PUE (Pago en una sola exhibición)
  - PPD (Pago en parcialidades)
- ✅ **6 Formas de Pago SAT**
  - 01 (Efectivo)
  - 02 (Cheque nominativo)
  - 03 (Transferencia electrónica)
  - 04 (Tarjeta de crédito)
  - 28 (Tarjeta de débito)
  - 99 (Por definir)
- ✅ **2 Clientes demo**
  - CLIENTE DEMO UNO S.A. DE C.V.
  - CLIENTE DEMO DOS S.A. DE C.V.
- ✅ **8 Cuentas Contables**
  - 1101 - Caja
  - 1102 - Bancos
  - 1201 - Clientes
  - 2101 - Proveedores
  - 3101 - Capital Social
  - 4101 - Ventas
  - 5101 - Costo de Ventas
  - 6101 - Gastos de Operación
- ✅ **3 Centros de Costos**
  - CC01 - Administración
  - CC02 - Ventas
  - CC03 - Producción
- ✅ **1 Proyecto demo**
  - Proyecto Demo 2025

### 3. RRHH
- ✅ **6 Departamentos**
  - Dirección General
  - Recursos Humanos
  - Contabilidad
  - Ventas
  - Sistemas
  - Operaciones
- ✅ **8 Puestos** (3 en modo minimal)
  - Director General (Ejecutivo)
  - Gerente de RRHH (Gerencial)
  - Contador General (Gerencial)
  - Gerente de Ventas (Gerencial)
  - Jefe de Sistemas (Gerencial)
  - Auxiliar Contable (Operativo)
  - Vendedor (Operativo)
  - Desarrollador (Operativo)
- ✅ **3 Empleados** (con datos laborales completos)
  - EMP001 - Juan Pérez García (Director General)
  - EMP002 - María López Martínez (Gerente RRHH)
  - EMP003 - Carlos Rodríguez Sánchez (Contador General)

### 4. Compras
- ✅ **2 Proveedores** (1 en modo minimal)
  - PROVEEDOR DEMO UNO S.A. DE C.V.
  - PROVEEDOR DEMO DOS S.A. DE C.V.
- ✅ **4 Insumos**
  - Papel Bond Carta
  - Tóner Negro HP
  - Pluma Azul
  - Folder Tamaño Carta

### 5. Tesorería ✨ NUEVO
- ✅ **2 Cuentas Bancarias** (1 en modo minimal)
  - Cuenta BBVA MXN: 0123456789 (Saldo: $100,000.00)
  - Cuenta BBVA USD: 9876543210 (Saldo: $50,000.00)
- ✅ **2 Cajas Chicas** (1 en modo minimal)
  - Caja Chica General (Fondo: $5,000.00)
  - Caja Chica Ventas (Fondo: $3,000.00)
- ✅ **1 ContraRecibo**
  - CR-001: Factura de proveedor ($11,600.00)
- ✅ **1 Egreso**
  - EGR-001: Pago de factura ($11,600.00)

### 6. POS
- ✅ **3 Productos** (1 en modo minimal)
  - Producto Demo 1 ($100.00, Stock: 50)
  - Producto Demo 2 ($250.00, Stock: 30)
  - Producto Demo 3 ($500.00, Stock: 20)
- ✅ **1 Caja**
  - Caja Principal

### 7. Sistemas
- ✅ **3 Categorías de Equipos**
  - Computadoras
  - Impresoras
  - Servidores
- ✅ **2 Modelos de Equipos** (1 en modo minimal)
  - Dell Latitude 5420
  - HP LaserJet Pro
- ✅ **2 Activos IT**
  - SN001 (Dell Latitude 5420)
  - SN002 (Dell Latitude 5420)

---

## 🔄 Orden de Ejecución

El comando respeta las dependencias entre apps:

```
1. Core (Empresas)
   ↓
2. RRHH (requiere Empresas)
   ↓
3. Contabilidad (requiere Empresas)
   ↓
4. Compras (requiere Empresas)
   ↓
5. Tesorería (requiere Empresas, Bancos, Monedas, Usuarios)
   ↓
6. POS (requiere Empresas)
   ↓
7. Sistemas (requiere Empresas)
```

---

## 💡 Ejemplos de Uso

### Caso 1: Primera Instalación
```bash
# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Poblar base de datos completa
docker-compose exec backend python manage.py seed_all

# Actualizar permisos
docker-compose exec backend python manage.py update_permissions
```

### Caso 2: Desarrollo - Solo Tesorería
```bash
# Poblar solo lo necesario para Tesorería
docker-compose exec backend python manage.py seed_all --app core
docker-compose exec backend python manage.py seed_all --app contabilidad
docker-compose exec backend python manage.py seed_all --app tesoreria
```

### Caso 3: Testing - Todo excepto POS
```bash
# Poblar todo menos POS
docker-compose exec backend python manage.py seed_all --skip pos
```

---

## 🎯 Ventajas del Comando Unificado

### ✅ Antes (Múltiples Comandos)
```bash
python manage.py seed_empresas
python manage.py seed_rrhh
python manage.py seed_compras
python manage.py seed_pos
python manage.py seed_sistemas
# ... y más
```

### ✅ Ahora (Un Solo Comando)
```bash
python manage.py seed_all
```

### Beneficios
1. **Simplicidad**: Un solo comando para todo
2. **Orden**: Respeta dependencias automáticamente
3. **Flexibilidad**: Opciones para apps específicas
4. **Consistencia**: Mismo formato de salida
5. **Mantenibilidad**: Fácil de actualizar

---

## 📝 Salida del Comando

```
================================================================================
🌱 SEED GLOBAL - Sistema ERP
================================================================================

[1/7] 📦 CORE: Empresas y configuración base
--------------------------------------------------------------------------------
  ✓ Creada: Empresa Demo
✅ core completado

[2/7] 📦 RRHH: Recursos Humanos (Departamentos, Puestos, Empleados)
--------------------------------------------------------------------------------
  ✓ Departamento: Dirección General
  ✓ Departamento: Recursos Humanos
  ✓ Puesto: Director General
  ✓ Puesto: Gerente de RRHH
✅ rrhh completado

[3/7] 📦 CONTABILIDAD: Contabilidad (Clientes, Proyectos, Cuentas)
--------------------------------------------------------------------------------
  ✓ Moneda: MXN
  ✓ Moneda: USD
  ✓ Banco: BBVA
  ✓ Cliente: CLIENTE DEMO S.A. DE C.V.
✅ contabilidad completado

[4/7] 📦 COMPRAS: Compras (Proveedores, Insumos)
--------------------------------------------------------------------------------
  ✓ Proveedor: PROVEEDOR DEMO S.A. DE C.V.
✅ compras completado

[5/7] 📦 TESORERIA: Tesorería (Cuentas Bancarias, Cajas Chicas)
--------------------------------------------------------------------------------
  ✓ Cuenta Bancaria: 0123456789
  ✓ Caja Chica: Caja Chica General
✅ tesoreria completado

[6/7] 📦 POS: Punto de Venta (Productos, Categorías)
--------------------------------------------------------------------------------
  ✓ Productos y Categorías creados
✅ pos completado

[7/7] 📦 SISTEMAS: Sistemas (Activos IT)
--------------------------------------------------------------------------------
  ✓ Activos IT creados
✅ sistemas completado

================================================================================
📊 RESUMEN
================================================================================
Total de apps procesadas: 7
✅ Exitosas: 7
❌ Con errores: 0

🎉 Seed global completado
```

---

## 🔧 Personalización

### Agregar Nueva App

Para agregar una nueva app al seed global, edita `/backend/core/management/commands/seed_all.py`:

```python
# 1. Agregar a seed_order
seed_order = [
    # ... apps existentes
    ('mi_nueva_app', 'Descripción de mi app'),
]

# 2. Crear método _seed_mi_nueva_app
def _seed_mi_nueva_app(self, force):
    """Seed de Mi Nueva App"""
    from mi_nueva_app.models import MiModelo
    
    with transaction.atomic():
        # Tu lógica de seed aquí
        pass
```

---

## ⚠️ Notas Importantes

### Datos Existentes
- El comando usa `get_or_create()` para evitar duplicados
- Si los datos ya existen, no se sobrescriben
- Usa `--force` (próximamente) para forzar recreación

### Dependencias
- Asegúrate de tener un **superusuario** creado antes de ejecutar
- Algunas apps requieren datos de otras (respeta el orden)

### Producción
- ⚠️ **NO ejecutar en producción** sin revisar los datos
- Los seeds son para **desarrollo y testing**
- Personaliza los datos según tus necesidades

---

## 🗑️ Comandos Antiguos (Deprecados)

Los siguientes comandos individuales pueden ser reemplazados por `seed_all`:

| Comando Antiguo | Nuevo Comando |
|-----------------|---------------|
| `seed_empresas` | `seed_all --app core` |
| `seed_rrhh` | `seed_all --app rrhh` |
| `seed_compras` | `seed_all --app compras` |
| `seed_pos` | `seed_all --app pos` |
| `seed_sistemas` | `seed_all --app sistemas` |

---

## 📚 Recursos Adicionales

- **Documentación de Django**: [Management Commands](https://docs.djangoproject.com/en/5.0/howto/custom-management-commands/)
- **Guía de Despliegue**: `/ERP_Docs/GUIA_DESPLIEGUE.md`
- **Permisos**: `/ERP_Docs/PERMISOS_Y_ROLES.md`

---

**Creado**: 27 de Diciembre de 2025  
**Versión**: 2.6  
**Comando**: `seed_all`
