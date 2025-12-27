# 🏦 Módulo de Tesorería - Modelos Implementados

## 📋 Resumen

Se han agregado los siguientes modelos al módulo de **Tesorería** (`backend/tesoreria/models.py`):

### ✨ Nuevos Modelos

#### 1. **CuentaBancaria**
Gestión de cuentas bancarias de la empresa.

**Campos principales:**
- `banco` - Relación con catálogo de bancos
- `empresa` - Empresa propietaria
- `numero_cuenta` - Número de cuenta
- `clabe` - CLABE interbancaria
- `tipo_cuenta` - Cheques, Inversión, Nómina, Ahorro
- `moneda` - Moneda de la cuenta
- `saldo_actual` - Saldo según sistema
- `saldo_bancario` - Saldo según estado de cuenta
- `cuenta_contable` - Vinculación con contabilidad
- `es_principal` - Marca cuenta principal
- `activa` - Estado de la cuenta

**Permisos personalizados:**
- `autorizar_egreso` - Autorizar Egresos
- `realizar_pago` - Realizar Pagos
- `conciliar_banco` - Conciliar Cuentas Bancarias
- `cerrar_caja` - Cerrar Caja Chica

#### 2. **CajaChica**
Fondos de caja chica para gastos menores.

**Campos principales:**
- `nombre` - Nombre de la caja
- `responsable` - Usuario responsable
- `empresa` - Empresa
- `monto_fondo` - Monto del fondo fijo
- `saldo_actual` - Saldo disponible
- `fecha_apertura` / `fecha_cierre`
- `estado` - Abierta, Cerrada, Reembolsada

#### 3. **MovimientoCaja**
Registro de movimientos en caja chica.

**Campos principales:**
- `caja` - Caja chica asociada
- `tipo` - Gasto o Reembolso
- `fecha` - Fecha del movimiento
- `concepto` - Descripción
- `monto` - Importe
- `comprobante` - Archivo de comprobante
- `beneficiario` - Persona/empresa beneficiaria
- `registrado_por` - Usuario que registró

#### 4. **Egreso**
Registro de egresos/pagos desde cuentas bancarias.

**Campos principales:**
- `folio` - Folio autogenerado (EG-YYYY-#####)
- `cuenta_bancaria` - Cuenta de origen
- `fecha` - Fecha del egreso
- `tipo` - Transferencia, Cheque, Efectivo, Tarjeta
- `beneficiario` - Destinatario
- `concepto` - Descripción del pago
- `monto` - Importe
- `referencia` - Número de cheque o referencia
- `comprobante` - Archivo de comprobante
- `contra_recibo` - Vinculación opcional con ContraRecibo
- `estado` - Borrador, Autorizado, Pagado, Cancelado
- `solicitado_por` / `autorizado_por` - Flujo de autorización

---

## 🚀 Aplicar Cambios

### Paso 1: Crear Migraciones

```bash
# Con Docker
docker-compose exec backend python manage.py makemigrations tesoreria

# Local
python manage.py makemigrations tesoreria
```

### Paso 2: Aplicar Migraciones

```bash
# Con Docker
docker-compose exec backend python manage.py migrate tesoreria

# Local
python manage.py migrate tesoreria
```

### Paso 3: Actualizar Permisos

```bash
# Con Docker
docker-compose exec backend python manage.py update_permissions

# Local
python manage.py update_permissions
```

Esto creará los 4 permisos personalizados de tesorería que antes fallaban:
- ✅ `tesoreria.autorizar_egreso`
- ✅ `tesoreria.realizar_pago`
- ✅ `tesoreria.conciliar_banco`
- ✅ `tesoreria.cerrar_caja`

---

## 📊 Diagrama de Relaciones

```
CuentaBancaria
    ├─→ Banco (contabilidad)
    ├─→ Empresa (core)
    ├─→ Moneda (contabilidad)
    ├─→ CuentaContable (contabilidad)
    └─→ Egreso (1:N)

CajaChica
    ├─→ Usuario (responsable)
    ├─→ Empresa (core)
    └─→ MovimientoCaja (1:N)

Egreso
    ├─→ CuentaBancaria
    ├─→ ContraRecibo (opcional)
    ├─→ Usuario (solicitado_por)
    └─→ Usuario (autorizado_por)

ContraRecibo (existente)
    ├─→ Proveedor (compras)
    ├─→ OrdenCompra (compras)
    ├─→ Moneda (contabilidad)
    └─→ Egreso (1:N)
```

---

## 💡 Casos de Uso

### 1. Flujo de Pago a Proveedor

```python
# 1. Se crea un ContraRecibo desde una Factura
contra_recibo = ContraRecibo.objects.create(
    proveedor=proveedor,
    tipo='FACTURA',
    total=10000,
    ...
)

# 2. Se programa el pago
programacion = ProgramacionPago.objects.create(
    fecha_programada=date.today(),
    banco_emisor=banco,
    ...
)

# 3. Se crea el egreso
egreso = Egreso.objects.create(
    cuenta_bancaria=cuenta,
    beneficiario=proveedor.razon_social,
    monto=10000,
    contra_recibo=contra_recibo,
    estado='BORRADOR',
    solicitado_por=request.user
)

# 4. Se autoriza
egreso.estado = 'AUTORIZADO'
egreso.autorizado_por = gerente
egreso.save()

# 5. Se marca como pagado
egreso.estado = 'PAGADO'
egreso.save()
```

### 2. Gestión de Caja Chica

```python
# 1. Crear caja chica
caja = CajaChica.objects.create(
    nombre="Caja Oficina Central",
    responsable=usuario,
    empresa=empresa,
    monto_fondo=5000,
    saldo_actual=5000
)

# 2. Registrar gasto
movimiento = MovimientoCaja.objects.create(
    caja=caja,
    tipo='GASTO',
    concepto="Papelería",
    monto=150,
    registrado_por=usuario
)

# 3. Actualizar saldo
caja.saldo_actual -= movimiento.monto
caja.save()

# 4. Reembolsar caja
reembolso = MovimientoCaja.objects.create(
    caja=caja,
    tipo='REEMBOLSO',
    concepto="Reembolso de gastos",
    monto=150,
    registrado_por=usuario
)
caja.saldo_actual += reembolso.monto
caja.save()
```

---

## 🔐 Permisos Recomendados por Rol

### Tesorero
- `tesoreria.view_cuentabancaria`
- `tesoreria.add_egreso`
- `tesoreria.change_egreso`
- `tesoreria.realizar_pago`
- `tesoreria.conciliar_banco`

### Gerente Financiero
- Todos los permisos de Tesorero +
- `tesoreria.autorizar_egreso`
- `tesoreria.add_cuentabancaria`
- `tesoreria.change_cuentabancaria`

### Responsable de Caja Chica
- `tesoreria.view_cajachica`
- `tesoreria.add_movimientocaja`
- `tesoreria.view_movimientocaja`
- `tesoreria.cerrar_caja`

---

## 📝 Próximos Pasos

1. **Crear Serializers** para los nuevos modelos
2. **Crear ViewSets** para exponer las APIs
3. **Registrar en URLs** de tesorería
4. **Crear UI** en el frontend para gestión de:
   - Cuentas bancarias
   - Egresos
   - Cajas chicas
   - Conciliación bancaria

---

**Fecha**: 27 de Diciembre de 2025  
**Módulo**: Tesorería  
**Versión**: 2.6
