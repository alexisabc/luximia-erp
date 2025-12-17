# 🦅 Luximia ERP - Documentación Maestra

Bienvenido a la documentación técnica del sistema Luximia ERP. Este _vault_ está estructurado para facilitar el mantenimiento, escalabilidad y comprensión del sistema.

## 🗂 Estructura del Vault

### 1. [[01_Arquitectura_General]]
Visión de alto nivel del stack tecnológico, diagrama de flujo de datos y principios de seguridad.
- **Stack:** Django 6.0 + Next.js 16 + PostgreSQL 17.
- **Seguridad:** JWT, Passkeys (WebAuthn), TOTP.

### 2. [[02_Backend_API]]
Documentación profunda del servidor Django REST Framework.
- **Apps:** Contabilidad, RRHH, Usuarios, Auditoría.
- **Lógica:** Serializadores, Vistas, Permisos personalizados.

### 3. [[03_Frontend_UI]]
Guía del cliente web Next.js App Router.
- **Arquitectura:** Server Components vs Client Components.
- **Servicios:** Capa de abstracción de API modular (`services/`).
- **UI:** Componentes reutilizables (Tablas, Modales, Inputs).

### 4. [[04_Base_Datos]]
Esquemas y relaciones de datos.
- **ERD:** Relaciones entre Proyectos, Clientes, Contratos y Pagos.
- **Migraciones:** Estrategia de versionado de DB.

### 5. [[05_Deployment_DevOps]]
Guías para despliegue y entorno local.
- **Docker:** Comandos y configuración.
- **Variables de Entorno:** `.env`.

---
**Nota:** Esta documentación se actualiza automáticamente con cambios mayores en la arquitectura.
Última actualización: 15 de Diciembre 2025.
