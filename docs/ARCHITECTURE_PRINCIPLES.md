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

## 6. Aislamiento Multi-Empresa (Lógico)
- **Implementación**: Mixin `EmpresaOwnedModel` y `MultiTenantManager` para filtrado automático por `empresa_id`.
- **Ejemplo**: Las ventas creadas para la Empresa A son invisibles para la Empresa B mediante middleware que inyecta el contexto en el hilo de ejecución.

## 7. Entorno Sandbox (Físico)
- **Implementación**: Ruteo dinámico de Base de Datos (`X-Environment` header).
- **Aislamiento**: Uso de una instancia de PostgreSQL separada (`db_sandbox`) para garantizar que las pruebas no afecten datos de producción.

## 8. Automatización Contable (Robot Contable)
- **Implementación**: Patrón `Template Method` (Plantillas de Asientos + Reglas).
- **Principio**: La contabilidad es un *efecto secundario* de la operación, no una captura manual.
- **Ejemplo**: Al autorizar una estimación (`Obra`), el sistema dispara el hook que genera la póliza de Ingreso sin intervención humana.

## 9. Integridad Financiera (3-Way Match)
- **Implementación**: Validación cruzada entre Orden de Compra (Presupuesto), Recepción (Almacén) y Factura (Fiscal).
- **Restricción**: No se puede programar un pago en Tesorería si no existe un `ContraRecibo` validado por el motor de Match.

