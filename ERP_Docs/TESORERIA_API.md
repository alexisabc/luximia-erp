# 🏦 Módulo de Tesorería - API Completa

## ✅ Implementación Completada

Se ha implementado completamente el módulo de **Tesorería** con modelos, serializers, viewsets y endpoints.

---

## 📦 Archivos Creados

### Backend

1. **`backend/tesoreria/models.py`** ✅ ACTUALIZADO
   - CuentaBancaria
   - CajaChica
   - MovimientoCaja
   - Egreso
   - (ContraRecibo, ProgramacionPago ya existían)

2. **`backend/tesoreria/serializers.py`** ✨ NUEVO
   - Serializers para todos los modelos
   - Campos calculados (diferencia, porcentaje_uso)
   - Relaciones anidadas

3. **`backend/tesoreria/views.py`** ✨ NUEVO
   - ViewSets con acciones personalizadas
   - Control de permisos
   - Lógica de negocio

4. **`backend/tesoreria/urls.py`** ✨ NUEVO
   - Registro de rutas

---

## 🌐 Endpoints Disponibles

### Base URL: `/tesoreria/`

#### **ContraRecibos** (`/contrarecibos/`)
- `GET /contrarecibos/` - Listar contrarecibos
  - Filtros: `?estado=`, `?proveedor=`, `?pendientes=true`
- `POST /contrarecibos/` - Crear contrarecibo
- `GET /contrarecibos/{id}/` - Detalle
- `PUT/PATCH /contrarecibos/{id}/` - Actualizar
- `DELETE /contrarecibos/{id}/` - Eliminar (soft delete)
- `POST /contrarecibos/{id}/validar/` - Validar para pago

#### **Programaciones de Pago** (`/programaciones-pago/`)
- `GET /programaciones-pago/` - Listar programaciones
- `POST /programaciones-pago/` - Crear programación
- `GET /programaciones-pago/{id}/` - Detalle
- `PUT/PATCH /programaciones-pago/{id}/` - Actualizar
- `DELETE /programaciones-pago/{id}/` - Eliminar
- `POST /programaciones-pago/{id}/autorizar/` - Autorizar ✅ Requiere permiso
- `POST /programaciones-pago/{id}/generar_layout/` - Generar layout bancario

#### **Cuentas Bancarias** (`/cuentas-bancarias/`)
- `GET /cuentas-bancarias/` - Listar cuentas
  - Filtros: `?activa=true`, `?empresa=`
- `POST /cuentas-bancarias/` - Crear cuenta
- `GET /cuentas-bancarias/{id}/` - Detalle
- `PUT/PATCH /cuentas-bancarias/{id}/` - Actualizar
- `DELETE /cuentas-bancarias/{id}/` - Eliminar
- `POST /cuentas-bancarias/{id}/conciliar/` - Conciliar ✅ Requiere permiso
  ```json
  {
    "saldo_bancario": 150000.00
  }
  ```

#### **Cajas Chicas** (`/cajas-chicas/`)
- `GET /cajas-chicas/` - Listar cajas
  - Filtros: `?estado=`, `?responsable=`
- `POST /cajas-chicas/` - Crear caja
- `GET /cajas-chicas/{id}/` - Detalle
- `PUT/PATCH /cajas-chicas/{id}/` - Actualizar
- `DELETE /cajas-chicas/{id}/` - Eliminar
- `POST /cajas-chicas/{id}/cerrar/` - Cerrar caja ✅ Requiere permiso
- `POST /cajas-chicas/{id}/reembolsar/` - Reembolsar caja

#### **Movimientos de Caja** (`/movimientos-caja/`)
- `GET /movimientos-caja/` - Listar movimientos
  - Filtros: `?caja=`, `?tipo=`
- `POST /movimientos-caja/` - Registrar movimiento
- `GET /movimientos-caja/{id}/` - Detalle
- `PUT/PATCH /movimientos-caja/{id}/` - Actualizar
- `DELETE /movimientos-caja/{id}/` - Eliminar

#### **Egresos** (`/egresos/`)
- `GET /egresos/` - Listar egresos
  - Filtros: `?estado=`, `?cuenta=`, `?tipo=`, `?pendientes=true`
- `POST /egresos/` - Crear egreso
- `GET /egresos/{id}/` - Detalle
- `PUT/PATCH /egresos/{id}/` - Actualizar
- `DELETE /egresos/{id}/` - Eliminar
- `POST /egresos/{id}/autorizar/` - Autorizar ✅ Requiere `tesoreria.autorizar_egreso`
- `POST /egresos/{id}/pagar/` - Marcar como pagado ✅ Requiere `tesoreria.realizar_pago`
- `POST /egresos/{id}/cancelar/` - Cancelar egreso

---

## 🔐 Permisos Implementados

### Permisos Estándar (CRUD)
Cada modelo tiene sus permisos estándar:
- `tesoreria.view_cuentabancaria`
- `tesoreria.add_cuentabancaria`
- `tesoreria.change_cuentabancaria`
- `tesoreria.delete_cuentabancaria`
- (Y así para cada modelo)

### Permisos Personalizados
Definidos en `CuentaBancaria.Meta.permissions`:
- ✅ `tesoreria.autorizar_egreso` - Autorizar Egresos
- ✅ `tesoreria.realizar_pago` - Realizar Pagos
- ✅ `tesoreria.conciliar_banco` - Conciliar Cuentas Bancarias
- ✅ `tesoreria.cerrar_caja` - Cerrar Caja Chica

---

