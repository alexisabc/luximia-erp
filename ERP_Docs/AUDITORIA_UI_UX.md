# 🎨 Auditoría de UI/UX - Sistema ERP

## 📊 Resumen Ejecutivo

**Páginas totales**: 103  
**Fecha de auditoría**: 27 de Diciembre 2025  
**Objetivo**: Estandarizar estilos, componentes y responsividad

---

## 🔍 Hallazgos de la Auditoría

### ✅ Componentes Reutilizables Disponibles

#### UI Base (`/components/ui/`)
1. ✅ **Button** - Botón con variantes
2. ✅ **Input** - Campo de texto
3. ✅ **Label** - Etiqueta de formulario
4. ✅ **Select** - Selector desplegable
5. ✅ **Textarea** - Área de texto
6. ✅ **Badge** - Insignia/etiqueta
7. ✅ **Card** - Tarjeta de contenido
8. ✅ **Dialog** - Modal/diálogo
9. ✅ **Dropdown Menu** - Menú desplegable
10. ✅ **Table** - Tabla base
11. ✅ **Pagination** - Paginación
12. ✅ **ConnectivityIndicator** - Indicador de conexión

#### Componentes Complejos
1. ✅ **ReusableTable** (`/components/tables/`)
2. ✅ **ReusableModal** (`/components/modals/`)
3. ✅ **FormModal** (`/components/modals/`)
4. ✅ **ConfirmationModal** (`/components/modals/`)
5. ✅ **ExportModal** (`/components/modals/`)
6. ✅ **ImportModal** (`/components/modals/`)
7. ✅ **ActionButtons** (`/components/common/`)

#### Iconos
- ✅ **Lucide React** - Biblioteca de iconos moderna

---

## 📋 Patrones Identificados

### Patrón Moderno (Tesorería - Nuevo)
```jsx
// ✅ BUENO - Patrón recomendado
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';  // ✅ Toasts modernos
import { Plus, Loader2 } from 'lucide-react';  // ✅ Iconos consistentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';  // ✅ Componentes UI
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export default function ModernPage() {
    // Estado y lógica
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-6">
            {/* Contenido responsive */}
        </div>
    );
}
```

### Patrón Antiguo (Clientes - Legacy)
```jsx
// ⚠️ NECESITA ACTUALIZACIÓN
'use client';

import React, { useState } from 'react';
import { getClientes } from '@/services/api';  // ⚠️ API directa
import FormModal from '@/components/modals/Form';  // ⚠️ Modal antiguo
import ActionButtons from '@/components/common/ActionButtons';

export default function LegacyPage() {
    // ⚠️ Sin toasts modernos
    // ⚠️ Sin iconos lucide
    // ⚠️ Sin componentes UI base
    
    return (
        <div className="p-4">  {/* ⚠️ Sin gradientes ni dark mode optimizado */}
            {/* Contenido */}
        </div>
    );
}
```

---

## 🎯 Estándares Definidos

### 1. Estructura de Página

```jsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IconName, Loader2, Plus } from 'lucide-react';
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PageName() {
    // 1. Estados
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 2. Effects
    useEffect(() => {
        loadData();
    }, []);
    
    // 3. Funciones
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiCall();
            setData(res.data);
        } catch (error) {
            toast.error("Error cargando datos");
        } finally {
            setLoading(false);
        }
    };
    
    // 4. Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    Título
                </h1>
            </div>
            
            {/* Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Cards */}
            </div>
            
            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
                {/* Content */}
            </div>
        </div>
    );
}
```

### 2. Clases Tailwind Responsivas

```jsx
// ✅ CORRECTO - Mobile First
<div className="
    p-4 sm:p-6 lg:p-8           // Padding responsive
    text-sm sm:text-base lg:text-lg  // Texto responsive
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  // Grid responsive
    gap-4 sm:gap-6 lg:gap-8     // Gap responsive
">

// ✅ Breakpoints Tailwind
// sm: 640px   (Tablets)
// md: 768px   (Tablets landscape)
// lg: 1024px  (Laptops)
// xl: 1280px  (Desktops)
// 2xl: 1536px (Large screens/TVs)
```

### 3. Dark Mode

```jsx
// ✅ CORRECTO - Siempre incluir dark mode
<div className="
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-white
    border-gray-200 dark:border-gray-700
">

// ✅ Gradientes con dark mode
<div className="
    bg-gradient-to-br 
    from-slate-50 to-blue-50 
    dark:from-gray-900 dark:to-slate-900
">
```

### 4. Botones Estándar

