# Bitácora de Migración y Refactorización

## 2026-01-03: Módulo de Compras y Almacén (Recepciones)
- **Módulos Afectados**: Compras, Obras, Almacén.
- **Cambios**:
    - Creación de modelos `RecepcionCompra` y `DetalleRecepcion` (Atomicidad y Trazabilidad).
    - Modificación de `DetalleOrdenCompra` (add `cantidad_recibida`).
    - Implementación de `RecepcionService` con lógica de recepción parcial (Soporte a Procesos Reales).
    - Integración con `ObrasService` para devengar presupuesto (`monto_comprometido` -> `monto_ejecutado`).
    - Endpoint API `recibir` actualizado.
    - Frontend: Nueva UI de Recepción de Mercancía (UX/UI mejorada).
- **Validación**:
    - Modelos migrados correctamente.
    - Lógica de servicios implementada.
- Implementada arquitectura Offline-First en POS (Dexie + Queue).
- Nuevo endpoint /pos/productos/productos-fast/ para sincronización optimizada.
- Componente BackgroundSyncer para subida automática de ventas.
- Implementado Motor Fiscal CFDI 4.0 (Modelos, Cifrado, Builder XML).
- Script de demostración: python manage.py demo_cfdi
- Implementado Firmado (Sello) y Timbrado (Adapter Pattern). Demo actualizado.
- Sprint 22 Parte 3: UI de Gestión de Certificados - Backend completado (endpoint /upload_csd/), Frontend creado (/configuracion/fiscal/page.tsx).

## 2026-01-03: Neutralización de Marca (Sistema ERP V2.0 RC1)
- **Módulos Afectados**: Global (Backend & Frontend).
- **Cambios**:
    - Reemplazo masivo de "LUXIMIA ERP" por "Sistema ERP" en documentación, API y UI.
    - Actualización de `ConfiguracionGlobal` (default: "Sistema ERP").
    - Limpieza de branding en scripts de semillas y prompts de IA.
    - Cambio de `storageKey` en ThemeProvider para independencia de marca.
- **Resultado**: El sistema es ahora una plataforma de marca blanca (White-label) configurable.
