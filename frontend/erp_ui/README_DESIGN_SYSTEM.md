# 🎨 Sistema de Diseño - Atomic Design + Mobile First

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Atomic Design](#atomic-design)
- [Mobile First](#mobile-first)
- [Guías y Recursos](#guías-y-recursos)
- [Ejemplos de Uso](#ejemplos-de-uso)

## 🎯 Introducción

Este proyecto implementa **Atomic Design** y **Mobile First** como metodologías principales de desarrollo frontend. Esto garantiza:

- ✅ **Componentes reutilizables** y mantenibles
- ✅ **Diseño responsive** optimizado para todos los dispositivos
- ✅ **Consistencia visual** en toda la aplicación
- ✅ **Desarrollo más rápido** mediante composición
- ✅ **Mejor experiencia de usuario** en móviles

## 📁 Estructura del Proyecto

```
frontend/erp_ui/
├── components/
│   ├── atoms/              # Componentes básicos indivisibles
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── README.md
│   │
│   ├── molecules/          # Combinaciones simples de átomos
│   │   ├── SearchBar.jsx
│   │   ├── FormField.jsx
│   │   └── README.md
│   │
│   ├── organisms/          # Componentes complejos
│   │   ├── DataTable.jsx
│   │   ├── Sidebar.jsx
│   │   └── README.md
│   │
│   ├── templates/          # Layouts de página
│   │   ├── DashboardTemplate.jsx
│   │   ├── ListTemplate.jsx
│   │   └── README.md
│   │
│   ├── ui/                 # Componentes de shadcn/ui (legacy)
│   ├── layout/             # Componentes de layout (legacy)
│   ├── modals/             # Modales (a migrar)
│   └── charts/             # Gráficos (a migrar)
│
├── app/                    # Páginas (Next.js App Router)
│   ├── globals.css         # Estilos globales + utilities
│   └── ...
│
├── lib/
│   ├── designTokens.js     # Tokens de diseño centralizados
│   └── ...
│
├── MIGRATION_GUIDE.md      # Guía de migración
├── EXAMPLE_PAGE.jsx        # Ejemplo de uso completo
└── README_DESIGN_SYSTEM.md # Este archivo
```

## 🧬 Atomic Design

### Jerarquía de Componentes

```
Páginas (Pages)
    ↓
Templates
    ↓
Organismos (Organisms)
    ↓
Moléculas (Molecules)
    ↓
Átomos (Atoms)
```

### 1️⃣ Atoms (Átomos)

**Componentes básicos e indivisibles**

- `Button` - Botones con variantes y tamaños
- `Input` - Campos de entrada de texto
- `Label` - Etiquetas de formulario
- `Badge` - Insignias de estado
- `Icon` - Iconos

**Características:**
- No se pueden dividir más
- Sin lógica de negocio
- Altamente configurables
- Reutilizables en cualquier contexto

**Ejemplo:**
```jsx
import Button from '@/components/atoms/Button';

<Button variant="primary" size="md" icon={Plus}>
  Nuevo Item
</Button>
```

### 2️⃣ Molecules (Moléculas)

**Combinaciones simples de átomos**

- `SearchBar` - Input + Icon + Clear Button
- `FormField` - Label + Input + Error Message
- `Card` - Container + Title + Content
- `StatusBadge` - Badge + Icon

**Características:**
- Combinan 2-5 átomos
- Funcionalidad específica
- Lógica simple (estado local)
- Reutilizables

**Ejemplo:**
```jsx
import SearchBar from '@/components/molecules/SearchBar';

<SearchBar
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Buscar..."
/>
```

### 3️⃣ Organisms (Organismos)

**Componentes complejos que forman secciones**

- `DataTable` - Tabla completa con búsqueda, paginación, acciones
- `Sidebar` - Navegación lateral completa
- `Header` - Cabecera con logo, nav, user menu
- `Modal` - Modales con header, body, footer

**Características:**
- Combinan átomos y moléculas
- Secciones completas de UI
- Lógica de negocio compleja
- Específicos del dominio

**Ejemplo:**
```jsx
import DataTable from '@/components/organisms/DataTable';

<DataTable
  data={items}
  columns={columns}
  actions={actions}
  mobileCardView={true}
/>
```

### 4️⃣ Templates (Plantillas)

**Layouts que definen estructura de páginas**

- `DashboardTemplate` - Layout para dashboards
- `ListTemplate` - Layout para listas
- `FormTemplate` - Layout para formularios
- `DetailTemplate` - Layout para vistas de detalle

**Características:**
- Definen estructura de página
- Usan placeholders/slots
- Sin datos reales
- Reutilizables para múltiples páginas

**Ejemplo:**
```jsx
import ListTemplate from '@/components/templates/ListTemplate';

<ListTemplate
  title="Inventario"
  actions={<Button>Nuevo</Button>}
  searchBar={<SearchBar />}
  dataTable={<DataTable />}
/>
```

### 5️⃣ Pages (Páginas)

**Instancias específicas de templates con datos reales**

Ubicadas en `app/` (Next.js App Router)

**Ejemplo:**
```jsx
// app/inventario/page.jsx
export default function InventarioPage() {
  const data = useFetchInventory();
  
  return (
    <ListTemplate
      title="Inventario IT"
      dataTable={<DataTable data={data} />}
    />
  );
}
```

## 📱 Mobile First

### Principios

1. **Diseña primero para móvil** (375px)
2. **Mejora progresivamente** para pantallas más grandes
3. **Touch-friendly** (mínimo 44x44px)
4. **Performance optimizada** para conexiones lentas

### Breakpoints

```css
/* Mobile:  0-639px   (base, sin prefijo) */
/* Tablet:  640px+    (sm:) */
/* Desktop: 1024px+   (lg:) */
/* Wide:    1280px+   (xl:) */
```

### Ejemplos de Uso

#### Tamaños Responsive
```jsx
// ❌ Incorrecto (Desktop First)
<div className="text-lg p-8">

// ✅ Correcto (Mobile First)
<div className="text-sm p-4 sm:text-base sm:p-6 lg:text-lg lg:p-8">
```

#### Layouts Responsive
```jsx
// ❌ Incorrecto
<div className="grid grid-cols-4">

// ✅ Correcto (Mobile First)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

#### Touch Targets
```jsx
// ❌ Incorrecto (muy pequeño para touch)
<button className="h-8 w-8">

// ✅ Correcto (mínimo 44px)
<button className="h-11 w-11 touch-target">
```

#### Vistas Alternativas
```jsx
// Cards en móvil, tabla en desktop
<div className="lg:hidden">
  <MobileCardView />
</div>
<div className="hidden lg:block">
  <DesktopTableView />
</div>
```

### Utilities CSS Disponibles

En `app/globals.css`:

```css
.container-responsive  /* Container con padding responsive */
.grid-responsive       /* Grid 1→2→3→4 columnas */
.text-responsive       /* Texto escalable */
.heading-responsive    /* Encabezados escalables */
.spacing-responsive    /* Padding responsive */
.touch-target          /* Mínimo 44x44px */
.mobile-only           /* Solo visible en móvil */
.desktop-only          /* Solo visible en desktop */
.tablet-up             /* Visible desde tablet */
.tablet-only           /* Solo visible en tablet */
```

## 🎨 Design Tokens

Tokens centralizados en `lib/designTokens.js`:

```javascript
import designTokens from '@/lib/designTokens';

// Breakpoints
designTokens.breakpoints.mobile   // '0px'
designTokens.breakpoints.tablet   // '640px'
designTokens.breakpoints.desktop  // '1024px'

// Spacing
designTokens.spacing.md           // '1rem' (16px)

// Touch Targets
designTokens.touchTarget.min      // '44px'

// Transitions
designTokens.transition.base      // '200ms cubic-bezier(...)'
```

## 📚 Guías y Recursos

### Documentación del Proyecto

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía completa de migración
- **[EXAMPLE_PAGE.jsx](./EXAMPLE_PAGE.jsx)** - Ejemplo de uso completo
- **[.agent/workflows/atomic-design-mobile-first.md](./.agent/workflows/atomic-design-mobile-first.md)** - Workflow de implementación

### Recursos Externos

- [Atomic Design - Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [Mobile First - Luke Wroblewski](https://www.lukew.com/ff/entry.asp?933)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Touch Target Sizes - WCAG](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## 🚀 Ejemplos de Uso

### Ejemplo 1: Botón Simple

```jsx
import Button from '@/components/atoms/Button';
import { Plus } from 'lucide-react';

<Button 
  variant="primary" 
  size="md" 
  icon={Plus}
  iconPosition="left"
>
  Nuevo Item
</Button>
```

### Ejemplo 2: Campo de Formulario

```jsx
import FormField from '@/components/molecules/FormField';

<FormField
  label="Nombre"
  placeholder="Ingresa el nombre"
  required
  error={errors.nombre}
/>
```

### Ejemplo 3: Tabla de Datos

```jsx
import DataTable from '@/components/organisms/DataTable';

<DataTable
  data={items}
  columns={[
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Precio', accessorKey: 'precio' },
  ]}
  actions={{
    onEdit: (row) => handleEdit(row),
    onDelete: (id) => handleDelete(id),
  }}
  mobileCardView={true}
/>
```

### Ejemplo 4: Página Completa

```jsx
import ListTemplate from '@/components/templates/ListTemplate';
import SearchBar from '@/components/molecules/SearchBar';
import DataTable from '@/components/organisms/DataTable';
import Button from '@/components/atoms/Button';

export default function InventarioPage() {
  return (
    <ListTemplate
      title="Inventario IT"
      description="Gestiona tu inventario"
      actions={<Button>Nuevo</Button>}
      searchBar={<SearchBar />}
      dataTable={<DataTable data={data} />}
    />
  );
}
```

## ✅ Checklist de Desarrollo

Al crear o refactorizar un componente:

- [ ] Clasificado correctamente (Atom/Molecule/Organism/Template)
- [ ] Estilos Mobile First aplicados
- [ ] Responsive en todos los breakpoints (375px, 768px, 1024px+)
- [ ] Touch targets >= 44x44px
- [ ] Props documentadas (JSDoc)
- [ ] Accesibilidad (ARIA labels, roles, keyboard nav)
- [ ] Design tokens usados (no valores hardcodeados)
- [ ] Probado en móvil, tablet y desktop
- [ ] Sin scroll horizontal
- [ ] Performance optimizada

## 🎯 Próximos Pasos

1. **Revisar** los componentes de ejemplo creados
2. **Migrar** componentes existentes siguiendo `MIGRATION_GUIDE.md`
3. **Probar** en diferentes dispositivos
4. **Iterar** y mejorar basándose en feedback

## 💡 Tips

- Siempre empieza diseñando para móvil
- Usa las utilities CSS predefinidas
- Mantén los componentes pequeños y enfocados
- Reutiliza antes de crear nuevos componentes
- Documenta las props de tus componentes
- Prueba en dispositivos reales, no solo en el navegador

---

**¿Preguntas?** Consulta la [Guía de Migración](./MIGRATION_GUIDE.md) o el [Ejemplo de Página](./EXAMPLE_PAGE.jsx).

¡Happy coding! 🚀
