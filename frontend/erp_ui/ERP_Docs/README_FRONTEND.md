# 🎨 Sistema ERP - Frontend

Sistema de gestión empresarial (ERP) con diseño moderno, responsive y optimizado para móviles.

## 🚀 Sistema de Diseño Atomic Design + Mobile First

Este proyecto utiliza **Atomic Design** y **Mobile First** como metodologías principales de desarrollo.

### 📖 Documentación

#### Documentación Rápida
- **[COMPONENTS_GUIDE.md](./components/COMPONENTS_GUIDE.md)** - Guía completa de componentes
- **[Página de Ejemplos](http://localhost:3000/portal/components-example)** - Ver componentes en acción

#### 📚 Documentación Completa
Para acceder a toda la documentación técnica, guías de migración, reportes y análisis:

👉 **[Ver Documentación Completa en ERP_Docs/](./ERP_Docs/README.md)**

La carpeta `ERP_Docs/` contiene:
- Reportes de migración y limpieza
- Guías de implementación
- Análisis de componentes legacy
- Documentación del sistema de diseño
- Y mucho más...

---

## 🏗️ Estructura del Proyecto

```
frontend/erp_ui/
├── app/                    # Páginas (Next.js App Router)
│   ├── globals.css         # Estilos globales + Mobile First utilities
│   ├── portal/
│   │   └── components-example/  # ✨ Página de ejemplos
│   └── ...
│
├── components/
│   ├── atoms/              # ✨ Componentes básicos
│   │   ├── Button.jsx      # Botón con variantes y tamaños
│   │   ├── Input.jsx       # Input touch-friendly
│   │   ├── Avatar.jsx      # Avatar de usuario
│   │   ├── Icon.jsx        # Wrapper de iconos
│   │   ├── Spinner.jsx     # Indicador de carga
│   │   ├── Divider.jsx     # Separador visual
│   │   └── ...
│   │
│   ├── molecules/          # ✨ Combinaciones de átomos
│   │   ├── SearchBar.jsx   # Búsqueda con loading
│   │   ├── FormField.jsx   # Campo completo de formulario
│   │   ├── KpiCard.jsx     # Tarjeta de KPI con tendencias
│   │   ├── StatCard.jsx    # Tarjeta de estadística
│   │   ├── ActionCard.jsx  # Tarjeta de acción rápida
│   │   └── ...
│   │
│   ├── organisms/          # ✨ Componentes complejos
│   │   ├── Header.jsx      # Cabecera responsive
│   │   ├── NavigationSidebar.jsx  # Menú lateral
│   │   ├── DataTable.jsx   # Tabla responsive
│   │   ├── Modal.jsx       # Modal
│   │   └── ...
│   │
│   ├── templates/          # ✨ Layouts de página
│   │   ├── DashboardTemplate.jsx   # Layout para dashboards
│   │   ├── ListPageTemplate.jsx    # Layout para listas
│   │   ├── FormPageTemplate.jsx    # Layout para formularios
│   │   ├── DetailPageTemplate.jsx  # Layout para detalles
│   │   └── ...
│   │
│   ├── ui/                 # Componentes de shadcn/ui
│   └── COMPONENTS_GUIDE.md # ✨ Guía completa de componentes
│
└── lib/
    └── ...
```

---

## 🎯 Inicio Rápido

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Ver Ejemplos de Componentes

Visita [http://localhost:3000/portal/components-example](http://localhost:3000/portal/components-example)

---

## 🎨 Sistema de Diseño

### Atomic Design

Componentes organizados en 5 niveles:

1. **Atoms** - Componentes básicos indivisibles (Button, Input, Avatar)
2. **Molecules** - Combinaciones simples de átomos (SearchBar, FormField, KpiCard)
3. **Organisms** - Componentes complejos (Header, NavigationSidebar, DataTable)
4. **Templates** - Layouts de página (DashboardTemplate, FormPageTemplate)
5. **Pages** - Páginas con datos reales

### Mobile First

Todos los componentes están diseñados primero para móvil y luego se adaptan a pantallas más grandes.

**Breakpoints:**
- **Mobile:** 0-639px (base, sin prefijo)
- **Tablet:** 640px+ (`sm:`)
- **Desktop:** 1024px+ (`lg:`)
- **Wide:** 1280px+ (`xl:`)

**Clases Utilitarias:**
```css
.container-responsive  /* Contenedor con padding responsive */
.grid-responsive       /* Grid que se adapta a pantalla */
.heading-responsive    /* Títulos responsive */
.spacing-responsive    /* Espaciado responsive */
.mobile-only           /* Visible solo en móvil */
.desktop-only          /* Visible solo en desktop */
```

---

## 📦 Componentes Disponibles

### Atoms (6 componentes)
- ✅ **Button** - 5 variantes, 4 tamaños, iconos, loading, fullWidth
- ✅ **Input** - Touch-friendly, validación, estados de error
- ✅ **Avatar** - Imágenes, fallback de iniciales, 5 tamaños, 3 formas
- ✅ **Icon** - Wrapper consistente para iconos Lucide
- ✅ **Spinner** - Indicador de carga animado, 5 tamaños, 4 variantes
- ✅ **Divider** - Separador horizontal/vertical con etiquetas opcionales

### Molecules (6 componentes)
- ✅ **SearchBar** - Búsqueda con loading, clear button, onSubmit, 3 tamaños
- ✅ **FormField** - Label + Input/Textarea/Select + Error, layout horizontal/vertical
- ✅ **KpiCard** - KPI con tendencias, iconos, variantes de color, modo compacto
- ✅ **StatCard** - Estadística con cambio porcentual, iconos, loading
- ✅ **ActionCard** - Acción rápida con navegación, iconos, variantes
- ✅ **Card** - Tarjeta base reutilizable

### Organisms (4 componentes)
- ✅ **Header** - Navegación responsive, búsqueda expandible, notificaciones, perfil
- ✅ **NavigationSidebar** - Menú jerárquico, overlay móvil, indicador de ruta activa
- ✅ **DataTable** - Tabla responsive con paginación
- ✅ **Modal** - Modal con animaciones

### Templates (6 templates)
- ✅ **DashboardTemplate** - Layout completo con Header + Sidebar + contenido
- ✅ **ListPageTemplate** - Layout para listas con búsqueda, filtros, acciones
- ✅ **FormPageTemplate** - Layout para formularios con validación
- ✅ **DetailPageTemplate** - Layout para detalles con tabs, breadcrumbs, acciones
- ✅ **ListTemplate** - Layout simple para listas
- ✅ **FormTemplate** - Layout simple para formularios

---

## 💡 Ejemplos de Uso

### Dashboard con KPIs

```jsx
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import { KpiCard, StatCard } from '@/components/molecules';
import { DollarSign, Users, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  return (
    <DashboardTemplate
      title="Dashboard Principal"
      navItems={navItems}
      user={user}
    >
      <div className="grid-responsive">
        <KpiCard
          title="Ventas Totales"
          value={125000}
          prefix="$"
          trend={12.5}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Usuarios Activos"
          value="2,350"
          icon={Users}
          change={20.1}
          changeLabel="vs mes anterior"
        />
      </div>
    </DashboardTemplate>
  );
}
```

### Formulario Responsive

```jsx
import FormPageTemplate from '@/components/templates/FormPageTemplate';
import { FormField } from '@/components/molecules';
import { User, Mail } from 'lucide-react';

export default function CreateUserPage() {
  return (
    <FormPageTemplate
      title="Crear Usuario"
      description="Completa el formulario para crear un nuevo usuario"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={isLoading}
    >
      <FormField
        label="Nombre Completo"
        icon={User}
        placeholder="Juan Pérez"
        required
        hint="Nombre y apellido del usuario"
      />
      <FormField
        label="Email"
        type="email"
        icon={Mail}
        placeholder="juan@ejemplo.com"
        required
        helperText="Se enviará un correo de confirmación"
      />
    </FormPageTemplate>
  );
}
```

### Lista con Búsqueda y Filtros

```jsx
import ListPageTemplate from '@/components/templates/ListPageTemplate';
import { ActionCard } from '@/components/molecules';
import { Package, Plus } from 'lucide-react';

export default function ProductsPage() {
  return (
    <ListPageTemplate
      title="Productos"
      description="Gestiona tu catálogo de productos"
      onSearch={handleSearch}
      onCreate={handleCreate}
      createLabel="Nuevo Producto"
      stats={<StatsSection />}
    >
      <div className="grid-responsive">
        {products.map(product => (
          <ActionCard
            key={product.id}
            title={product.name}
            description={product.description}
            icon={Package}
            onClick={() => navigate(`/products/${product.id}`)}
          />
        ))}
      </div>
    </ListPageTemplate>
  );
}
```

---

## 🔧 Tecnologías

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS v4
- **UI Components:** shadcn/ui + Atomic Design custom
- **Icons:** Lucide React
- **Design System:** Atomic Design + Mobile First

---

## 📊 Estado del Proyecto

```
✅ Atomic Design:        ████████░░ 80%
✅ Mobile First:         ████████░░ 80%
✅ Documentación:        ██████████ 100%
✅ Componentes Base:     ████████░░ 85%
🔄 Migración:            ███░░░░░░░ 30%
```

**Total:** 🟢 75% completado

### Componentes Creados

- ✅ 6 Atoms
- ✅ 6 Molecules
- ✅ 4 Organisms
- ✅ 6 Templates
- ✅ Página de ejemplos
- ✅ Guía completa de componentes

---

## 🤝 Contribuir

Al crear o modificar componentes:

1. **Sigue Atomic Design** - Clasifica correctamente tu componente
2. **Aplica Mobile First** - Estilos base para móvil, luego breakpoints
3. **Usa clases utilitarias** - `container-responsive`, `grid-responsive`, etc.
4. **Documenta props** - Usa JSDoc para documentar
5. **Prueba responsive** - Móvil (320px), Tablet (768px), Desktop (1024px+)
6. **Exporta correctamente** - Actualiza el archivo `index.js` correspondiente

### Checklist de Componente

- [ ] Clasificado correctamente (Atom/Molecule/Organism)
- [ ] Estilos Mobile First
- [ ] Responsive en todos los breakpoints
- [ ] Props documentadas con JSDoc
- [ ] Accesible (ARIA labels, keyboard navigation)
- [ ] Touch-friendly (mínimo 44x44px para botones)
- [ ] Exportado en `index.js`

---

## 📚 Recursos

- [COMPONENTS_GUIDE.md](./components/COMPONENTS_GUIDE.md) - Guía completa de componentes
- [Página de Ejemplos](http://localhost:3000/portal/components-example) - Ver en acción
- [Atomic Design - Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [Mobile First - Luke Wroblewski](https://www.lukew.com/ff/entry.asp?933)
- [Next.js Docs](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

¡Happy coding! 🚀
