# Sistema ERP Luximia - Documentación del Proyecto

- **Versión:** 3.0
- **Fecha de última actualización:** 29 de diciembre de 2025
- **Última sesión:** Migración completa a Atomic Design + Mobile First + Limpieza de código
- **Resumen:** Sistema Integral de Planificación de Recursos Empresariales (ERP) diseñado para **Gestión Corporativa**, con arquitectura moderna basada en Atomic Design, Mobile First y componentes reutilizables.

---

## 📚 Documentación Completa

Para acceder a toda la documentación técnica, arquitectura, guías y reportes del proyecto:

👉 **[Ver Documentación Completa en ERP_Docs/](./ERP_Docs/README.md)**

La carpeta `ERP_Docs/` contiene:
- Arquitectura del sistema (6 documentos)
- Documentación de UI/UX (9 documentos)
- Guías de despliegue y configuración
- Módulos específicos (Tesorería, POS, etc.)
- Reportes de progreso e hitos del proyecto

### Documentación del Frontend

Para documentación específica del frontend (Atomic Design, componentes, migración):

👉 **[Ver Documentación del Frontend](./frontend/erp_ui/ERP_Docs/README.md)**

Incluye:
- 41 componentes Atomic Design documentados
- Guías de migración y limpieza de código
- Sistema de diseño y Mobile First
- Mejores prácticas de desarrollo

---

## 1. Visión General del Proyecto

### 1.1. Objetivo
Centralizar y optimizar las operaciones empresariales, abarcando desde la gestión contable y financiera hasta Recursos Humanos, Jurídico y Dirección Estratégica, con una interfaz moderna, responsive y optimizada para dispositivos móviles.

### 1.2. Módulos Principales
El sistema está estructurado en módulos interconectados, accesibles según roles y permisos:

*   **📊 Dirección:** Dashboards estratégicos e indicadores clave de rendimiento (KPIs) en tiempo real.
*   **💰 Contabilidad:**
    *   **Proyectos y UPEs:** Gestión detallada de unidades privativas (inventario inmobiliario).
    *   **Cuentas por Cobrar (CxC):** Control de clientes, presupuestos, contratos y pagos.
    *   **Divisas:** Consulta de tipos de cambio manuales y **sincronización automática diaria con Banxico (SAT)**.
*   **🏦 Tesorería:**
    *   **Cuentas Bancarias:** Gestión completa con conciliación automática (Sistema vs Banco).
    *   **Egresos:** Flujo de autorización multinivel con control de pagos.
    *   **Cajas Chicas:** Fondos fijos con registro de gastos y reembolsos.
    *   **ContraRecibos:** Gestión de facturas y documentos para pago.
    *   **Programaciones de Pago:** Lotes de pagos y dispersión bancaria.
*   **👥 Recursos Humanos (RRHH):**
    *   Expedientes digitales de empleados.
    *   Organigramas, Departamentos y Puestos.
    *   Esquemas de Comisión y seguimiento de asesores/vendedores.
    *   **Motor de Nómina 2025** con cálculo IMSS, ISR y PTU.
*   **⚖️ Jurídico:**
    *   Repositorio de contratos legales y expedientes.
*   **🛒 Compras:**
    *   Órdenes de Compra con flujo de autorización.
    *   Gestión de Proveedores e Insumos.
*   **🛍️ Punto de Venta (POS):**
    *   Terminal de venta con gestión de productos.
    *   Control de turnos y cortes de caja.
*   **💻 Sistemas:**
    *   **Auditoría:** Bitácora completa de cambios (Audit Logs) para trazabilidad.
    *   Gestión de Usuarios, Roles y Permisos granulares.
    *   Importación/Exportación masiva de datos (Excel).
*   **🤖 IA:**
    *   Asistente inteligente con búsqueda semántica.
    *   Indexación de 15 modelos del sistema.
    *   Filtrado automático por permisos.

---

## 2. 🚀 Últimas Implementaciones y Mejoras (Dic 2025)

### 🎨 Migración a Atomic Design + Mobile First (NUEVO - 100% Completo)
-   **41 Componentes Atomic Design:** Átomos (8), Moléculas (14), Organismos (6), Templates (6).
-   **6 Páginas Migradas:** Empleados, Departamentos, Puestos, Monedas, Clientes.
-   **116 Archivos Actualizados:** Importaciones migradas a nuevos componentes.
-   **9 Componentes Legacy Eliminados:** Sin duplicación de código.
-   **Mobile First:** Todos los componentes optimizados para móviles primero.
-   **Accesibilidad:** ARIA labels, focus management, keyboard navigation.
-   **Documentación Completa:** 69 archivos de documentación técnica.

### 💰 Módulo de Tesorería (100% Completo)
-   **Gestión de Cuentas Bancarias:** CRUD completo con conciliación bancaria automática.
-   **Control de Egresos:** Flujo de autorización multinivel (Borrador → Autorizado → Pagado).
-   **Cajas Chicas:** Gestión de fondos fijos con registro de gastos y reembolsos.
-   **ContraRecibos:** Registro de facturas y documentos para pago con validación.
-   **Programaciones de Pago:** Lotes de pagos y generación de layouts bancarios.
-   **18 Endpoints API REST** con acciones personalizadas.
-   **5 Páginas UI** con diseño premium y 23 cards de estadísticas.

### 🔐 Sistema de Permisos Mejorado
-   **401 Permisos Gestionados:** 367 estándar + 34 personalizados.
-   **Traducciones al Español:** 100% de permisos traducidos.
-   **Comando `update_permissions`:** Gestión automática de permisos y traducciones.
-   **Documentación Completa:** Guía de permisos y roles con ejemplos de uso.

