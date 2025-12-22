# 🦅 Sistema ERP - Documentación Maestra

Bienvenido a la documentación técnica del Sistema ERP Corporativo. Este _vault_ está estructurado para facilitar el mantenimiento, escalabilidad y comprensión del sistema.

## 🗂 Estructura del Vault

### 1. [[01_Arquitectura_General]]
Visión de alto nivel del stack tecnológico, diagrama de flujo de datos y principios de seguridad.
- **Stack:** Django 6.0 + Next.js 16 + PostgreSQL 17.
- **Seguridad:** JWT, Passkeys (WebAuthn), TOTP.

### 2. [[02_Backend_API]]
Documentación profunda del servidor Django REST Framework.
- **Apps:** Contabilidad, RRHH, Usuarios, Auditoría.
- **Lógica:** Serializadores, Vistas, Permisos personalizados.
- **Guía:** Pasos para crear nuevos endpoints.

### 3. [[03_Frontend_UI]]
Guía del cliente web Next.js App Router.
- **Arquitectura:** Server Components vs Client Components.
- **Servicios:** Capa de abstracción de API modular (`services/`).
- **UI:** Componentes reutilizables (Tablas, Modales, Inputs).
- **Guía:** Pasos para crear nuevas páginas.

### 4. [[04_Base_Datos]]
Esquemas y relaciones de datos.
- **ERD:** Relaciones entre Proyectos, Clientes, Contratos y Pagos.
- **Migraciones:** Estrategia de versionado de DB.

### 5. [[05_Deployment_DevOps]]
Guías para despliegue y entorno local paso a paso.
- **Docker:** Comandos y configuración.
- **Variables de Entorno:** `.env`.
- **Producción:** Estrategias de deploy.

---
**Nota:** Esta documentación actúa como la fuente de verdad para el desarrollo continuo del proyecto.
Última actualización: 22 de Diciembre 2025.
