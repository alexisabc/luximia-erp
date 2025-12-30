# 📋 Análisis de Componentes Legacy - Plan de Limpieza

## 🔍 Estado Actual de Carpetas Legacy

### ✅ Carpetas que se PUEDEN ELIMINAR (vacías o duplicadas)

#### 1. **cards/** - VACÍA ✅
- **Estado**: Carpeta vacía
- **Acción**: Eliminar
- **Razón**: Ya eliminamos Kpi.jsx, no queda nada

#### 2. **tables/** - DUPLICADO ✅
- **Contenido**: `ReusableTable.jsx`
- **Acción**: Eliminar
- **Razón**: Ya migrado a `DataTable` (organisms)
- **Verificación**: Todas las importaciones actualizadas

---

### ⚠️ Carpetas que DEBEN QUEDARSE (componentes únicos en uso)

#### 1. **common/** - MANTENER ⚠️
**Contenido:**
- `SessionTimeout.jsx` - Manejo de timeout de sesión (único)
- `UnderConstruction.jsx` - Página en construcción (único)

**Razón**: Componentes específicos sin duplicados en Atomic Design

---

#### 2. **charts/** - MANTENER ⚠️
**Contenido:**
- `Ventas.jsx` - Gráfica de ventas con Recharts
- `FlujoCobranza.jsx` - Gráfica de flujo de cobranza

**Razón**: Componentes de visualización específicos, no hay equivalentes en Atomic Design

---

#### 3. **modals/** - MANTENER (parcialmente) ⚠️
**Contenido:**
- `ReusableModal.jsx` - DUPLICADO → Eliminar
- `Confirmation.jsx` - Puede usar ConfirmModal → Migrar
- `Export.jsx` - Modal específico de exportación → Mantener temporalmente
- `Import.jsx` - Modal específico de importación → Mantener temporalmente
- `Form.jsx` - Modal de formulario genérico → Puede migrar
- `NominaReciboModal.jsx` - Modal específico de nómina → Mantener
- `ProveedorModal.jsx` - Modal específico de proveedor → Mantener
- `RolePermissionsModal.jsx` - Modal específico de roles → Mantener
- `UserModal.jsx` - Modal específico de usuario → Mantener
- `index.jsx` - Índice de modales → Mantener

**Acción**: Eliminar solo `ReusableModal.jsx`

---

#### 4. **layout/** - MANTENER ⚠️
**Contenido:**
- `AppContent.jsx` - Contenedor principal de la app
- `EmpresaSelector.jsx` - Selector de empresa
- `MobileHeader.jsx` - Header móvil (puede migrar a Header)
- `Navbar.jsx` - Navbar principal
- `NotificationsBell.jsx` - Campana de notificaciones
- `SandboxToggle.jsx` - Toggle de sandbox
- `Sidebar.jsx` - Sidebar principal (puede migrar a NavigationSidebar)
- `ThemeProvider.jsx` - Provider de tema
- `ThemeSwitcher.jsx` - Switcher de tema
- `navigationConfig.js` - Configuración de navegación

**Razón**: Componentes de layout específicos del sistema, algunos pueden migrarse en el futuro

---

#### 5. **loaders/** - MANTENER ⚠️
**Contenido:**
- `Bars.jsx` - Loader de barras
- `Dots.jsx` - Loader de puntos
- `Overlay.jsx` - Overlay de carga (usado en dashboard)
- `Spinner.jsx` - Spinner legacy (diferente al Atom)
- `index.jsx` - Índice de loaders

**Razón**: Loaders específicos usados en varias partes, Overlay se usa activamente

---

#### 6. **features/** - MANTENER ⚠️
**Contenido:**
- `ChatInteligente.jsx` - Chat inteligente
- `auth/` - Features de autenticación
- `data/` - Features de datos
- `finance/` - Features financieros

**Razón**: Features específicos del negocio, no son componentes UI genéricos

---

#### 7. **rrhh/** - MANTENER ⚠️
**Contenido:**
- `EmployeeDetailModal.jsx` - Modal específico de detalle de empleado

**Razón**: Modal específico del módulo RRHH

---

## 🗑️ Plan de Limpieza Inmediata

### Eliminar Ahora:
1. ✅ `components/cards/` - Carpeta vacía
2. ✅ `components/tables/ReusableTable.jsx` - Duplicado
3. ✅ `components/modals/ReusableModal.jsx` - Duplicado

### Total a eliminar: 3 items

---

## 📝 Plan de Migración Futura (Opcional)

### Componentes que PUEDEN migrarse:
1. **Sidebar.jsx** → `NavigationSidebar` (organisms)
2. **MobileHeader.jsx** → `Header` (organisms)
3. **Confirmation.jsx** → `ConfirmModal` (organisms)
4. **Form.jsx** → Usar `Modal` + `FormField` (organisms + molecules)
5. **Loaders** → Consolidar con `Spinner` (atoms)

---

## ✅ Resumen

### Carpetas a ELIMINAR (2):
- ✅ `cards/` - Vacía
- ✅ `tables/` - Duplicada

### Archivos a ELIMINAR (1):
- ✅ `modals/ReusableModal.jsx` - Duplicado

### Carpetas a MANTENER (6):
- ⚠️ `common/` - Componentes únicos
- ⚠️ `charts/` - Gráficas específicas
- ⚠️ `modals/` - Modales específicos (menos ReusableModal)
- ⚠️ `layout/` - Layout del sistema
- ⚠️ `loaders/` - Loaders en uso
- ⚠️ `features/` - Features del negocio
- ⚠️ `rrhh/` - Componentes específicos RRHH

---

**Conclusión**: La mayoría de estas carpetas contienen componentes **específicos del negocio** o **features únicas** que no tienen equivalentes en Atomic Design. Solo eliminaremos los componentes que están **duplicados** o **vacíos**.

---

**Última actualización**: 2025-12-29
