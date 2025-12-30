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

### Próximos Pasos (Sprint 12)
- [ ] **Configuraciones:** Centralizar parámetros globales en app `config`.
- [ ] **Notificaciones:** Migrar app `notificaciones` a un servicio de Event Bus (Redis/Celery).
