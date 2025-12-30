# 🔄 Ejemplos de Refactorización

Este documento muestra cómo refactorizar componentes existentes del proyecto para seguir Atomic Design y Mobile First.

## Ejemplo 1: Refactorizar un Botón

### ❌ Antes (Código Actual)

```jsx
// Uso disperso en el código
<button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
  Guardar
</button>

<button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
  Editar
</button>

// Inconsistente, no mobile-friendly, no reutilizable
```

### ✅ Después (Atomic Design + Mobile First)

```jsx
// components/atoms/Button.jsx ya está creado

// Uso consistente
import Button from '@/components/atoms/Button';

<Button variant="primary" size="md">
  Guardar
</Button>

<Button variant="secondary" size="md">
  Editar
</Button>

// Consistente, mobile-friendly (44px height), reutilizable
```

---

## Ejemplo 2: Refactorizar un Campo de Formulario

### ❌ Antes

```jsx
// Código repetitivo en cada formulario
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Nombre
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border rounded"
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
  />
  {errors.nombre && (
    <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
  )}
</div>
```

### ✅ Después

```jsx
import FormField from '@/components/molecules/FormField';

<FormField
  label="Nombre"
  value={nombre}
  onChange={(e) => setNombre(e.target.value)}
  error={errors.nombre}
  required
/>

// Menos código, más consistente, mobile-friendly
```

---

## Ejemplo 3: Refactorizar ReusableTable

### ❌ Antes

```jsx
// app/sistemas/inventario/page.jsx
import ReusableTable from '@/components/tables/ReusableTable';

export default function InventarioPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventario IT</h1>
      
      <ReusableTable
        data={items}
        columns={columns}
        actions={actions}
      />
    </div>
  );
}

// No usa template, no es mobile-first
```

### ✅ Después

```jsx
// app/sistemas/inventario/page.jsx
import ListTemplate from '@/components/templates/ListTemplate';
import DataTable from '@/components/organisms/DataTable';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';
import { Plus } from 'lucide-react';

export default function InventarioPage() {
  const [search, setSearch] = useState('');
  
  return (
    <ListTemplate
      title="Inventario IT"
      description="Gestiona el inventario de equipos tecnológicos"
      
      actions={
        <Button variant="primary" icon={Plus}>
          Nuevo Item
        </Button>
      }
      
      searchBar={
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      }
      
      dataTable={
        <DataTable
          data={items}
          columns={columns}
          actions={actions}
          mobileCardView={true} // Cards en móvil!
        />
      }
    />
  );
}

// Usa template, componentes atómicos, mobile-first
```

---

## Ejemplo 4: Refactorizar una Página de Formulario

### ❌ Antes

```jsx
// app/sistemas/inventario/editar/[id]/page.jsx
export default function EditarPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Editar Item</h1>
      
      <form className="space-y-4">
        <div>
          <label>Nombre</label>
          <input type="text" className="w-full border px-3 py-2" />
        </div>
        
        <div>
          <label>Categoría</label>
          <select className="w-full border px-3 py-2">
            <option>Electrónica</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-4 py-2">
            Guardar
          </button>
          <button className="bg-gray-500 text-white px-4 py-2">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
```

### ✅ Después

```jsx
// Primero, crear FormTemplate si no existe
// components/templates/FormTemplate.jsx
export default function FormTemplate({
  title,
  description,
  onSubmit,
  children,
  actions,
}) {
  return (
    <div className="container-responsive">
      <header className="mb-6 sm:mb-8">
        <h1 className="heading-responsive">{title}</h1>
        {description && (
          <p className="text-responsive text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </header>
      
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        {children}
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {actions}
        </div>
      </form>
    </div>
  );
}

// Luego, usar en la página
// app/sistemas/inventario/editar/[id]/page.jsx
import FormTemplate from '@/components/templates/FormTemplate';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';

export default function EditarPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // lógica de guardado
  };
  
  return (
    <FormTemplate
      title="Editar Item"
      description="Modifica la información del item de inventario"
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" variant="primary" fullWidth>
            Guardar Cambios
          </Button>
          <Button type="button" variant="outline" fullWidth>
            Cancelar
          </Button>
        </>
      }
    >
      <FormField
        label="Nombre"
        name="nombre"
        required
        error={errors.nombre}
      />
      
      <FormField
        label="Categoría"
        name="categoria"
        type="select"
        options={categorias}
        required
      />
      
      <FormField
        label="Cantidad"
        name="cantidad"
        type="number"
        required
      />
      
      <FormField
        label="Precio"
        name="precio"
        type="number"
        step="0.01"
        required
      />
    </FormTemplate>
  );
}

// Mobile-first, componentes reutilizables, consistente
```

---

## Ejemplo 5: Refactorizar Grid de Cards

### ❌ Antes

```jsx
<div className="grid grid-cols-4 gap-8">
  {items.map(item => (
    <div key={item.id} className="bg-white p-6 rounded shadow">
      <h3 className="text-xl font-bold">{item.title}</h3>
      <p>{item.description}</p>
    </div>
  ))}
</div>

// No responsive, desktop-first
```

### ✅ Después