```jsx
// ✅ Botón Primario
<Button className="
    bg-gradient-to-r from-blue-600 to-indigo-600 
    hover:from-blue-700 hover:to-indigo-700
    text-white
">
    <Plus className="w-4 h-4 mr-2" />
    Nuevo
</Button>

// ✅ Botón Secundario
<Button variant="outline" className="
    border-gray-300 dark:border-gray-600
    text-gray-700 dark:text-gray-300
    hover:bg-gray-50 dark:hover:bg-gray-700
">
    Cancelar
</Button>

// ✅ Botón Peligro
<Button variant="destructive">
    Eliminar
</Button>
```

### 5. Cards de Estadísticas

```jsx
<div className="
    bg-gradient-to-br from-blue-500 to-indigo-600
    dark:from-blue-600 dark:to-indigo-700
    rounded-xl p-4 sm:p-6
    shadow-lg hover:shadow-xl
    transition-all duration-300
    transform hover:-translate-y-1
">
    <div className="flex items-center justify-between mb-2">
        <IconName className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
        <span className="text-xs sm:text-sm text-white/70">Label</span>
    </div>
    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
        {value}
    </div>
</div>
```

### 6. Tablas Responsivas

```jsx
// ✅ Usar ReusableTable con scroll horizontal en móvil
<div className="overflow-x-auto">
    <ReusableTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
    />
</div>

// ✅ O tabla nativa responsive
<div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table content */}
    </table>
</div>
```

### 7. Modales

```jsx
// ✅ Usar ReusableModal
<ReusableModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title="Título del Modal"
    size="lg"  // sm, md, lg, xl
>
    {/* Contenido del modal */}
</ReusableModal>
```

### 8. Toasts/Notificaciones

```jsx
// ✅ Usar Sonner (moderno)
import { toast } from 'sonner';

toast.success("Operación exitosa");
toast.error("Error en la operación");
toast.info("Información");
toast.warning("Advertencia");

// ❌ NO usar alerts nativos
alert("Mensaje");  // EVITAR
```

---

## 📱 Guía de Responsividad

### Mobile (< 640px)
```jsx
<div className="
    p-4              // Padding reducido
    text-sm          // Texto pequeño
    grid-cols-1      // 1 columna
    gap-4            // Gap pequeño
">
```

### Tablet (640px - 1024px)
```jsx
<div className="
    sm:p-6           // Padding medio
    sm:text-base     // Texto normal
    sm:grid-cols-2   // 2 columnas
    sm:gap-6         // Gap medio
">
```

### Laptop (1024px - 1280px)
```jsx
<div className="
    lg:p-8           // Padding grande
    lg:text-lg       // Texto grande
    lg:grid-cols-4   // 4 columnas
    lg:gap-8         // Gap grande
">
```

### Desktop/TV (> 1280px)
```jsx
<div className="
    xl:p-10          // Padding extra grande
    xl:text-xl       // Texto extra grande
    2xl:grid-cols-6  // 6 columnas (TVs)
    2xl:gap-10       // Gap extra grande
">
```

---

## 🎨 Paleta de Colores Estándar

### Gradientes de Cards
```jsx
// Azul
from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700

// Verde
from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700

// Naranja
from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700

// Púrpura
from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700

// Cyan
from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700
```

### Fondos
```jsx
// Página
bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900

// Card/Panel
bg-white dark:bg-gray-800

// Hover
hover:bg-gray-50 dark:hover:bg-gray-700
```

### Textos
```jsx
// Principal
text-gray-900 dark:text-white

// Secundario
text-gray-600 dark:text-gray-300

// Terciario
text-gray-500 dark:text-gray-400
```

---

## 📊 Estado de Páginas

### ✅ Páginas Actualizadas (Patrón Moderno)
1. `/tesoreria/cuentas-bancarias` ⭐
2. `/tesoreria/egresos` ⭐
3. `/tesoreria/cajas-chicas` ⭐
4. `/tesoreria/contrarecibos` ⭐
5. `/tesoreria/programaciones` ⭐

### ⚠️ Páginas que Necesitan Actualización
**Total estimado**: ~98 páginas

#### Prioridad Alta (Módulos principales)
1. `/contabilidad/clientes`
2. `/contabilidad/proyectos`
3. `/contabilidad/polizas`
4. `/rrhh/empleados`
5. `/rrhh/nomina`
6. `/compras/proveedores`
7. `/compras/ordenes`
8. `/pos/terminal`
9. `/pos/productos`
10. `/sistemas/usuarios`

#### Prioridad Media
- Resto de páginas de Contabilidad
- Resto de páginas de RRHH
- Resto de páginas de Compras
- Resto de páginas de POS

