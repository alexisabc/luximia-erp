# ESTADO DE ARQUITECTURA (Antes vs Después)

## Mapa de Migración de Apps Existentes

| App Original | Estado Actual | Destino / Acción |
| :--- | :---: | :--- |
| `contabilidad` | 🟢 **Refactorizado** | Mantener y extender. |
| `rrhh` | 🟢 **Refactorizado** | Mantener y extender. |
| `compras` | 🟢 **Refactorizado** | Mantener y extender. Soporte Multi-Almacén e Integración con Salida de Documentos (PDF/Email). |
| `pos` | 🟢 **Refactorizado** | Mantener y extender. UI Touch + Integración Inventarios con descuento automático. |
| `tesoreria` | 🟢 **Refactorizado** | Mantener y extender. Motor bancario conectado a POS y CxP con conciliación. |
| `auditoria` | 🟢 **Refactorizado** | Mantener. Middleware activo protegiendo modelos críticos con JSON Diff. |
| `core` | 🟢 **Refactorizado** | Centraliza utilerías y Motores de Infraestructura (Email, PDF, Storage). |
| `facturas` | 🔴 **Obsoleto** | **Candidato a ELIMINAR**. Su lógica se movió a `contabilidad` (Fiscal). |
| `users` | 🟢 **Refactorizado** | Mantener. RBAC Nativo y Login Passwordless. |
| `ia`, `juridico` | ⚪ **Pendiente** | Evaluar convertir en Servicios (no apps completas). |
| `sistemas` | 🟢 **Refactorizado** | Integrado en Seguridad (RBAC y Gestión de Usuarios). |
| `config` | 🟢 **Refactorizado** | Mantener. Singleton activo sirviendo parámetros globales. |
| `notificaciones` | 🟢 **Refactorizado** | Mantener. Sistema de alertas asíncronas activo. |
