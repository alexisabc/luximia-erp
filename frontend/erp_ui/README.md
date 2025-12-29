# 🎨 Sistema ERP - Frontend

Sistema de gestión empresarial (ERP) con diseño moderno, responsive y optimizado para móviles.

## 🚀 Nuevo: Sistema de Diseño Implementado

Este proyecto ahora utiliza **Atomic Design** y **Mobile First** como metodologías principales de desarrollo.

### 📖 Documentación Completa

**👉 [EMPIEZA AQUÍ: INDEX.md](./INDEX.md)** - Índice maestro de toda la documentación

#### Documentos Principales:

1. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** ⭐
   - Resumen de todo lo implementado
   - Componentes creados
   - Guía de inicio rápido

2. **[README_DESIGN_SYSTEM.md](./README_DESIGN_SYSTEM.md)**
   - Sistema de diseño completo
   - Atomic Design explicado
   - Mobile First guía

3. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**
   - Cómo migrar componentes existentes
   - Proceso paso a paso

4. **[REFACTORING_EXAMPLES.md](./REFACTORING_EXAMPLES.md)**
   - Ejemplos prácticos de refactorización
   - Antes y después

5. **[PROGRESS.md](./PROGRESS.md)**
   - Checklist de progreso
   - Estado de la migración

6. **[EXAMPLE_PAGE.jsx](./EXAMPLE_PAGE.jsx)**
   - Ejemplo de página completa
   - Código comentado

---

## 🏗️ Estructura del Proyecto

```
frontend/erp_ui/
├── app/                    # Páginas (Next.js App Router)
│   ├── globals.css         # Estilos globales + Mobile First utilities
│   └── ...
│
├── components/
│   ├── atoms/              # ✨ NUEVO: Componentes básicos
│   │   ├── Button.jsx
│   │   └── Input.jsx
│   │
│   ├── molecules/          # ✨ NUEVO: Combinaciones de átomos
│   │   ├── SearchBar.jsx
│   │   └── FormField.jsx
│   │
│   ├── organisms/          # ✨ NUEVO: Componentes complejos
│   │   └── DataTable.jsx   # Tabla responsive con vista de cards
│   │
│   ├── templates/          # ✨ NUEVO: Layouts de página
│   │   ├── DashboardTemplate.jsx
│   │   └── ListTemplate.jsx
│   │
│   └── ui/                 # Componentes de shadcn/ui (legacy)
│
├── lib/
│   ├── designTokens.js     # ✨ NUEVO: Sistema de tokens
│   └── ...
│
└── Documentación/          # ✨ NUEVO: Guías completas
    ├── INDEX.md
    ├── IMPLEMENTATION_SUMMARY.md
    ├── README_DESIGN_SYSTEM.md
    ├── MIGRATION_GUIDE.md
    ├── REFACTORING_EXAMPLES.md
    ├── PROGRESS.md
    └── EXAMPLE_PAGE.jsx
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

### Build

```bash
npm run build
```

---

## 🎨 Sistema de Diseño

### Atomic Design

Componentes organizados en 5 niveles:

1. **Atoms** - Componentes básicos (Button, Input)
2. **Molecules** - Combinaciones simples (SearchBar, FormField)
3. **Organisms** - Componentes complejos (DataTable, Sidebar)
4. **Templates** - Layouts de página (DashboardTemplate)
5. **Pages** - Páginas con datos reales

### Mobile First

Todos los componentes están diseñados primero para móvil y luego se adaptan a pantallas más grandes.

**Breakpoints:**
- Mobile: 0-639px (base)
- Tablet: 640px+ (sm:)
- Desktop: 1024px+ (lg:)
- Wide: 1280px+ (xl:)

---

## 📦 Componentes Disponibles

### Atoms
- ✅ **Button** - Botón con 5 variantes, 4 tamaños, iconos, loading
- ✅ **Input** - Input touch-friendly con validación

### Molecules
- ✅ **SearchBar** - Barra de búsqueda con clear button
- ✅ **FormField** - Campo completo con label, input, error

### Organisms
- ✅ **DataTable** - Tabla responsive (cards en móvil, tabla en desktop)

### Templates
- ✅ **DashboardTemplate** - Layout para dashboards
- ✅ **ListTemplate** - Layout para listas

---

## 💡 Ejemplo de Uso

```jsx
import ListTemplate from '@/components/templates/ListTemplate';
import DataTable from '@/components/organisms/DataTable';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';
import { Plus } from 'lucide-react';

export default function InventarioPage() {
  return (
    <ListTemplate
      title="Inventario IT"
      description="Gestiona tu inventario"
      
      actions={
        <Button variant="primary" icon={Plus}>
          Nuevo Item
        </Button>
      }
      
      searchBar={<SearchBar />}
      
      dataTable={
        <DataTable
          data={items}
          columns={columns}
          mobileCardView={true}
        />
      }
    />
  );
}
```

---

## 🔧 Tecnologías

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Design System:** Atomic Design + Mobile First

---

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)
- [Atomic Design - Brad Frost](https://bradfrost.com/blog/post/atomic-web-design/)
- [Mobile First - Luke Wroblewski](https://www.lukew.com/ff/entry.asp?933)

---

## 🎯 Próximos Pasos

1. **Lee la documentación** - Empieza por [INDEX.md](./INDEX.md)
2. **Revisa los ejemplos** - Mira [EXAMPLE_PAGE.jsx](./EXAMPLE_PAGE.jsx)
3. **Migra componentes** - Sigue [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
4. **Actualiza progreso** - Marca en [PROGRESS.md](./PROGRESS.md)

---

## 📊 Estado del Proyecto

```
Atomic Design:        ████░░░░░░ 15%
Mobile First:         ███░░░░░░░ 10%
Documentación:        ██████████ 100%
Componentes Base:     ████░░░░░░ 40%
Migración:            █░░░░░░░░░ 5%
```

**Total:** 🟢 34% completado

---

## 🤝 Contribuir

Al crear o modificar componentes:

1. Sigue la estructura de Atomic Design
2. Aplica Mobile First en todos los estilos
3. Usa design tokens en lugar de valores hardcodeados
4. Documenta tus componentes
5. Prueba en móvil, tablet y desktop
6. Actualiza PROGRESS.md

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**¿Preguntas?** Consulta [INDEX.md](./INDEX.md) para navegar toda la documentación.

¡Happy coding! 🚀
