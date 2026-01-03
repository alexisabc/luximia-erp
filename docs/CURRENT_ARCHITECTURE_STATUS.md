# ESTADO DE ARQUITECTURA (Antes vs Después)

## Mapa de Migración de Apps Existentes

| App Original | Estado Actual | Destino / Acción |
| :--- | :---: | :--- |
| `contabilidad` | 🟢 **Refactorizado** | Mantener y extender. |
| `rrhh` | 🟢 **Refactorizado** | Mantener y extender. Integrado en Dashboard (KPI Nómina). |
| `compras` | 🟢 **Refactorizado** | Integrado en Dashboard (KPI CxP y Alertas). Soporte Multi-Almacén y Salida de Documentos. |
| `pos` | 🟢 **Refactorizado** | Integrado en Dashboard (KPI Ventas). UI Touch + Integración Inventarios. |
| `tesoreria` | 🟢 **Refactorizado** | Integrado en Dashboard (KPI Bancos + Alertas). Motor bancario y Conciliación. |
| `auditoria` | 🟢 **Refactorizado** | Mantener. Middleware activo protegiendo modelos críticos. |
| `core` | 🟢 **Refactorizado** | Integrado en Dashboard (API Gateway). Centraliza utilerías y Motores de Infraestructura. |
| `facturas` | 🔴 **Obsoleto** | **Candidato a ELIMINAR**. Su lógica se movió a `contabilidad` (Fiscal). |
| `users` | 🟢 **Refactorizado** | Mantener. RBAC Nativo y Login Passwordless. |
| `ia`, `juridico` | ⚪ **Pendiente** | Evaluar convertir en Servicios (no apps completas). |
| `sistemas` | 🟢 **Refactorizado** | Integrado en Seguridad (RBAC y Gestión de Usuarios). |
| `config` | 🟢 **Refactorizado** | Mantener. Singleton activo sirviendo parámetros globales. |
| `notificaciones` | 🟢 **Refactorizado** | Mantener. Sistema de alertas asíncronas activo.

## Infraestructura y DevOps
*   **Contenerización:** Docker Compose (Development) y `docker-compose.prod.yml` (Production) optimizado.
*   **Pipeline CI/CD:** GitHub Actions activo (Tests de Backend + Build de Frontend).
*   **Estado de Despliegue:** Ready for Production (Dokploy/Docker Swarm).

## Arquitectura de Software - Componentes Clave (V2.0)

### Motor de Configuración Dinámica (Config Engine)
Sistema híbrido (DB + Redis) para gestión centralizada de configuraciones y feature flags.
- **Backend:** `ConfigService` con estrategia Cache-First (TTL 15min) y modelos `SystemSetting`/`FeatureFlag`.
- **Frontend:** `ConfigContext` con sincronización automática y Optimistic UI.
- **Capacidades:** Activación modular (SaaS style), personalización de reglas de negocio sin deploy, y protección de rutas.

### Expansión Enterprise (V2.0)
- **Frontend Engine:** 
  - **Offline Storage:** Implementación de Dexie.js (IndexedDB) para operación POS sin latencia y tolerancia a fallos de red.
  - **PDF Engine:** Generación estricta de representaciones impresas fiscales usando WeasyPrint (CSS Paged Media).
- **Motores de Datos:**
  - **Jerarquía de Costos:** Motor de recursión para presupuestos de obra y explosión de insumos (Estilo Enkontrol).
- **Capa Fiscal:**
  - **Motor de Facturación:** Middleware de sellado digital XML 4.0 con soporte para múltiples PACs (Mock y SWSapien Skeleton).
  - **Bóveda CSD:** Gestión segura de certificados, llaves privadas y contraseñas cifradas.
