# Principios de Arquitectura

## 1. Domain-Driven Design (DDD)
- **Implementación**: Separación clara entre Modelos (Estado), Servicios (Lógica de Negocio) y Vistas/API (Interface).
- **Ejemplo**: `RecepcionService` encapsula toda la lógica de entrada de stock, actualización de OC y devengo presupuestal. `RecepcionViewSet` solo delega y maneja HTTP.

## 2. Soft Deletes
- **Implementación**: Todos los modelos principales heredan de `SoftDeleteModel` (core).
- **Ejemplo**: `RecepcionCompra` y `DetalleRecepcion` usan `SoftDeleteModel`.

## 3. Auditoría y Trazabilidad
- **Implementación**: Uso de sistema de auditoría centralizado vía señales (`register_audit`).
- **Ejemplo**: `RecepcionCompra` tiene auditoría habilitada.

## 4. Gestión Presupuestal Estricta (Obras)
- **Implementación**: Flujo de estados: Estimado -> Comprometido -> Ejecutado (Devengado).
- **Restricción**: Validaciones bloqueantes en backend si `OBRAS_STRICT_BUDGET` es True.

## 5. Frontend Atomic y Mobile First
- **Implementación**: Componentes React reutilizables y layouts responsivos con TailwindCSS.