## 📊 Flujos de Trabajo

### 1. Flujo de Pago a Proveedor

```javascript
// 1. Crear ContraRecibo desde factura
POST /tesoreria/contrarecibos/
{
  "proveedor": 1,
  "tipo": "FACTURA",
  "uuid": "ABC123...",
  "total": 10000,
  "moneda": 1
}

// 2. Validar ContraRecibo
POST /tesoreria/contrarecibos/1/validar/

// 3. Crear Egreso
POST /tesoreria/egresos/
{
  "cuenta_bancaria": 1,
  "fecha": "2025-12-27",
  "tipo": "TRANSFERENCIA",
  "beneficiario": "Proveedor XYZ",
  "concepto": "Pago Factura ABC",
  "monto": 10000,
  "contra_recibo": 1
}

// 4. Autorizar Egreso (Gerente)
POST /tesoreria/egresos/1/autorizar/

// 5. Realizar Pago (Tesorero)
POST /tesoreria/egresos/1/pagar/
// Esto actualiza:
// - Estado del egreso a PAGADO
// - Saldo de la cuenta bancaria (-10000)
// - Saldo pendiente del ContraRecibo
```

### 2. Flujo de Caja Chica

```javascript
// 1. Crear Caja Chica
POST /tesoreria/cajas-chicas/
{
  "nombre": "Caja Oficina Central",
  "responsable": 5,
  "empresa": 1,
  "monto_fondo": 5000
}

// 2. Registrar Gasto
POST /tesoreria/movimientos-caja/
{
  "caja": 1,
  "tipo": "GASTO",
  "concepto": "Papelería",
  "monto": 150,
  "beneficiario": "Papelería XYZ"
}
// Esto actualiza automáticamente el saldo de la caja

// 3. Cerrar Caja (Fin de semana/mes)
POST /tesoreria/cajas-chicas/1/cerrar/

// 4. Reembolsar Caja
POST /tesoreria/cajas-chicas/1/reembolsar/
// Esto crea un movimiento de reembolso y restaura el fondo
```

### 3. Conciliación Bancaria

```javascript
// 1. Obtener cuenta con diferencias
GET /tesoreria/cuentas-bancarias/1/
// Respuesta incluye:
{
  "saldo_actual": 100000,    // Saldo según sistema
  "saldo_bancario": 98500,   // Saldo según banco
  "diferencia": 1500         // Campo calculado
}

// 2. Actualizar saldo bancario
POST /tesoreria/cuentas-bancarias/1/conciliar/
{
  "saldo_bancario": 98500
}

// 3. Investigar diferencias
// La diferencia de 1500 puede ser:
// - Cheques en tránsito
// - Depósitos no reflejados
// - Comisiones bancarias
// - Errores de registro
```

---

## 🎨 Ejemplos de Respuesta

### Cuenta Bancaria con Datos Anidados
```json
{
  "id": 1,
  "banco_data": {
    "id": 1,
    "nombre_corto": "BBVA",
    "nombre_completo": "BBVA Bancomer"
  },
  "moneda_data": {
    "id": 1,
    "codigo": "MXN",
    "nombre": "Peso Mexicano"
  },
  "empresa_nombre": "Mi Empresa SA de CV",
  "numero_cuenta": "0123456789",
  "clabe": "012345678901234567",
  "tipo_cuenta": "CHEQUES",
  "saldo_actual": "100000.00",
  "saldo_bancario": "98500.00",
  "diferencia": "1500.00",
  "es_principal": true,
  "activa": true
}
```

### Egreso Completo
```json
{
  "id": 1,
  "folio": "EG-2025-00001",
  "cuenta_bancaria_data": { ... },
  "fecha": "2025-12-27",
  "tipo": "TRANSFERENCIA",
  "beneficiario": "Proveedor XYZ SA",
  "concepto": "Pago Factura #123",
  "monto": "10000.00",
  "referencia": "REF123456",
  "estado": "PAGADO",
  "solicitado_por_nombre": "Juan Pérez",
  "autorizado_por_nombre": "María García",
  "fecha_autorizacion": "2025-12-27T10:30:00Z",
  "contra_recibo_data": { ... }
}
```

---

## 🚀 Pasos para Activar

```bash
# 1. Crear migraciones
docker-compose exec backend python manage.py makemigrations tesoreria

# 2. Aplicar migraciones
docker-compose exec backend python manage.py migrate tesoreria

# 3. Actualizar permisos
docker-compose exec backend python manage.py update_permissions

# 4. Verificar endpoints
curl http://localhost:8000/tesoreria/cuentas-bancarias/
```

---

## 📝 Próximos Pasos Recomendados

### Backend
1. ✅ **Crear Admin Panel** - Registrar modelos en Django Admin
2. ✅ **Tests Unitarios** - Crear tests para ViewSets y lógica de negocio
3. ✅ **Generación de Layouts** - Implementar generación real de archivos bancarios
4. ✅ **Reportes** - Endpoints para reportes de flujo de efectivo

### Frontend
1. ✅ **Módulo de Cuentas Bancarias** - CRUD y conciliación
2. ✅ **Módulo de Egresos** - Flujo de solicitud → autorización → pago
3. ✅ **Módulo de Cajas Chicas** - Gestión de fondos y movimientos
4. ✅ **Dashboard de Tesorería** - Resumen de saldos y flujos

---

**Fecha**: 27 de Diciembre de 2025  
**Módulo**: Tesorería  
**Estado**: ✅ API Completa  
**Versión**: 2.6
