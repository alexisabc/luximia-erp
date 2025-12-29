---
description: Guía de implementación de Atomic Design y Mobile First
---

# 🎨 Implementación de Atomic Design y Mobile First

## 📐 Estructura de Atomic Design

### Atoms (Átomos)
Componentes básicos e indivisibles:
- `Button`, `Input`, `Label`, `Badge`, `Icon`
- Ubicación: `components/atoms/`

### Molecules (Moléculas)
Combinaciones simples de átomos:
- `SearchBar`, `FormField`, `ActionButton`, `StatusBadge`
- Ubicación: `components/molecules/`

### Organisms (Organismos)
Componentes complejos que forman secciones:
- `Header`, `Sidebar`, `DataTable`, `FormSection`, `CardGrid`
- Ubicación: `components/organisms/`

### Templates (Plantillas)
Layouts que definen la estructura de páginas:
- `DashboardTemplate`, `FormTemplate`, `ListTemplate`
- Ubicación: `components/templates/`

### Pages (Páginas)
Instancias específicas de templates con datos reales:
- Ubicación: `app/` (Next.js App Router)

## 📱 Mobile First

### Breakpoints Estándar
```css
/* Mobile: 0-639px (por defecto) */
/* Tablet: 640px-1023px (sm:) */
/* Desktop: 1024px+ (lg:) */
/* Large Desktop: 1280px+ (xl:) */
```

### Reglas de Implementación

1. **Estilos base para móvil primero**
2. **Media queries progresivas** (min-width)
3. **Componentes responsivos** por defecto
4. **Touch-friendly** (botones mínimo 44x44px)
5. **Performance optimizada** para móviles

## 🔄 Proceso de Migración

### Fase 1: Preparación
1. Crear nueva estructura de carpetas
2. Definir design tokens
3. Configurar breakpoints en Tailwind

### Fase 2: Migración de Componentes
1. Identificar componentes existentes
2. Clasificarlos según Atomic Design
3. Refactorizar uno por uno
4. Aplicar Mobile First a cada uno

### Fase 3: Validación
1. Probar en diferentes dispositivos
2. Verificar accesibilidad
3. Optimizar rendimiento

## 📝 Checklist de Componente

Para cada componente nuevo o refactorizado:

- [ ] Clasificado correctamente (Atom/Molecule/Organism)
- [ ] Estilos Mobile First
- [ ] Responsive en todos los breakpoints
- [ ] Props documentadas
- [ ] Accesible (ARIA labels, keyboard navigation)
- [ ] Performance optimizada
- [ ] Reutilizable y composable