```jsx
// Primero crear el componente Card
// components/molecules/Card.jsx
export default function Card({ title, description, children, className = '' }) {
  return (
    <div className={`
      bg-white dark:bg-gray-900
      p-4 sm:p-6
      rounded-lg sm:rounded-xl
      shadow-md hover:shadow-lg
      transition-all duration-200
      ${className}
    `}>
      {title && (
        <h3 className="text-lg sm:text-xl font-bold mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

// Luego usar con grid responsive
import Card from '@/components/molecules/Card';

<div className="grid-responsive">
  {items.map(item => (
    <Card
      key={item.id}
      title={item.title}
      description={item.description}
    />
  ))}
</div>

// Mobile-first: 1 col → 2 cols → 3 cols → 4 cols
```

---

## Ejemplo 6: Refactorizar Modal

### ❌ Antes

```jsx
// Modal sin mobile optimization
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg w-[600px]">
      <h2 className="text-2xl mb-4">Confirmar</h2>
      <p>¿Estás seguro?</p>
      <div className="flex gap-4 mt-6">
        <button onClick={onConfirm}>Sí</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  </div>
)}
```

### ✅ Después

```jsx
// components/organisms/Modal.jsx
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-modal bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="
          bg-white dark:bg-gray-900
          w-full sm:w-auto sm:min-w-[400px] sm:max-w-[600px]
          rounded-t-2xl sm:rounded-2xl
          p-6 sm:p-8
          max-h-[90vh] overflow-y-auto
          animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95
        "
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            {title}
          </h2>
        )}
        
        <div className="text-sm sm:text-base mb-6">
          {children}
        </div>
        
        {actions && (
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Uso
import Modal from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmar Acción"
  actions={
    <>
      <Button variant="outline" fullWidth onClick={onCancel}>
        Cancelar
      </Button>
      <Button variant="destructive" fullWidth onClick={onConfirm}>
        Confirmar
      </Button>
    </>
  }
>
  <p>¿Estás seguro de que deseas eliminar este item?</p>
</Modal>

// Mobile: slide from bottom, full width
// Desktop: centered, max-width
```

---

## Ejemplo 7: Refactorizar Sidebar

### ❌ Antes

```jsx
// components/layout/Sidebar.jsx (simplificado)
<aside className="w-64 bg-gray-900 h-screen">
  <nav>
    <a href="/dashboard">Dashboard</a>
    <a href="/inventario">Inventario</a>
  </nav>
</aside>

// No mobile-friendly, siempre visible
```

### ✅ Después

```jsx
// components/organisms/Sidebar.jsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/atoms/Button';

export default function Sidebar({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="md"
        icon={Menu}
        className="lg:hidden fixed top-4 left-4 z-sticky"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      />
      
      {/* Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-modalBackdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0
        h-screen
        w-[280px] lg:w-64
        bg-gray-900
        transform transition-transform duration-300
        z-modal lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close Button (Mobile) */}
        <Button
          variant="ghost"
          size="md"
          icon={X}
          className="lg:hidden absolute top-4 right-4"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menú"
        />
        
        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {items.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="
                block p-3 rounded-lg
                text-white hover:bg-gray-800
                transition-colors duration-200
                touch-target
              "
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}

// Mobile: drawer que se desliza
// Desktop: sidebar fijo
```

---

## 🎯 Patrón de Migración General

### Paso 1: Identificar el componente
- ¿Qué hace?
- ¿Qué tipo es? (Atom/Molecule/Organism)

### Paso 2: Crear versión Mobile First
```jsx
// Siempre empieza con estilos móviles
className="
  text-sm p-4           // Mobile (base)
  sm:text-base sm:p-6   // Tablet
  lg:text-lg lg:p-8     // Desktop
"
```

### Paso 3: Asegurar Touch Targets
```jsx
// Mínimo 44x44px para elementos interactivos
className="h-11 w-11 touch-target"
```

### Paso 4: Vistas Alternativas si es necesario
```jsx
// Cards en móvil, tabla en desktop
<div className="lg:hidden">
  <MobileView />
</div>
<div className="hidden lg:block">
  <DesktopView />
</div>
```

### Paso 5: Usar Design Tokens
```jsx
import designTokens from '@/lib/designTokens';

// En lugar de valores hardcodeados
style={{
  minHeight: designTokens.touchTarget.min,
  transition: designTokens.transition.base,
}}
```

### Paso 6: Documentar
```jsx
/**
 * ComponentName - Descripción breve
 * 
 * @param {string} prop1 - Descripción
 * @param {boolean} prop2 - Descripción
 */
```

### Paso 7: Probar
- [ ] Móvil (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px+)
- [ ] Touch interactions
- [ ] Accesibilidad

---

## 💡 Tips de Refactorización

1. **No hagas todo a la vez** - Migra componente por componente
2. **Mantén compatibilidad** - Deja componentes legacy hasta terminar migración
3. **Prueba constantemente** - Verifica en móvil después de cada cambio
4. **Documenta cambios** - Actualiza PROGRESS.md
5. **Usa aliases de import** - `@/components/atoms/Button` es más claro
6. **Reutiliza antes de crear** - Revisa si ya existe un componente similar

---

¡Buena suerte con la refactorización! 🚀
