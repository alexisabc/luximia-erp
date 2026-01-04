# Componentes de Navegación Enterprise

## Overview
Componentes modernos de navegación para Sistema ERP con características enterprise: multi-tenancy, RBAC, IA, y diseño responsive.

## Componentes Creados

### 1. Navbar (`components/ui/navbar.jsx`)

**Características**:
- ✅ Selector de empresa (multi-tenant)
- ✅ Indicador de estado (Online/Sandbox)
- ✅ Notificaciones con badge
- ✅ Botón de IA Briefing
- ✅ Menú de usuario
- ✅ Responsive (hamburguesa en móvil)

**Props**:
```jsx
<Navbar 
  toggleSidebar={() => {}}        // Función para abrir/cerrar sidebar
  currentCompany={company}         // Objeto de empresa actual
  companies={[...]}                // Array de empresas disponibles
  onCompanyChange={(company) => {}}// Callback al cambiar empresa
  isSandbox={false}                // Boolean para modo sandbox
/>
```

**Ejemplo de Empresa**:
```javascript
{
  id: 1,
  nombre: 'Empresa Principal S.A. de C.V.',
  rfc: 'EMP850101ABC'
}
```

### 2. Sidebar (`components/ui/sidebar.jsx`)

**Características**:
- ✅ Filtrado por roles (RBAC)
- ✅ Grupos colapsables
- ✅ Estado activo automático
- ✅ Responsive con overlay
- ✅ Indicador de rol actual

**Props**:
```jsx
<Sidebar 
  isOpen={true}                    // Boolean para mostrar/ocultar
  setIsOpen={(open) => {}}         // Función para cambiar estado
  userRole="ADMIN"                 // Rol del usuario actual
/>
```

**Roles Soportados**:
- `ADMIN` - Acceso completo
- `GERENTE` - Dashboard, Proyectos
- `CONTADOR` - Financiero, Clientes
- `VENDEDOR` - POS, Clientes, Facturación
- `RRHH` - Empleados
- `COMPRAS` - Proveedores
- `TESORERO` - Tesorería
- `CAJERO` - POS

**Estructura del Menú**:
```javascript
{
  group: 'operativo',              // ID del grupo
  groupName: 'Operativo',          // Nombre visible
  icon: Briefcase,                 // Icono de Lucide React
  items: [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'GERENTE']  // Roles permitidos
    }
  ]
}
```

### 3. Dashboard Layout (`app/dashboard/layout.jsx`)

**Características**:
- ✅ Estructura responsive
- ✅ Gestión de estado del sidebar
- ✅ Integración de Navbar y Sidebar
- ✅ Padding responsive del contenido

**Uso**:
```jsx
// app/dashboard/page.jsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard Content</h1>
      {/* El layout se aplica automáticamente */}
    </div>
  );
}
```

## Personalización

### Agregar Nuevo Item al Menú

```javascript
// En sidebar.jsx
{
  name: 'Inventario',
  href: '/inventario',
  icon: Package,
  roles: ['ADMIN', 'ALMACEN']
}
```

### Agregar Nuevo Grupo

```javascript
{
  group: 'reportes',
  groupName: 'Reportes',
  icon: FileText,
  items: [
    {
      name: 'Ventas',
      href: '/reportes/ventas',
      icon: TrendingUp,
      roles: ['ADMIN', 'GERENTE']
    }
  ]
}
```

### Cambiar Colores del Tema

```javascript
// Estado activo (azul por defecto)
className="bg-blue-50 text-blue-700"

// Cambiar a verde
className="bg-green-50 text-green-700"
```

## Integración con Contexto

### Ejemplo con Context API

```jsx
// contexts/AuthContext.js
'use client';
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    role: 'ADMIN',
    company: { id: 1, nombre: 'Empresa Principal', rfc: 'EMP850101ABC' }
  });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

```jsx
// app/dashboard/layout.jsx
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen">
      <Sidebar userRole={user.role} />
      <Navbar currentCompany={user.company} />
      {/* ... */}
    </div>
  );
}
```

## Responsive Breakpoints

- **Mobile**: < 640px (sm)
  - Sidebar oculto por defecto
  - Hamburguesa visible
  - Overlay al abrir sidebar

- **Tablet**: 640px - 1024px (md-lg)
  - Sidebar visible
  - Algunos textos ocultos

- **Desktop**: > 1024px (lg)
  - Sidebar siempre visible
  - Todos los elementos visibles

## Iconos Disponibles (Lucide React)

```javascript
import {
  LayoutDashboard,  // Dashboard
  Users,            // Usuarios/Empleados
  Building2,        // Edificios/Proyectos
  Wallet,           // Tesorería
  ShoppingCart,     // POS
  FileText,         // Documentos
  Settings,         // Configuración
  Package,          // Inventario
  TrendingUp,       // Reportes/Gráficas
  CreditCard,       // Pagos
  Bell,             // Notificaciones
  Sparkles,         // IA
  Menu,             // Hamburguesa
  X,                // Cerrar
  ChevronDown,      // Expandir
  ChevronRight,     // Colapsar
} from 'lucide-react';
```

## Testing

### Probar Diferentes Roles

```jsx
// Cambiar el rol en layout.jsx
const userRole = 'VENDEDOR'; // Ver solo items permitidos
```

### Probar Modo Sandbox

```jsx
// Cambiar en layout.jsx
const [isSandbox, setIsSandbox] = useState(true);
```

### Probar Múltiples Empresas

```jsx
const companies = [
  { id: 1, nombre: 'Empresa 1', rfc: 'EMP1' },
  { id: 2, nombre: 'Empresa 2', rfc: 'EMP2' },
  { id: 3, nombre: 'Empresa 3', rfc: 'EMP3' },
];
```

## Mejoras Futuras

- [ ] Persistir estado de grupos colapsados en localStorage
- [ ] Animaciones de transición más suaves
- [ ] Soporte para temas (claro/oscuro)
- [ ] Búsqueda en el menú
- [ ] Favoritos/Accesos rápidos
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Badges de contador en items del menú

## Troubleshooting

### El sidebar no se cierra en móvil
Verificar que `setIsOpen(false)` se llame en el onClick de los links.

### Los items no se filtran por rol
Verificar que el prop `userRole` se esté pasando correctamente y que coincida con los roles en `menuItems`.

### El estado activo no funciona
Verificar que `usePathname()` esté importado de `next/navigation` y que las rutas coincidan exactamente.

### Los iconos no se muestran
Verificar que Lucide React esté instalado:
```bash
npm install lucide-react
```

---

**Creado**: 03 de enero de 2026  
**Versión**: 1.0  
**Compatibilidad**: Next.js 14+, React 18+
