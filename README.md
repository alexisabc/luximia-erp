# Luximia ERP - Documentación del Proyecto

- **Versión:** 2.6
- **Fecha de última actualización:** 15 de diciembre de 2025
- **Resumen:** Sistema Integral de Planificación de Recursos Empresariales (ERP) diseñado para **Grupo Luximia**, con un enfoque en automatización financiera, seguridad avanzada y una experiencia de usuario moderna.

---

## 1. Visión General del Proyecto

### 1.1. Objetivo
Centralizar y optimizar las operaciones de Grupo Luximia, abarcando desde la gestión contable y financiera hasta Recursos Humanos, Jurídico y Dirección Estratégica.

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

### 1.3. Características Destacadas
- **🔐 Seguridad de Vanguardia:**
    - Autenticación biométrica con **Passkeys** (FIDO2/WebAuthn).
    - Doble factor de autenticación (2FA) mediante **TOTP** (Google Authenticator/Authy).
    - *Soft Delete*: Protección contra borrado accidental de registros.
- **📄 Reportoría Avanzada:**
    - Estados de cuenta en **PDF** con marca de agua y diseño corporativo (WeasyPrint).
    - Exportaciones a **Excel** personalizables con selección de columnas.
- **🤖 Inteligencia Artificial:**
    - Chatbot integrado para consultas naturales sobre datos financieros y operativos (RAG).
- **📱 UX/UI Moderna:**
    - Diseño responsive con "Glassmorphism" y animaciones fluidas.
    - Modo Oscuro/Claro nativo.
    - Tablas inteligentes con filtrado, ordenamiento y paginación en servidor.

---

## 2. Stack Tecnológico (Actualizado: Dic 2025)

### Backend
- **Lenguaje:** Python 3.12+
- **Framework:** **Django 6.0**
- **API:** Django Rest Framework (DRF) 3.16.1
- **Autenticación:** JWT + WebAuthn (Passkeys)
- **Base de Datos:** PostgreSQL 17 con extensión `pgvector` (para IA/RAG).
- **Tareas Asíncronas:** Celery + Redis.
- **Utilidades:** Polars (procesamiento de datos), WeasyPrint (PDF), OpenAI API (IA).

### Frontend
- **Framework:** **Next.js 16** (App Router)
- **Biblioteca UI:** **React 19**
- **Estilos:** **Tailwind CSS 4.0**
- **Componentes:** Lucide React (iconos), Recharts (gráficas), Framer Motion (animaciones).
- **Cliente HTTP:** Axios con interceptores modulares.

### Infraestructura
- **Contenedores:** Docker & Docker Compose.
- **Almacenamiento:** Cloudflare R2 (compatible con S3).
- **Email:** SendGrid API.

---

## 3. Instalación y Despliegue

### 3.1. Requisitos Previos
- Docker Desktop instalado y corriendo.
- Clave de API de OpenAI (opcional para funciones de IA).
- Credenciales de Banxico (para tipo de cambio).

### 3.2. Configuración Local
1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd luximia-erp
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

### 3.3. Estructura de Proyecto
```
luximia-erp/
├── backend/            # Django API
│   ├── contabilidad/   # App: Finanzas y Proyectos
│   ├── users/          # App: Auth y Usuarios
│   ├── rrhh/           # App: Recursos Humanos
│   ├── auditoria/      # App: Logs y Seguridad
│   └── ...
├── frontend/           # Next.js App
│   └── luximia_erp_ui/
│       ├── app/        # App Router (Páginas)
│       ├── components/ # UI Reutilizable
│       └── services/   # Capa de API Modular
└── docker-compose.yml  # Orquestación
```

---

## 4. Flujo de Trabajo (Git)

Para mantener la calidad del código, seguimos el flujo de _Feature Branch_:

1.  Crear rama: `git checkout -b feat/nueva-funcionalidad`
2.  Commit semántico: `git commit -m "feat: agregar reporte de ventas"`
3.  Push: `git push origin feat/nueva-funcionalidad`
4.  Pull Request hacia `main`.
