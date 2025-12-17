# ⚛️ Frontend UI (Next.js)

Cliente web moderno construido con **Next.js 16 (App Router)**.

## 📂 Arquitectura de Carpetas (`frontend/luximia_erp_ui/`)

- `app/`: Rutas de la aplicación (File-system routing).
    - `(auth)/`: Grupo de rutas de autenticación (Login, Enroll). Layout dedicado.
    - `contabilidad/`, `rrhh/`, `sistemas/`: Módulos funcionales.
    - `layout.jsx`: Layout raíz (Providers, Sidebar).
- `components/`: Bloques de UI.
    - `ui/`: Átomos (Botones, Inputs, Cards).
    - `layout/`: Sidebar, Header.
    - `loaders/`: Spinners y Skeletons.
- `services/`: **Capa de Comunicación API**.
    - `core.js`: Instancia Axios base + Interceptores (Auth, Refresh Token).
    - `auth.js`, `accounting.js`, `users.js`: Endpoints agrupados.

## 🧱 Componentes Clave

### 1. `Sidebar.jsx`
Menú principal dinámico.
- Lee el rol del usuario para mostrar/ocultar módulos.
- Gestiona el estado de expansión de submenús.

### 2. `LoginAnimation.jsx` (El Oso 🐻)
Componente interactivo Rive/SVG animado.
- Estados: `idle`, `tracking` (sigue cursor), `shy` (password), `success`.
- Ubicación: `components/ui/LoginAnimation.jsx`.

### 3. Capa de Servicios (`services/*.js`)
Patrón de diseño para centralizar peticiones HTTP.
- **No importar Axios directamente en componentes.**
- Usar: `import { getClientes } from '@/services/accounting';`
- Esto permite cambiar URLs o lógica de fetch en un solo lugar.

## 🚦 Estados de Carga (Suspense)
Cada módulo tiene un archivo `loading.jsx` que muestra un Skeleton o Spinner automáticamente mientras Next.js hace SSR (Server Side Rendering) de la página.

## 🎨 Estilos
Uso de **Tailwind CSS 4**.
- `globals.css`: Definición de variables CSS para temas (Dark/Light Mode).
- Clases utilitarias para todo el estilizado (`bg-blue-500`, `p-4`, etc.).
