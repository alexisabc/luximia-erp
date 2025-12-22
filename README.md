# Sistema ERP - Documentación del Proyecto

- **Versión:** 2.6
- **Fecha de última actualización:** 22 de diciembre de 2025
- **Resumen:** Sistema Integral de Planificación de Recursos Empresariales (ERP) diseñado para **Gestión Corporativa**, con un enfoque en automatización financiera, seguridad avanzada y una experiencia de usuario moderna.

---

## 1. Visión General del Proyecto

### 1.1. Objetivo
Centralizar y optimizar las operaciones empresariales, abarcando desde la gestión contable y financiera hasta Recursos Humanos, Jurídico y Dirección Estratégica.

### 1.2. Módulos Principales
El sistema está estructurado en módulos interconectados, accesibles según roles y permisos:

*   **📊 Dirección:** Dashboards estratégicos e indicadores clave de rendimiento (KPIs) en tiempo real.
*   **💰 Contabilidad:**
    *   **Proyectos y UPEs:** Gestión detallada de unidades privativas (inventario inmobiliario).
    *   **Cuentas por Cobrar (CxC):** Control de clientes, presupuestos, contratos y pagos.
    *   **Divisas:** Consulta de tipos de cambio manuales y **sincronización automática diaria con Banxico (SAT)**.
*   **🧾 Tesorería:**
    *   Gestión de Bancos y Cajas Chicas.
    *   Control de Egresos y Planes de Pago.
*   **👥 Recursos Humanos (RRHH):**
    *   Expedientes digitales de empleados.
    *   Organigramas, Departamentos y Puestos.
    *   Esquemas de Comisión y seguimiento de asesores/vendedores.
*   **⚖️ Jurídico:**
    *   Repositorio de contratos legales y expedientes.
*   **💻 Sistemas:**
    *   **Auditoría:** Bitácora completa de cambios (Audit Logs) para trazabilidad.
    *   Gestión de Usuarios, Roles y Permisos granulares.
    *   Importación/Exportación masiva de datos (Excel).

---

## 2. 🚀 Últimas Implementaciones y Mejoras (Dic 2025)

Hemos realizado una actualización mayor enfocada en la experiencia de usuario, seguridad y flexibilidad de marca:

### 🎨 UX/UI & Branding "White-Label"
-   **Normalización de Marca:** Se ha refactorizado todo el código para eliminar referencias hardcodeadas ("Luximia"), convirtiendo el sistema en un producto **White-Label** adaptable a cualquier identidad corporativa.
-   **Tema "Nebula":** Nueva paleta de colores premium y modo oscuro refinado.
-   **Animaciones Interactivas:** Implementación de "El Oso" (Login Avatar) utilizando **SVG Dinámico + CSS Animations**, que reacciona en tiempo real al cursor y al tipeo de contraseñas.
-   **Dashboard v2:** Gráficos interactivos con `recharts` y transiciones fluidas.

### 🛡️ Seguridad Avanzada (Identity-First)
-   **Passkeys (WebAuthn):** Login biométrico sin contraseña (Huella/FaceID) utilizando `@simplewebauthn` y `webauthn` en backend.
-   **2FA/TOTP:** Integración nativa de Doble Factor de Autenticación (Google Authenticator) con `pyotp`.
-   **Auditoría Granular:** Rastreo completo de acciones críticas (Creación/Edición/Eliminado) mediante `django-auditlog`.

### ⚙️ Funcionalidad y Estabilidad
-   **Nómina y Pagos:** Corrección crítica en el motor de cálculo de nómina y generación de recibos.
-   **Selector Multi-Empresa:** Restauración de funcionalidad para superusuarios que gestionan múltiples entidades legales.
-   **POS Terminal:** Corrección de layout y scrollbars en la terminal de punto de venta.
-   **Invitaciones por Email:** Flujo automatizado de enrolamiento de usuarios vía SendGrid.

---

## 3. Stack Tecnológico (Actualizado: Dic 2025)

### Backend
-   **Core:** Python 3.12+
-   **Framework:** **Django 6.0**
-   **API:** Django Rest Framework (DRF) 3.16.1
-   **Autenticación:** `webauthn` (2.7.0), `pyotp` (2.9.0), `djangorestframework-simplejwt` (5.5.1).
-   **Datos & IA:**
    -   **DB:** PostgreSQL 17 + `pgvector` (0.4.2).
    -   **Procesamiento:** `polars` (1.36.1) para alto rendimiento en datos.
    -   **IA:** `openai` (2.9.0) para chatbot RAG.
-   **Reportes:** `weasyprint` (67.0) para generación de PDFs pixel-perfect.
-   **Infra:** `gunicorn` (23.0.0), `celery` (Async Tasks).

### Frontend
-   **Framework:** **Next.js 16.0.8** (App Router, Server Actions).
-   **Biblioteca UI:** **React 19.2.1**
-   **Estilos:** **Tailwind CSS 4.1.18** + `tailwindcss-animate`.
-   **Componentes:**
    -   `lucide-react` (0.560.0) - Iconografía.
    -   `sonner` (1.5.0) - Notificaciones Toast.
    -   `recharts` (3.5.1) - Visualización de datos.
    -   `react-hook-form` (7.53.0) - Gestión de formularios.
-   **Cliente HTTP:** `axios` (1.13.2) con interceptores modulares.

### Infraestructura
-   **Contenedores:** Docker & Docker Compose.
-   **Almacenamiento:** Cloudflare R2 (compatible con S3).
-   **Email:** SendGrid API.

---

## 4. Instalación y Despliegue

### 4.1. Requisitos Previos
- Docker Desktop instalado y corriendo.
- Clave de API de OpenAI (opcional para funciones de IA).
- Credenciales de Banxico (para tipo de cambio).

### 4.2. Configuración Local
1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd sistema-erp
    ```
2.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz basado en `.env.example`.
    ```bash
    cp .env.example .env
    ```
3.  **Iniciar con Docker:**
    ```bash
    docker-compose up -d --build
    ```
4.  **Acceso:**
    - **Frontend:** `http://localhost:3000`
    - **Backend API:** `http://localhost:8000`
    - **Admin Panel:** `http://localhost:8000/admin/`

### 4.3. Estructura de Proyecto
```
sistema-erp/
├── backend/            # Django API
│   ├── contabilidad/   # App: Finanzas y Proyectos
│   ├── users/          # App: Auth y Usuarios
│   ├── rrhh/           # App: Recursos Humanos
│   ├── auditoria/      # App: Logs y Seguridad
│   └── ...
├── frontend/           # Next.js App
│   └── erp_ui/
│       ├── app/        # App Router (Páginas)
│       ├── components/ # UI Reutilizable
│       └── services/   # Capa de API Modular
├── docs/               # Documentación del Proyecto
└── docker-compose.yml  # Orquestación
```

---

## 5. Flujo de Trabajo (Git)

Para mantener la calidad del código, seguimos el flujo de _Feature Branch_:

1.  Crear rama: `git checkout -b feat/nueva-funcionalidad`
2.  Commit semántico: `git commit -m "feat: agregar reporte de ventas"`
3.  Push: `git push origin feat/nueva-funcionalidad`
4.  Pull Request hacia `main`.
