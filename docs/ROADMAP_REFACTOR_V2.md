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

## 🟡 Fase 2: Cadena de Suministro (EN COLA - Siguientes Sprints)
### Sprint 7: Compras e Inventarios (Legacy App: `compras`)
- [ ] **Limpieza:** Absorber app `facturas` si aplica.
- [ ] **Modelos:** Dividir `compras/models.py` (Producto, Almacen, Movimiento).
- [ ] **Lógica:** Implementar `KardexService` (Costeo Promedio).
- [ ] **Frontend:** Interfaz de Recepción de Mercancía.

### Sprint 8: Punto de Venta y Facturación (Legacy App: `pos`)
- [ ] **Arquitectura:** Implementar `VentaService` y `CajaCorteService`.
- [ ] **Integración:** Conectar con `contabilidad` para generar póliza de ingresos automática.
- [ ] **Frontend:** Interfaz POS optimizada para tablets (Touch).

## 🟠 Fase 3: Tesorería y Auditoría
- [ ] **Legacy App `tesoreria`:** Refactorizar conciliación bancaria.
- [ ] **Legacy App `auditoria`:** Implementar Middleware de logging avanzado para acciones sensibles.

## 🔵 Fase 4: Sistemas y Configuración
- [ ] **Legacy Apps `sistemas`, `config`, `users`:** Unificar gestión de usuarios y permisos (RBAC) en una arquitectura limpia.
- [ ] **Notificaciones:** Migrar app `notificaciones` a un servicio de Event Bus (Redis/Celery).