### 🤖 Sistema de IA Actualizado
-   **Indexación de Modelos:** 15 modelos del sistema indexados para búsqueda semántica.
-   **Búsqueda Contextual:** Embeddings con OpenAI y filtrado automático por permisos.
-   **Comando `index_models`:** Gestión de indexación por app o modelo.
-   **Integración Lista:** Preparado para chat IA con contexto del sistema.

### 🎨 UX/UI & Branding
-   **Atomic Design:** Arquitectura escalable y mantenible de componentes.
-   **Mobile First:** Diseño responsive optimizado para móviles.
-   **Tema Premium:** Paleta de colores moderna y modo oscuro refinado.
-   **Animaciones Interactivas:** Transiciones fluidas y micro-interacciones.
-   **Dashboard v2:** Gráficos interactivos con `recharts`.

### 🛡️ Seguridad Avanzada (Identity-First)
-   **Passkeys (WebAuthn):** Login biométrico sin contraseña (Huella/FaceID).
-   **2FA/TOTP:** Doble Factor de Autenticación (Google Authenticator).
-   **Auditoría Granular:** Rastreo completo de acciones críticas.
-   **NGINX Hardening:** Reverse Proxy Seguro con headers anti-XSS.

### ⚙️ Funcionalidad y Estabilidad
-   **Motor de Nómina 2025:**
    -   Cálculo preciso de **IMSS Patronal y Obrero**.
    -   Proyección de **Presupuesto Anual**.
    -   Calculadora inversa (Neto a Bruto) y timbrado CFDI 4.0.
    -   Importación/Exportación de layouts **SUA e IDSE**.
-   **Selector Multi-Empresa:** Gestión de múltiples entidades legales.
-   **POS Terminal:** Terminal de punto de venta optimizada.
-   **Invitaciones por Email:** Flujo automatizado de enrolamiento de usuarios.

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
-   **Reportes:** `weasyprint` (67.0) para generación de PDFs.
-   **Infra:** `gunicorn` (23.0.0), `celery` (Async Tasks).

### Frontend
-   **Framework:** **Next.js 16.0.8** (App Router, Server Actions).
-   **Biblioteca UI:** **React 19.2.1**
-   **Estilos:** **Tailwind CSS 4.1.18** + `tailwindcss-animate`.
-   **Componentes:**
    -   **Atomic Design:** 41 componentes (Átomos, Moléculas, Organismos, Templates).
    -   `lucide-react` (0.560.0) - Iconografía.
    -   `sonner` (1.5.0) - Notificaciones Toast.
    -   `recharts` (3.5.1) - Visualización de datos.
    -   `react-hook-form` (7.53.0) - Gestión de formularios.
    -   `shadcn/ui` - Componentes base.
-   **Cliente HTTP:** `axios` (1.13.2) con interceptores modulares.

### Infraestructura
-   **Gateway:** **NGINX Reverse Proxy** (Gzip, Caching, Security Headers).
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
├── README.md           # Este archivo
├── ERP_Docs/           # Documentación general (48 archivos)
├── backend/            # Django API
│   ├── contabilidad/   # App: Finanzas y Proyectos
│   ├── users/          # App: Auth y Usuarios
│   ├── rrhh/           # App: Recursos Humanos
│   ├── tesoreria/      # App: Tesorería
│   ├── auditoria/      # App: Logs y Seguridad
│   └── ...
├── frontend/           # Next.js App
│   └── erp_ui/
│       ├── app/        # App Router (Páginas)
│       ├── components/ # UI Atomic Design
│       │   ├── atoms/      # 8 componentes
│       │   ├── molecules/  # 14 componentes
│       │   ├── organisms/  # 6 componentes
│       │   └── templates/  # 6 componentes
│       ├── services/   # Capa de API Modular
│       └── ERP_Docs/   # Documentación frontend (17 archivos)
└── docker-compose.yml  # Orquestación
```

---

## 5. Documentación

### 📚 Documentación General
- **[ERP_Docs/](./ERP_Docs/README.md)** - Documentación completa del proyecto
  - Arquitectura del sistema
  - Módulos específicos
  - Guías de despliegue
  - Reportes de progreso

### 🎨 Documentación del Frontend
- **[Frontend Docs](./frontend/erp_ui/ERP_Docs/README.md)** - Documentación del frontend
  - 41 componentes Atomic Design
  - Guías de migración
  - Sistema de diseño
  - Mejores prácticas

### 📖 Guías Rápidas
- **[Guía de Componentes](./frontend/erp_ui/components/COMPONENTS_GUIDE.md)** - Documentación de componentes
- **[Guía de Despliegue](./ERP_Docs/GUIA_DESPLIEGUE.md)** - Despliegue en producción
- **[Guía de Permisos](./ERP_Docs/CATALOGO_PERMISOS.md)** - Sistema de permisos

---

## 6. Flujo de Trabajo (Git)

Para mantener la calidad del código, seguimos el flujo de _Feature Branch_:

1.  Crear rama: `git checkout -b feat/nueva-funcionalidad`
2.  Commit semántico: `git commit -m "feat: agregar reporte de ventas"`
3.  Push: `git push origin feat/nueva-funcionalidad`
4.  Pull Request hacia `main`.

---

## 7. Métricas del Proyecto

- **Módulos Implementados:** 10+
- **Componentes UI:** 41 (Atomic Design)
- **Páginas Migradas:** 6
- **Archivos de Documentación:** 69
- **Progreso General:** 100% ✅
- **Estado:** Producción

---

## 8. Contacto y Soporte

Para más información, consulta la [documentación completa](./ERP_Docs/README.md) o contacta al equipo de desarrollo.

---

**Última actualización:** 29 de diciembre de 2025  
**Versión:** 3.0  
**Estado:** ✅ Producción
