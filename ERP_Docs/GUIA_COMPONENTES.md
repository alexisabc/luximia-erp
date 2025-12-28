# 🎨 Guía de Componentes Reutilizables

## 📚 Índice
1. [Botones](#botones)
2. [Inputs y Formularios](#inputs-y-formularios)
3. [Tablas](#tablas)
4. [Modales](#modales)
5. [Cards](#cards)
6. [Badges y Estados](#badges-y-estados)
7. [Toasts](#toasts)
8. [Iconos](#iconos)
9. [Layouts Responsive](#layouts-responsive)
10. [Dark Mode](#dark-mode)

---

## 1. Botones

### Botón Primario
```jsx
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

<Button className="
    bg-gradient-to-r from-blue-600 to-indigo-600 
    hover:from-blue-700 hover:to-indigo-700
    text-white
    shadow-lg hover:shadow-xl
    transition-all duration-300
">
    <Plus className="w-4 h-4 mr-2" />
    Nuevo Registro
</Button>
```

### Botón Secundario
```jsx
<Button 
    variant="outline"
    className="
        border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-700
    "
>
    Cancelar
</Button>
```

### Botón de Peligro
```jsx
<Button 
    variant="destructive"
    className="
        bg-gradient-to-r from-red-600 to-rose-600
        hover:from-red-700 hover:to-rose-700
    "
>
    <Trash2 className="w-4 h-4 mr-2" />
    Eliminar
</Button>
```

### Botón con Loading
```jsx
<Button disabled={isLoading}>
    {isLoading ? (
        <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
        </>
    ) : (
        <>
            <Save className="w-4 h-4 mr-2" />
            Guardar
        </>
    )}
</Button>
```

### Grupo de Botones Responsive
```jsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
    <Button className="w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Nuevo</span>
        <span className="sm:hidden">+</span>
    </Button>
    
    <Button variant="outline" className="w-full sm:w-auto">
        <Download className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Exportar</span>
    </Button>
</div>
```

---

## 2. Inputs y Formularios

### Input Básico
```jsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
    <Label htmlFor="nombre">
        Nombre <span className="text-red-500">*</span>
    </Label>
    <Input
        id="nombre"
        type="text"
        placeholder="Ingrese el nombre"
        className="mt-1"
        {...register('nombre', { required: 'Este campo es requerido' })}
    />
    {errors.nombre && (
        <p className="text-sm text-red-500 mt-1">
            {errors.nombre.message}
        </p>
    )}
</div>
```

### Input con Icono
```jsx
<div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <Input
        type="text"
        placeholder="Buscar..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
</div>
```

### Select
```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller } from 'react-hook-form';

<div>
    <Label htmlFor="tipo">Tipo</Label>
    <Controller
        name="tipo"
        control={control}
        rules={{ required: 'Seleccione un tipo' }}
        render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="tipo1">Tipo 1</SelectItem>
                    <SelectItem value="tipo2">Tipo 2</SelectItem>
                    <SelectItem value="tipo3">Tipo 3</SelectItem>
                </SelectContent>
            </Select>
        )}
    />
    {errors.tipo && (
        <p className="text-sm text-red-500 mt-1">{errors.tipo.message}</p>
    )}
</div>
```

### Textarea
```jsx
import { Textarea } from '@/components/ui/textarea';

<div>
    <Label htmlFor="descripcion">Descripción</Label>
    <Textarea
        id="descripcion"
        placeholder="Ingrese una descripción"
        rows={4}
        className="mt-1"
        {...register('descripcion')}
    />
</div>
```

### Checkbox
```jsx
<div className="flex items-center space-x-2">
    <input
        type="checkbox"
        id="activo"
        className="
            w-4 h-4
            text-blue-600
            bg-gray-100 dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            rounded
            focus:ring-blue-500
        "
        {...register('activo')}
    />
    <Label htmlFor="activo" className="cursor-pointer">
        Activo
    </Label>
</div>
```

### Formulario Completo Responsive
```jsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
    {/* Grid responsive de campos */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} />
        </div>
        
        <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
        </div>
    </div>
    
    {/* Botones */}
    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <Button type="button" variant="outline" className="w-full sm:w-auto">
            Cancelar
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
            Guardar
        </Button>
    </div>
</form>
```

---

## 3. Tablas

### Tabla Básica con ReusableTable
```jsx
import ReusableTable from '@/components/tables/ReusableTable';

const columns = [
    {
        header: 'ID',
        render: (row) => (
            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                #{row.id}
            </span>
        )
    },
    {
        header: 'Nombre',
        render: (row) => (
            <span className="font-medium text-gray-900 dark:text-white">
                {row.nombre}
            </span>
        )
    },
    {
        header: 'Email',
        render: (row) => (
            <span className="text-sm text-gray-600 dark:text-gray-300">
                {row.email}
            </span>
        )
    }
];

<div className="overflow-x-auto">
    <ReusableTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No hay registros disponibles"
    />
</div>
```

### Tabla con Badge de Estado
```jsx
import { Badge } from '@/components/ui/badge';

const columns = [
    // ... otras columnas
    {
        header: 'Estado',
        render: (row) => (
            <Badge 
                variant={row.activo ? 'success' : 'secondary'}
                className="text-xs"
            >
                {row.activo ? 'Activo' : 'Inactivo'}
            </Badge>
        )
    }
];
```

### Tabla Responsive con Scroll
```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
        <div className="min-w-[640px]">  {/* Ancho mínimo para scroll horizontal */}
            <ReusableTable
                columns={columns}
                data={data}
                loading={loading}
            />
        </div>
    </div>
</div>
```

---

## 4. Modales

### Modal Básico
```jsx
import ReusableModal from '@/components/modals/ReusableModal';

<ReusableModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title="Título del Modal"
    size="md"  // sm, md, lg, xl
>
    <div className="space-y-4">
        {/* Contenido del modal */}
    </div>
</ReusableModal>
```

### Modal con Formulario
```jsx
<ReusableModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title={selectedItem ? 'Editar' : 'Nuevo'}
    size="lg"
>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos del formulario */}
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
            >
                Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
        </div>
    </form>
</ReusableModal>
```

### Modal de Confirmación
```jsx
<ReusableModal
    isOpen={isConfirmOpen}
    onClose={() => setIsConfirmOpen(false)}
    title="Confirmar Acción"
    size="sm"
>
    <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
            ¿Estás seguro de que deseas realizar esta acción?
        </p>
        
        <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
                Confirmar
            </Button>
        </div>
    </div>
</ReusableModal>
```

---

## 5. Cards

### Card de Estadística con Gradiente
```jsx
<div className="
    bg-gradient-to-br from-blue-500 to-indigo-600
    dark:from-blue-600 dark:to-indigo-700
    rounded-xl p-4 sm:p-6
    shadow-lg hover:shadow-xl
    transition-all duration-300
    transform hover:-translate-y-1
    cursor-pointer
">
    <div className="flex items-center justify-between mb-2">
        <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
        <span className="text-xs sm:text-sm font-medium text-white/70">
            +12%
        </span>
    </div>
    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
        1,234
    </div>
    <div className="text-xs sm:text-sm text-white/80">
        Total de Registros
    </div>
</div>
```

### Card de Contenido
```jsx
<div className="
    bg-white dark:bg-gray-800
    rounded-xl shadow-lg
    p-4 sm:p-6
    border border-gray-200 dark:border-gray-700
">
    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Título de la Card
    </h3>
    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
        Contenido de la card
    </p>
</div>
```

### Grid de Cards Responsive
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {items.map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4">
            {/* Contenido de la card */}
        </div>
    ))}
</div>
```

---

## 6. Badges y Estados

### Badge de Estado
```jsx
import { Badge } from '@/components/ui/badge';

// Activo
<Badge variant="success">Activo</Badge>

// Inactivo
<Badge variant="secondary">Inactivo</Badge>

// Pendiente
<Badge variant="warning">Pendiente</Badge>

// Error
<Badge variant="destructive">Error</Badge>

// Info
<Badge variant="info">Información</Badge>
```

### Badge Personalizado
```jsx
<span className="
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-xs font-medium
    bg-green-100 dark:bg-green-900
    text-green-800 dark:text-green-200
">
    <CheckCircle className="w-3 h-3 mr-1" />
    Completado
</span>
```

---

## 7. Toasts

### Toasts con Sonner
```jsx
import { toast } from 'sonner';

// Éxito
toast.success('Operación exitosa');

// Error
toast.error('Error en la operación');

// Información
toast.info('Información importante');

// Advertencia
toast.warning('Advertencia');

// Con duración personalizada
toast.success('Guardado exitosamente', {
    duration: 3000
});

// Con acción
toast.success('Elemento eliminado', {
    action: {
        label: 'Deshacer',
        onClick: () => handleUndo()
    }
});
```

---

## 8. Iconos

### Iconos de Lucide React
```jsx
import {
    Plus, Edit, Trash2, Save, X, Check,
    Search, Download, Upload, Filter,
    TrendingUp, TrendingDown, AlertCircle,
    CheckCircle, XCircle, Info,
    User, Users, Building, Calendar,
    DollarSign, CreditCard, FileText,
    Settings, LogOut, Menu, ChevronDown
} from 'lucide-react';

// Uso básico
<Plus className="w-4 h-4" />

// Con color
<CheckCircle className="w-5 h-5 text-green-500" />

// Responsive
<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />

// Con animación
<Loader2 className="w-4 h-4 animate-spin" />
```

---

## 9. Layouts Responsive

### Container Principal
```jsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
    {/* Contenido */}
</div>
```

### Grid Responsive
```jsx
{/* 1 columna en móvil, 2 en tablet, 4 en desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
    {/* Items */}
</div>

{/* Auto-fit con tamaño mínimo */}
<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
    {/* Items */}
</div>
```

### Flex Responsive
```jsx
{/* Columna en móvil, fila en desktop */}
<div className="flex flex-col sm:flex-row gap-4">
    {/* Items */}
</div>

{/* Con wrap */}
<div className="flex flex-wrap gap-4">
    {/* Items */}
</div>
```

### Espaciado Responsive
```jsx
<div className="
    p-4 sm:p-6 lg:p-8           // Padding
    m-4 sm:m-6 lg:m-8           // Margin
    gap-4 sm:gap-6 lg:gap-8     // Gap
    space-y-4 sm:space-y-6      // Espacio vertical
">
```

---

## 10. Dark Mode

### Colores de Fondo
```jsx
// Fondo principal
bg-white dark:bg-gray-800

// Fondo secundario
bg-gray-50 dark:bg-gray-900

// Fondo hover
hover:bg-gray-100 dark:hover:bg-gray-700

// Gradiente
bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900
```

### Colores de Texto
```jsx
// Texto principal
text-gray-900 dark:text-white

// Texto secundario
text-gray-600 dark:text-gray-300

// Texto terciario
text-gray-500 dark:text-gray-400

// Texto muted
text-gray-400 dark:text-gray-500
```

### Bordes
```jsx
// Border normal
border-gray-200 dark:border-gray-700

// Border hover
hover:border-gray-300 dark:hover:border-gray-600

// Divide
divide-gray-200 dark:divide-gray-700
```

### Sombras
```jsx
// Sombra normal
shadow-lg dark:shadow-gray-900/50

// Sombra hover
hover:shadow-xl dark:hover:shadow-gray-900/70
```

---

## 📱 Breakpoints de Referencia

```
Mobile:    < 640px   (sm)
Tablet:    640px+    (sm)
Laptop:    1024px+   (lg)
Desktop:   1280px+   (xl)
TV:        1536px+   (2xl)
```

---

## ✅ Checklist de Componente

Al crear un componente, verificar:

- [ ] Responsive en todos los breakpoints
- [ ] Dark mode implementado
- [ ] Iconos de Lucide React
- [ ] Toasts de Sonner (no alerts)
- [ ] Componentes UI base
- [ ] Gradientes y animaciones
- [ ] Accesibilidad (labels, aria)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

**Fecha**: 27 de Diciembre 2025  
**Versión**: 1.0
