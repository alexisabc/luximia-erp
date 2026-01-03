# ROADMAP DE REFACTORIZACIÓN V2 - SISTEMA ERP MODULAR
**Estado:** En Progreso | **Arquitectura:** Clean Architecture (Django + Next.js)

## 🟢 Fase 1: Core Financiero y Humano (COMPLETADO)
- [x] **Backend Core:** Configuración de Docker, PostgreSQL y entorno.
- [x] **Módulo Contabilidad:**
    - [x] Refactor models.py -> Package structure.
    - [x] FacturaService (XML Parsing & Validation).
    - [x] DIOTService (Layout 2025 - 54 campos).
    - [x] Repository Pattern (Polizas).
- [x] **Módulo RRHH (Nómina 4.0):**
    - [x] CalculoNominaService (Motor ISR/IMSS).
    - [x] NominaOrchestrator (Cálculo masivo y persistencia).
    - [x] XMLGenerator (CFDI 4.0 + Nómina 1.2).
    - [x] Adapter Pattern para PAC (Timbrado Mock).
- [x] **Frontend Integration:** Dashboard de Nómina, PDF Download.

## 🟢 Fase 2: Cadena de Suministro (COMPLETADO)
### Sprint 7: Compras e Inventarios (Legacy App: `compras`) - ✅ COMPLETADO
- [x] **Limpieza:** Absorber app `facturas` (Lógica migrada a `contabilidad/services/factura_service.py`).
- [x] **Modelos:** Dividir `compras/models.py` en paquete estructurado (productos, proveedores, compras, inventario).
- [x] **Lógica:** Implementar `KardexService` (Costeo Promedio Ponderado) y `RecepcionService`.
- [x] **Frontend:** Interfaz de Recepción de Mercancía y Kárdex (Auditoría de Movimientos).

### Sprint 8: Punto de Venta y Facturación (Legacy App: `pos`) - ✅ COMPLETADO
- [x] **Arquitectura:** Implementar `VentaService` y `CajaService` con integración a `KardexService`.
- [x] **Integración:** Conectar con inventarios para descuento automático de stock (Póliza contable pendiente de automatizar).
- [x] **Frontend:** Interfaz POS optimizada para tablets (Touch) con carrito persistente y flujo de cobro.

## 🟢 Fase 3: Tesorería y Auditoría (COMPLETADO)
### Sprint 9: Tesorería (Legacy App: `tesoreria`) - ✅ COMPLETADO
- [x] **Backend:** Modelos de Bancos y Movimientos con polimorfismo para trazabilidad.
- [x] **Lógica:** `MovimientoBancarioService` con procesamiento de cortes de caja del POS.
- [x] **Conciliación:** Sistema de conciliación bancaria con saldos duales (sistema vs banco).
- [x] **Frontend:** Dashboard de Tesorería con sección "Dinero en Tránsito" y bitácora de movimientos.

### Sprint 10: Auditoría y Seguridad (Legacy App: `auditoria`) - ✅ COMPLETADO
- [x] **Backend:** Modelo `AuditLog` polimórfico con GenericForeignKey y JSON Diff.
- [x] **Infrastructure:** Middleware de Contexto (IP/User-Agent) y Signals automáticos para captura de cambios.
- [x] **Lógica:** `AuditService` con cálculo de diferencias y serialización de valores complejos.
- [x] **API:** Endpoints ReadOnly para consulta de logs (solo administradores).
- [x] **Config:** `AUDITED_MODELS` definido en settings para 13 modelos críticos.

## 🟢 Fase 4: Sistemas y Configuración (EN PROGRESO)
### Sprint 11: Seguridad y Gobernanza (RBAC) - ✅ COMPLETADO
- [x] **Legacy Apps `users` y `sistemas`:** Unificadas en un módulo de Seguridad modular y escalable.
- [x] **Backend:** Implementación de `RolePermissionBackend`, modelos modulares `Role` y `EnrollmentToken`.
- [x] **Lógica:** `RBACService` para gestión de asignaciones y rotación de tokens de sesión forzada.
- [x] **Frontend:** Nueva Matriz de Roles (UI Dual con +100 permisos agrupados) y Dashboard de Gestión de Usuarios.
- [x] **Auth:** Login Passwordless (Passkeys/TOTP) totalmente integrado con la experiencia del "Oso" (Legacy Bear).

### Sprint 12: Configuración Dinámica (App `config`) - ✅ COMPLETADO
- [x] **Backend:** Modelo Singleton `ConfiguracionGlobal` con método `get_solo()` y `ConfigService` (Read-through Cache).
- [x] **API:** `ConfiguracionPublicaView` (Branding) y `ConfiguracionAdminViewSet` (Gestión completa) con auditoría.
- [x] **Frontend:** `ConfigContext` integrado en el layout raíz con auto-refresh y soporte de metadatos (favicon/título).
- [x] **Integración:** Branding dinámico en Login y Navbar (Nombre del sistema, Logos y Monogramas).