#### Prioridad Baja
- Páginas de configuración
- Páginas de reportes
- Páginas administrativas

---

## 🔧 Plan de Estandarización

### Fase 1: Componentes Base (Completado ✅)
- [x] Button component
- [x] Input component
- [x] Select component
- [x] Modal component
- [x] Table component
- [x] Toast system (Sonner)

### Fase 2: Actualización de Páginas Críticas
**Tiempo estimado**: 2-3 días

1. **Día 1**: Contabilidad (10 páginas)
   - Clientes
   - Proyectos
   - Polizas
   - Cuentas Contables
   - Centros de Costos
   - Monedas
   - UPEs
   - TC Manual
   - TC Banxico
   - Facturación

2. **Día 2**: RRHH y Compras (10 páginas)
   - Empleados
   - Departamentos
   - Puestos
   - Nómina
   - Esquemas Comisión
   - Proveedores
   - Insumos
   - Órdenes de Compra
   - Dashboard Compras
   - Expedientes

3. **Día 3**: POS y Sistemas (10 páginas)
   - Terminal POS
   - Productos
   - Ventas
   - Turnos
   - Cuentas Clientes
   - Usuarios
   - Roles y Permisos
   - Auditoría
   - Inventario IT
   - Configuración

### Fase 3: Resto de Páginas
**Tiempo estimado**: 3-4 días

- Actualizar páginas restantes por módulo
- Verificar responsividad en todos los breakpoints
- Probar dark mode en todas las páginas

### Fase 4: Testing y QA
**Tiempo estimado**: 1 día

- [ ] Pruebas en móvil (iPhone, Android)
- [ ] Pruebas en tablet (iPad, Android tablet)
- [ ] Pruebas en laptop (1366x768, 1920x1080)
- [ ] Pruebas en desktop (2560x1440)
- [ ] Pruebas en TV (3840x2160)
- [ ] Verificar dark mode en todos los dispositivos
- [ ] Verificar transiciones y animaciones

---

## 📝 Checklist de Actualización por Página

Para cada página, verificar:

### Imports
- [ ] `'use client'` al inicio
- [ ] `toast` de `sonner` (no alerts)
- [ ] Iconos de `lucide-react`
- [ ] Componentes UI de `@/components/ui/`
- [ ] `ReusableTable` y `ReusableModal`

### Estilos
- [ ] Gradiente de fondo con dark mode
- [ ] Padding responsive (p-4 sm:p-6 lg:p-8)
- [ ] Texto responsive (text-sm sm:text-base lg:text-lg)
- [ ] Grid responsive (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
- [ ] Gap responsive (gap-4 sm:gap-6 lg:gap-8)

### Componentes
- [ ] Botones con componente `Button`
- [ ] Inputs con componente `Input`
- [ ] Selects con componente `Select`
- [ ] Modales con `ReusableModal`
- [ ] Tablas con `ReusableTable`

### Dark Mode
- [ ] Todos los backgrounds tienen dark variant
- [ ] Todos los textos tienen dark variant
- [ ] Todos los borders tienen dark variant
- [ ] Gradientes tienen dark variant

### Responsividad
- [ ] Funciona en móvil (< 640px)
- [ ] Funciona en tablet (640px - 1024px)
- [ ] Funciona en laptop (1024px - 1280px)
- [ ] Funciona en desktop (> 1280px)
- [ ] Funciona en TV (> 1536px)

### Accesibilidad
- [ ] Labels en todos los inputs
- [ ] Alt text en imágenes
- [ ] Aria labels donde sea necesario
- [ ] Navegación por teclado funcional

---

## 🚀 Script de Migración Automática

Voy a crear un script que ayude a migrar páginas automáticamente:

```bash
# Script: migrate-page.sh
# Uso: ./migrate-page.sh path/to/page.jsx
```

---

## 📊 Métricas de Progreso

### Estado Actual
- **Páginas totales**: 103
- **Páginas actualizadas**: 5 (5%)
- **Páginas pendientes**: 98 (95%)

### Objetivo
- **Meta**: 100% de páginas estandarizadas
- **Tiempo estimado**: 7-8 días de trabajo
- **Prioridad**: Alta

---

## 🎯 Próximos Pasos

1. **Inmediato**: Crear template de página estándar
2. **Corto plazo**: Actualizar 10 páginas críticas
3. **Mediano plazo**: Actualizar resto de páginas
4. **Largo plazo**: Automatizar verificación de estándares

---

**Fecha de creación**: 27 de Diciembre 2025  
**Última actualización**: 27 de Diciembre 2025  
**Versión**: 1.0
