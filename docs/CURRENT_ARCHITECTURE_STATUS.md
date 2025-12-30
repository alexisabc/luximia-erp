# ESTADO DE ARQUITECTURA (Antes vs Después)

## Mapa de Migración de Apps Existentes

| App Original | Estado Actual | Destino / Acción |
| :--- | :---: | :--- |
| `contabilidad` | 🟢 **Refactorizado** | Mantener y extender. |
| `rrhh` | 🟢 **Refactorizado** | Mantener y extender. |
| `compras` | 🟢 **Refactorizado** | Mantener y extender. Soporte Multi-Almacén activo con Costeo Promedio. |
| `core` | 🟡 **En Progreso** | Centralizar utilerías y Certificados aquí. |
| `facturas` | 🔴 **Obsoleto** | **Candidato a ELIMINAR**. Su lógica se movió a `contabilidad` (Fiscal). |
| `pos` | ⚪ **Pendiente** | Refactorizar a `Ventas` + `Caja`. |
| `tesoreria` | ⚪ **Pendiente** | Refactorizar conneptando con Pólizas. |
| `users` | ⚪ **Pendiente** | Refactorizar autenticación y perfiles. |
| `ia`, `juridico` | ⚪ **Pendiente** | Evaluar convertir en Servicios (no apps completas). |
| `sistemas`, `config` | ⚪ **Pendiente** | Fusionar en un módulo de Administración. |
