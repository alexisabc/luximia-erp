# Guía de Componentes - Atomic Design & Mobile First

## 📚 Índice

1. [Átomos](#átomos)
2. [Moléculas](#moléculas)
3. [Organismos](#organismos)
4. [Templates](#templates)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Átomos

### Button
Botón base con múltiples variantes y tamaños Mobile First.

```jsx
import { Button } from '@/components/atoms';
import { Save } from 'lucide-react';

<Button variant="primary" size="md" icon={Save}>
  Guardar
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `fullWidth`: boolean
- `loading`: boolean
- `icon`: Componente de icono Lucide
- `iconPosition`: 'left' | 'right'

### Avatar
Componente para mostrar avatares de usuario.

```jsx
import { Avatar } from '@/components/atoms';

<Avatar 
  src="/path/to/image.jpg"
  fallback="JP"
  size="md"
  shape="circle"
/>
```

**Props:**
- `src`: URL de la imagen
- `fallback`: Texto de respaldo (iniciales)
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `shape`: 'circle' | 'square' | 'rounded'

### Spinner
Indicador de carga animado.

```jsx
import { Spinner } from '@/components/atoms';

<Spinner size="md" variant="primary" />
```

**Props:**
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `variant`: 'primary' | 'secondary' | 'muted' | 'white'

### Divider
Separador visual horizontal o vertical.

```jsx
import { Divider } from '@/components/atoms';

<Divider label="Sección" variant="solid" spacing="md" />
```

**Props:**
- `orientation`: 'horizontal' | 'vertical'
- `variant`: 'solid' | 'dashed' | 'dotted'
- `spacing`: 'sm' | 'md' | 'lg'
- `label`: Texto opcional

---

## Moléculas

### KpiCard
Tarjeta para mostrar KPIs con tendencias.

```jsx
import { KpiCard } from '@/components/molecules';
import { DollarSign } from 'lucide-react';

<KpiCard
  title="Ventas Totales"
  value={125000}
  prefix="$"
  trend={12.5}
  icon={DollarSign}
  variant="success"
/>
```

**Props:**
- `title`: Título del KPI
- `value`: Valor numérico
- `prefix`: Prefijo (ej: '$', '%')
- `suffix`: Sufijo
- `trend`: Porcentaje de cambio
- `icon`: Componente de icono
- `variant`: 'default' | 'success' | 'warning' | 'danger'
- `compact`: Versión compacta para móvil

### StatCard
Tarjeta de estadística con icono y cambio porcentual.

```jsx
import { StatCard } from '@/components/molecules';
import { Users } from 'lucide-react';

<StatCard
  title="Usuarios Activos"
  value="2,350"
  icon={Users}
  change={20.1}
  changeLabel="vs mes anterior"
  variant="primary"
/>
```

**Props:**
- `title`: Título
- `value`: Valor (string o número)
- `icon`: Componente de icono
- `change`: Cambio porcentual
- `changeLabel`: Etiqueta del cambio
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `loading`: Estado de carga

### ActionCard
Tarjeta de acción rápida con navegación.

```jsx
import { ActionCard } from '@/components/molecules';
import { ShoppingCart } from 'lucide-react';

<ActionCard
  title="Crear Orden"
  description="Registra una nueva orden de venta"
  icon={ShoppingCart}
  onClick={() => console.log('Click')}
  variant="primary"
/>
```

**Props:**
- `title`: Título
- `description`: Descripción opcional
- `icon`: Componente de icono
- `onClick`: Función callback
- `href`: URL de navegación
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `disabled`: Estado deshabilitado

---

## Organismos

### Header
Cabecera de aplicación con navegación, búsqueda y perfil.

```jsx
import { Header } from '@/components/organisms';

<Header
  onMenuClick={() => setMenuOpen(true)}
  onSearchSubmit={(query) => console.log(query)}
  notificationCount={3}
  user={{ name: 'Juan Pérez', avatar: '/avatar.jpg' }}
  showSearch={true}
/>
```

**Props:**
- `onMenuClick`: Callback para abrir menú
- `onSearchSubmit`: Callback de búsqueda
- `notificationCount`: Número de notificaciones
- `user`: Datos del usuario
- `showSearch`: Mostrar barra de búsqueda

### NavigationSidebar
Barra lateral de navegación con menú jerárquico.

```jsx
import { NavigationSidebar } from '@/components/organisms';
import { Home, Settings } from 'lucide-react';

const navItems = [
  { label: 'Inicio', href: '/', icon: Home },
  { 
    label: 'Configuración', 
    icon: Settings,
    children: [
      { label: 'General', href: '/config/general' },
      { label: 'Usuarios', href: '/config/users' }
    ]
  }
];

<NavigationSidebar
  items={navItems}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Props:**
- `items`: Array de items de navegación
- `isOpen`: Estado abierto (móvil)
- `onClose`: Callback al cerrar

---

## Templates

### DashboardTemplate
Plantilla completa para páginas de dashboard.

```jsx
import DashboardTemplate from '@/components/templates/DashboardTemplate';

<DashboardTemplate
  navItems={navItems}
  user={user}
  notificationCount={3}
  title="Mi Dashboard"
>
  {/* Contenido aquí */}
</DashboardTemplate>
```

### FormPageTemplate
Plantilla optimizada para formularios.

```jsx
import FormPageTemplate from '@/components/templates/FormPageTemplate';

<FormPageTemplate
  title="Crear Usuario"
  description="Completa el formulario"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  loading={isLoading}
>
  {/* Campos del formulario */}
</FormPageTemplate>
```

### ListPageTemplate
Plantilla para páginas de listado con filtros.

```jsx
import ListPageTemplate from '@/components/templates/ListPageTemplate';

<ListPageTemplate
  title="Usuarios"
  onSearch={handleSearch}
  onCreate={handleCreate}
  onExport={handleExport}
  filters={<FilterComponent />}
  stats={<StatsComponent />}
>
  {/* Lista o tabla */}
</ListPageTemplate>
```

---

## Ejemplos de Uso

### Dashboard Completo

```jsx
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import { KpiCard, StatCard } from '@/components/molecules';
import { DollarSign, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <DashboardTemplate title="Dashboard Principal">
      <div className="grid-responsive">
        <KpiCard
          title="Ventas"
          value={125000}
          prefix="$"
          trend={12.5}
          icon={DollarSign}
        />
        <StatCard
          title="Usuarios"
          value="2,350"
          icon={Users}
          change={20.1}
        />
      </div>
    </DashboardTemplate>
  );
}
```

### Formulario Responsive

```jsx
import FormPageTemplate from '@/components/templates/FormPageTemplate';
import { Input, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';

export default function CreateUserPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de envío
  };

  return (
    <FormPageTemplate
      title="Crear Usuario"
      onSubmit={handleSubmit}
      onBack={() => router.back()}
    >
      <FormField label="Nombre" required>
        <Input placeholder="Ingresa el nombre" />
      </FormField>
      <FormField label="Email" required>
        <Input type="email" placeholder="email@ejemplo.com" />
      </FormField>
    </FormPageTemplate>
  );
}
```

---

## 📱 Principios Mobile First

Todos los componentes siguen estos principios:

1. **Estilos base para móvil** - Sin prefijos de breakpoint
2. **Media queries progresivas** - `sm:`, `lg:`, `xl:`
3. **Touch-friendly** - Botones mínimo 44x44px
4. **Responsive por defecto** - Adaptación automática
5. **Performance optimizada** - Carga rápida en móviles

### Breakpoints

```css
/* Mobile:  0-639px (base, sin prefijo) */
/* Tablet:  640px+ (sm:) */
/* Desktop: 1024px+ (lg:) */
/* Wide:    1280px+ (xl:) */
```

### Clases Utilitarias

```jsx
// Contenedor responsive
<div className="container-responsive">

// Grid responsive
<div className="grid-responsive">

// Texto responsive
<h1 className="heading-responsive">

// Espaciado responsive
<div className="spacing-responsive">

// Visibilidad condicional
<div className="mobile-only">
<div className="desktop-only">
```

---

## 🎨 Variantes de Color

Todos los componentes soportan estas variantes:

- `default` - Gris neutro
- `primary` - Color primario del tema
- `success` - Verde (éxito)
- `warning` - Amarillo (advertencia)
- `danger` - Rojo (error)

---

## 📝 Mejores Prácticas

1. **Usa componentes atómicos** para construir interfaces consistentes
2. **Combina moléculas** para crear secciones complejas
3. **Aprovecha templates** para páginas completas
4. **Piensa Mobile First** al diseñar layouts
5. **Mantén la jerarquía** de Atomic Design

---

## 🔗 Ver Ejemplo Completo

Visita `/portal/components-example` para ver todos los componentes en acción.