## 🟢 Fase 5: Comunicación y Escalabilidad (COMPLETADO)
### Sprint 13: Event Bus & Notificaciones (Legacy App: `notificaciones`) - ✅ COMPLETADO
- [x] **Infrastructure:** Infraestructura asíncrona desplegada: Redis (Broker) y Celery (Worker + Beat).
- [x] **Backend:** Refactorización de app `notificaciones` con `NotificacionService` y Tareas Compartidas (`@shared_task`).
- [x] **API:** Endpoints `NotificacionViewSet` (Buzón) seguros y optimizados.
- [x] **Frontend:** `NotificationContext` con Polling inteligente, Badge dinámico y UI de Campanita interactiva.

### Sprint 14: Comunicaciones Externas y Reportes (Legacy Apps: `correos`, `reportes`) - ✅ COMPLETADO
- [x] **Infrastructure:** Configuración Híbrida (MailHog/Resend) y Storage (Cloudflare R2/FileSystem).
- [x] **Email:** `EmailService` transaccional asíncrono con soporte para adjuntos y backend dinámico (Anymail).
- [x] **PDF:** `PDFService` (WeasyPrint) con inyección de branding global y rutas estáticas inteligentes.
- [x] **Integración:** Flujo de envío de Órdenes de Compra (PDF + Email + Notificación) totalmente automatizado.

### Sprint 15: Business Intelligence (Dashboard) - ✅ COMPLETADO
- [x] **Backend:** `DashboardService` con agregaciones nativas (Sum, Count) y Masking de seguridad.
- [x] **API:** Endpoint `/dashboard/resumen/` optimizado para devolver JSON consolidado.
- [x] **Frontend:** Dashboard UI con KPIs, Gráfica de Tendencia (Recharts) y Centro de Acción.
- [x] **UX:** Implementación de Skeleton Screens y Diseño Responsive (Desktop/Mobile).

## 🟢 Fase 6: DevOps & Producción (COMPLETADO)
### Sprint 16: CI/CD y Optimización Docker - ✅ COMPLETADO
- [x] **Docker:** `Dockerfile.prod` optimizados (Python Slim + Node Standalone).
- [x] **CI:** Workflow de GitHub Actions (Backend Tests + Frontend Build).
- [x] **Orquestación:** `docker-compose.prod.yml` validado para Staging/Production.

# 🏁 FIN DEL PROYECTO DE REFACTORIZACIÓN (V 1.0)
Todos los módulos legacy han sido migrados. La arquitectura es Clean, Modular y Segura.
El sistema está listo para "Go Live".

# 🔵 V2.0: Expansión Enterprise (COMPLETADO)

### Fase 1: Infraestructura de Configuración (Config Engine) - ✅ COMPLETADO
- [x] **Backend:** Modelos `SystemSetting` y `FeatureFlag` + `ConfigService` con Redis Cache.
- [x] **Frontend:** `ConfigContext`, `useConfig` hook y `FeatureGuard` (Protección de Rutas).
- [x] **Admin UI:** Panel de Control `/configuracion/panel` con Toggles y Optimistic UI.
- [x] **UX:** Sidebar dinámico reactivo a los flags.

### Fase 2: Módulo de Obras & Control de Costos - ✅ COMPLETADO
- [x] **Presupuestos:** Estructura jerárquica de partidas y explosión de insumos.
- [x] **Control:** Bloqueo de fondos automático contra presupuesto preventivo.
- [x] **Operación:** Flujo de Requisiciones de Obra con validación de existencia.

### Fase 3: Mesa de Control de Compras & Suministros - ✅ COMPLETADO
- [x] **Abastecimiento:** Consolidación de Requisiciones y conversión masiva a Órdenes de Compra.
- [x] **Mesa de Control:** Flujo de autorización multinivel para OC de altos montos.
- [x] **Almacén:** Recepción parcial/total con validación física vs orden.

### Fase 4: Punto de Venta (POS) Enterprise - ✅ COMPLETADO
- [x] **Offline-First:** Motor de base de datos local (Dexie.js) para operación sin internet.
- [x] **Rendimiento:** Interfaz High-Speed optimizada para escaneo masivo.
- [x] **Sincronización:** Worker en background para subida de ventas diferida.

### Fase 5: Motor Fiscal Nativo (CFDI 4.0) - ✅ COMPLETADO
- [x] **Timbrado:** Generación de XML 4.0, sellado digital (CSD) y gestión de certificados en "La Bóveda".
- [x] **Representación:** Generación de PDF profesional con WeasyPrint y QR de validación SAT.
- [x] **Integración:** Emisión automática desde POS y Facturación Masiva.

# 🏁 FIN DE LA EXPANSIÓN ENTERPRISE (V 2.0)
El sistema ha migrado de una arquitectura modular a una Plataforma Enterprise Full-Stack.
Estado Actual: **Provisional Release Candidate (RC1)**.

---
**Sistema ERP - Potencia Enterprise a tu alcance.**
