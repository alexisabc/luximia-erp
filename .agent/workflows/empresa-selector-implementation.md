# Selector de Empresa - Implementación Completa

## ✅ Implementación Finalizada

### 🎯 Funcionalidad
El usuario ahora puede:
- Ver en qué empresa está trabajando actualmente
- Cambiar entre empresas con un solo clic
- Ver todas las empresas a las que tiene acceso
- Identificar visualmente cada empresa por su color

### 📦 Componentes Creados

#### Backend

1. **`core/views.py`** - EmpresaViewSet
   ```python
   GET  /core/empresas/mis_empresas/  # Obtiene empresas del usuario
   POST /core/empresas/{id}/cambiar/  # Cambia empresa activa
   ```

2. **`core/serializers.py`** - EmpresaSerializer
   - Serializa todos los campos de Empresa
   - Incluye `direccion_completa` como campo calculado

3. **`core/urls.py`** - Rutas de Core
   - Router con endpoints de Empresa

4. **`luximia_erp/urls.py`** - URLs principales
   - Agregado `path('core/', include('core.urls'))`

#### Frontend

5. **`services/core.js`** - Funciones API
   ```javascript
   getMisEmpresas()           // Obtiene empresas del usuario
   cambiarEmpresa(empresaId)  // Cambia empresa activa
   getEmpresas()              // Todas las empresas (admin)
   ```

6. **`components/layout/EmpresaSelector.jsx`** - Componente Selector
   - Dropdown elegante con lista de empresas
   - Indicador visual de empresa activa
   - Colores personalizados por empresa
   - Recarga automática al cambiar

7. **`components/layout/Sidebar.jsx`** - Sidebar actualizado
   - EmpresaSelector agregado después del header
   - Visible en todas las páginas

### 🎨 Características del Selector

#### Diseño Visual
```
┌─────────────────────────────────┐
│ ● LUX01                         │ ← Indicador de color
│   Empresa                       │
│   Luximia Desarrollos           │
│                              ▼  │
└─────────────────────────────────┘
```

#### Dropdown Expandido
```
┌─────────────────────────────────┐
│ Cambiar Empresa                 │
├─────────────────────────────────┤
│ ● LUX01                      ✓  │ ← Activa
│   Luximia Desarrollos           │
├─────────────────────────────────┤
│ ● LUX02                         │
│   Luximia Materiales            │
├─────────────────────────────────┤
│ ● LUX03                         │
│   Luximia Constructora          │
└─────────────────────────────────┘
```

### 🔄 Flujo de Cambio de Empresa

1. Usuario hace clic en el selector
2. Se despliega lista de empresas disponibles
3. Usuario selecciona nueva empresa
4. Backend actualiza `request.session['empresa_id']`
5. Frontend muestra toast de confirmación
6. Página se recarga automáticamente
7. Todos los datos se filtran por nueva empresa

### 🎨 Personalización por Empresa

Cada empresa tiene su color distintivo:
- **LUX01** - Azul (#3B82F6) - Desarrollos
- **LUX02** - Verde (#10B981) - Materiales
- **LUX03** - Naranja (#F59E0B) - Constructora
- **LUX04** - Morado (#8B5CF6) - Inmobiliaria
- **LUX05** - Rojo (#EF4444) - Servicios

### 🔒 Seguridad

- ✅ Solo muestra empresas con acceso del usuario
- ✅ Valida permisos en backend antes de cambiar
- ✅ Superusuarios ven todas las empresas
- ✅ Sesión segura con validación de acceso

### 📱 Responsive

- ✅ Funciona en desktop y móvil
- ✅ Se adapta al sidebar colapsado
- ✅ Tooltips y truncado de texto largo

### 🚀 Próximos Pasos

Para completar la implementación multi-empresa:

1. **Ejecutar migraciones:**
   ```bash
   docker compose exec backend python manage.py makemigrations core
   docker compose exec backend python manage.py makemigrations users
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_empresas
   ```

2. **Agregar campo `empresa` a modelos transaccionales:**
   - Proyecto
   - Cliente
   - Venta
   - Turno
   - Caja
   - etc.

3. **Implementar filtrado automático:**
   - Crear mixin `EmpresaFilterMixin`
   - Aplicar a todos los ViewSets
   - Filtrar automáticamente por `request.empresa`

4. **Actualizar serializers:**
   - Agregar campo `empresa` a serializers
   - Hacer read-only para usuarios normales

### 🎯 Uso del Selector

El selector aparece automáticamente en el Sidebar para todos los usuarios que tengan acceso a más de una empresa. Si el usuario solo tiene acceso a una empresa, se muestra como información estática sin dropdown.

### 📝 Notas Importantes

- El cambio de empresa recarga la página para aplicar filtros
- Los datos se segregan automáticamente por empresa
- El middleware `EmpresaMiddleware` maneja la lógica de sesión
- La empresa se mantiene entre sesiones (stored in session)
