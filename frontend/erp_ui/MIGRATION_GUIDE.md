# 📚 Guía de Migración a Atomic Design y Mobile First

## 🎯 Objetivo

Migrar los componentes existentes del proyecto a la nueva estructura de Atomic Design con enfoque Mobile First.

## 📊 Mapeo de Componentes Existentes

### Componentes Actuales → Nueva Estructura

#### `/components/ui/` → `/components/atoms/`
Estos son componentes básicos e indivisibles:

- ✅ `button.jsx` → Ya creado como `atoms/Button.jsx`
- ✅ `input.jsx` → Ya creado como `atoms/Input.jsx`
- `label.jsx` → `atoms/Label.jsx`
- `badge.jsx` → `atoms/Badge.jsx`
- `textarea.jsx` → `atoms/Textarea.jsx`

#### `/components/ui/` → `/components/molecules/`
Componentes que combinan átomos:

- ✅ `SearchBar` → Ya creado como `molecules/SearchBar.jsx`
- ✅ `FormField` → Ya creado como `molecules/FormField.jsx`
- `Pagination.jsx` → Puede quedarse en `ui/` o moverse a `molecules/`
- `Card.jsx` → `molecules/Card.jsx`

#### `/components/tables/` → `/components/organisms/`
Componentes complejos:

- ✅ `ReusableTable.jsx` → Ya creado como `organisms/DataTable.jsx`

#### `/components/layout/` → `/components/organisms/`
Componentes de layout:

- `Sidebar.jsx` → `organisms/Sidebar.jsx`
- `Header.jsx` → `organisms/Header.jsx` (si existe)

#### `/components/modals/` → `/components/organisms/`
Modales son organismos:

- Todos los modales → `organisms/modals/`

#### `/components/charts/` → `/components/organisms/`
Charts son organismos:

- Todos los charts → `organisms/charts/`

## 🔄 Proceso de Migración por Componente

### 1. Identificar el Tipo

**¿Es un Átomo?**
- ✅ No se puede dividir en componentes más pequeños
- ✅ No tiene lógica de negocio
- ✅ Es altamente reutilizable
- ✅ Ejemplos: Button, Input, Icon, Badge

**¿Es una Molécula?**
- ✅ Combina 2-5 átomos
- ✅ Tiene una funcionalidad específica
- ✅ Lógica simple (estado local básico)
- ✅ Ejemplos: SearchBar, FormField, Card

**¿Es un Organismo?**
- ✅ Combina átomos y moléculas
- ✅ Forma una sección completa
- ✅ Puede tener lógica compleja
- ✅ Ejemplos: DataTable, Sidebar, Modal

### 2. Aplicar Mobile First

Para cada componente, sigue estos pasos:

#### a) Estilos Base (Mobile)
```jsx
// ❌ Incorrecto
className="text-lg p-8"

// ✅ Correcto (Mobile First)
className="text-sm p-4 sm:text-base sm:p-6 lg:text-lg lg:p-8"
```

#### b) Touch Targets
```jsx
// ❌ Incorrecto
className="h-8 w-8"

// ✅ Correcto (Mínimo 44x44px para touch)
className="h-11 w-11 sm:h-10 sm:w-10"
```

#### c) Layouts Responsive
```jsx
// ❌ Incorrecto
<div className="grid grid-cols-4 gap-8">

// ✅ Correcto (Mobile First)
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
```

#### d) Vistas Alternativas
```jsx
// Para tablas: Cards en móvil, tabla en desktop
<div className="lg:hidden">
  {/* Vista de cards para móvil */}
</div>
<div className="hidden lg:block">
  {/* Vista de tabla para desktop */}
</div>
```

### 3. Refactorizar el Componente

#### Checklist de Refactorización

- [ ] **Mover a la carpeta correcta** (atoms/molecules/organisms)
- [ ] **Renombrar si es necesario** (nombres descriptivos)
- [ ] **Aplicar Mobile First** a todos los estilos
- [ ] **Usar design tokens** en lugar de valores hardcodeados
- [ ] **Agregar props de accesibilidad** (aria-labels, roles)
- [ ] **Documentar props** con comentarios JSDoc
- [ ] **Probar en diferentes tamaños** de pantalla
- [ ] **Actualizar imports** en archivos que lo usan

### 4. Actualizar Imports

Después de mover un componente, actualiza todos los imports:

```jsx
// ❌ Antes
import Button from '@/components/ui/button';

// ✅ Después
import Button from '@/components/atoms/Button';
```

## 📝 Ejemplo de Refactorización Completa

### Antes (No Mobile First)
```jsx
// components/ui/Card.jsx
export default function Card({ title, children }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
```

### Después (Mobile First + Atomic Design)
```jsx
// components/molecules/Card.jsx
'use client';

import React from 'react';

/**
 * Card Molecule - Tarjeta de contenido
 * 
 * @param {string} title - Título de la tarjeta
 * @param {React.ReactNode} children - Contenido de la tarjeta
 * @param {string} className - Clases CSS adicionales
 */
export default function Card({ 
  title, 
  children, 
  className = '' 
}) {
  return (
    <div 
      className={`
        bg-white dark:bg-gray-900
        p-4 sm:p-6 lg:p-8
        rounded-lg sm:rounded-xl
        shadow-md sm:shadow-lg
        transition-all duration-200
        ${className}
      `}
      role="article"
    >
      {title && (
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
          {title}
        </h2>
      )}
      <div className="text-sm sm:text-base">
        {children}
      </div>
    </div>
  );
}
```

## 🎨 Usando Design Tokens

```jsx
import designTokens from '@/lib/designTokens';

// En lugar de valores hardcodeados
const buttonStyle = {
  minHeight: designTokens.touchTarget.min,
  borderRadius: designTokens.borderRadius.lg,
  transition: designTokens.transition.base,
};
```

## 🚀 Utilities CSS Disponibles

Ya creadas en `globals.css`:

- `.container-responsive` - Container con padding responsive
- `.grid-responsive` - Grid de 1→2→3→4 columnas
- `.text-responsive` - Texto que escala
- `.heading-responsive` - Encabezados que escalan
- `.spacing-responsive` - Padding responsive
- `.touch-target` - Mínimo 44x44px
- `.mobile-only` - Solo visible en móvil
- `.desktop-only` - Solo visible en desktop
- `.tablet-up` - Visible desde tablet
- `.tablet-only` - Solo visible en tablet

## 📱 Testing Mobile First

### Herramientas de Testing

1. **Chrome DevTools**
   - F12 → Toggle Device Toolbar (Ctrl+Shift+M)
   - Probar en: iPhone SE, iPad, Desktop

2. **Responsive Design Mode**
   - Probar breakpoints: 375px, 640px, 1024px, 1280px

3. **Touch Testing**
   - Verificar que botones tengan mínimo 44x44px
   - Espaciado adecuado entre elementos clickeables

### Checklist de Testing

- [ ] ✅ Se ve bien en móvil (375px)
- [ ] ✅ Se ve bien en tablet (768px)
- [ ] ✅ Se ve bien en desktop (1024px+)
- [ ] ✅ Touch targets son >= 44x44px
- [ ] ✅ Texto es legible en todos los tamaños
- [ ] ✅ No hay scroll horizontal
- [ ] ✅ Imágenes son responsive
- [ ] ✅ Formularios son usables en móvil

## 🎯 Prioridades de Migración

### Alta Prioridad
1. ✅ Button (Completado)
2. ✅ Input (Completado)
3. ✅ SearchBar (Completado)
4. ✅ FormField (Completado)
5. ✅ DataTable (Completado)

### Media Prioridad
6. Card
7. Badge
8. Label
9. Textarea
10. Sidebar

### Baja Prioridad
11. Modales
12. Charts
13. Loaders
14. Features específicas

## 📚 Recursos Adicionales

- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)
- [Mobile First Design](https://www.lukew.com/ff/entry.asp?933)
- [Touch Target Sizes](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Design Patterns](https://responsivedesign.is/patterns/)

## 💡 Tips y Mejores Prácticas

1. **Siempre empieza con móvil** - Diseña primero para la pantalla más pequeña
2. **Usa clases de Tailwind responsive** - `sm:`, `md:`, `lg:`, `xl:`
3. **Touch-friendly** - Mínimo 44x44px para elementos interactivos
4. **Testa en dispositivos reales** - No solo en el navegador
5. **Accesibilidad** - Usa ARIA labels y roles semánticos
6. **Performance** - Optimiza imágenes y lazy loading
7. **Consistencia** - Usa design tokens en lugar de valores hardcodeados

---

¡Buena suerte con la migración! 🚀
