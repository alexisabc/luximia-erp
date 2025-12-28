# 📋 CATÁLOGO DE PERMISOS DEL SISTEMA ERP

## Descripción General

Este documento describe todos los permisos personalizados disponibles en el sistema ERP. Los permisos están organizados por módulo y están completamente traducidos al español para facilitar la administración.

---

## 📍 Ubicación del Catálogo

El archivo de referencia para permisos está en:
```
backend/core/permissions_catalog.py
```

---

## 👤 MÓDULO: USUARIOS Y AUTENTICACIÓN

| Código | Descripción |
|--------|-------------|
| `view_dashboard` | Ver Panel Principal (Dashboard) |
| `view_inactive_records` | Ver registros inactivos en todo el sistema |
| `hard_delete_records` | Eliminar permanentemente registros (sin recuperación) |
| `view_consolidado` | Ver reportes consolidados multi-empresa |
| `use_ai` | Usar asistente de Inteligencia Artificial |
| `manage_ai_settings` | Configurar parámetros de IA |
| `view_inactive_users` | Ver usuarios inactivos o suspendidos |
| `hard_delete_customuser` | Eliminar permanentemente usuarios |
| `impersonate_users` | Iniciar sesión como otro usuario (impersonar) |
| `manage_user_permissions` | Gestionar permisos de usuarios |
| `reset_user_credentials` | Restablecer credenciales de acceso |
| `view_audit_logs` | Ver registros de auditoría |
| `export_audit_logs` | Exportar registros de auditoría |
| `view_security_alerts` | Ver alertas de seguridad |
| `access_all_companies` | Acceder a todas las empresas del sistema |
| `switch_company_context` | Cambiar contexto de empresa activa |

---

## 🛒 MÓDULO: PUNTO DE VENTA (POS)

### Operaciones de Caja
| Código | Descripción |
|--------|-------------|
| `open_cash_register` | Abrir turno de caja |
| `close_cash_register` | Cerrar turno de caja |
| `view_other_shifts` | Ver turnos de otros cajeros |
| `modify_closed_shift` | Modificar turnos cerrados |

### Ventas
| Código | Descripción |
|--------|-------------|
| `view_all_sales` | Ver ventas de todos los cajeros |
| `apply_discount` | Aplicar descuentos a ventas |
| `apply_special_discount` | Aplicar descuentos especiales (sin límite) |
| `sell_on_credit` | Vender a crédito (cuenta corriente) |
| `sell_below_cost` | Vender por debajo del precio de costo |

### Cancelaciones y Devoluciones
| Código | Descripción |
|--------|-------------|
| `request_cancellation` | Solicitar cancelación de ventas |
| `authorize_cancellation` | ⭐ **Autorizar cancelaciones de ventas** |
| `request_refund` | Solicitar devoluciones de productos |
| `authorize_refund` | Autorizar devoluciones de productos |
| `void_transaction` | Anular transacciones del día |

### Cuentas de Clientes
| Código | Descripción |
|--------|-------------|
| `manage_customer_credit` | Gestionar crédito de clientes |
| `receive_payments` | Recibir abonos de clientes |
| `adjust_customer_balance` | Ajustar saldos de clientes manualmente |

### Movimientos de Caja
| Código | Descripción |
|--------|-------------|
| `register_cash_income` | Registrar ingresos de efectivo |
| `register_cash_withdrawal` | Registrar retiros de efectivo |
| `view_cash_movements` | Ver movimientos de caja |

### Reportes POS
| Código | Descripción |
|--------|-------------|
| `view_pos_reports` | Ver reportes del punto de venta |
| `export_pos_reports` | Exportar reportes del punto de venta |
| `view_sales_statistics` | Ver estadísticas de ventas |

---

## 💰 MÓDULO: TESORERÍA

### Bancos
| Código | Descripción |
|--------|-------------|
| `view_bank_balances` | Ver saldos bancarios |
| `conciliate_bank` | Conciliar cuentas bancarias |
| `register_bank_movement` | Registrar movimientos bancarios |

### Egresos y Pagos
| Código | Descripción |
|--------|-------------|
| `create_payment_request` | Solicitar pagos |
| `authorize_payment` | Autorizar pagos y egresos |
| `execute_payment` | Ejecutar pagos (emitir cheques/transferencias) |
| `void_payment` | Anular pagos emitidos |

### Caja Chica
| Código | Descripción |
|--------|-------------|
| `manage_petty_cash` | Gestionar caja chica |
| `close_petty_cash` | Cerrar y reembolsar caja chica |
| `approve_petty_cash_expense` | Aprobar gastos de caja chica |

### Flujo de Efectivo
| Código | Descripción |
|--------|-------------|
| `view_cash_flow` | Ver flujo de efectivo |
| `create_cash_projection` | Crear proyecciones de flujo |

### Reportes
| Código | Descripción |
|--------|-------------|
| `view_treasury_reports` | Ver reportes de tesorería |
| `export_treasury_reports` | Exportar reportes de tesorería |

---

## 📊 MÓDULO: CONTABILIDAD

### Catálogo de Cuentas
| Código | Descripción |
|--------|-------------|
| `manage_chart_of_accounts` | Gestionar catálogo de cuentas contables |
| `close_accounting_period` | Cerrar períodos contables |

### Pólizas
| Código | Descripción |
|--------|-------------|
| `create_journal_entry` | Crear pólizas contables |
| `post_journal_entry` | Aplicar/Mayorizar pólizas |
| `reverse_journal_entry` | Revertir pólizas aplicadas |
| `delete_journal_entry` | Eliminar pólizas contables |

### Facturación
| Código | Descripción |
|--------|-------------|
| `issue_invoice` | Emitir facturas (CFDI) |
| `cancel_invoice` | Cancelar facturas (CFDI) |
| `view_fiscal_documents` | Ver documentos fiscales |

### Tipos de Cambio
| Código | Descripción |
|--------|-------------|
| `manage_exchange_rates` | Gestionar tipos de cambio |

### Reportes Contables
| Código | Descripción |
|--------|-------------|
| `view_financial_statements` | Ver estados financieros |
| `export_financial_reports` | Exportar reportes financieros |
| `view_diot` | Ver DIOT |
| `generate_diot` | Generar DIOT |

### IA Contable
| Código | Descripción |
|--------|-------------|
| `use_ai_accounting` | Usar IA para contabilidad |

---

## 👥 ROLES PREDEFINIDOS (GRUPOS)

### 🛒 Cajero
Permisos mínimos para operar una caja:
- `pos.open_cash_register`
- `pos.close_cash_register`
- `pos.apply_discount`
- `pos.request_cancellation`
- `pos.receive_payments`
- `pos.view_cash_movements`

### 👔 Supervisor POS
Permisos extendidos para supervisar operaciones de caja:
- Todos los permisos del Cajero
- `pos.view_all_sales`
- `pos.view_other_shifts`
- `pos.apply_special_discount`
- `pos.sell_on_credit`
- `pos.authorize_cancellation` ⭐
- `pos.authorize_refund`
- `pos.manage_customer_credit`
- `pos.adjust_customer_balance`
- `pos.register_cash_income`
- `pos.register_cash_withdrawal`
- `pos.view_pos_reports`

### 📈 Contador
Permisos para operaciones contables:
- `contabilidad.manage_chart_of_accounts`
- `contabilidad.create_journal_entry`
- `contabilidad.post_journal_entry`
- `contabilidad.view_financial_statements`
- `contabilidad.export_financial_reports`
- `contabilidad.view_diot`
- `contabilidad.generate_diot`
- `contabilidad.issue_invoice`
- `contabilidad.view_fiscal_documents`

### 💼 Tesorero
Permisos para gestión de tesorería:
- `tesoreria.view_bank_balances`
- `tesoreria.conciliate_bank`
- `tesoreria.register_bank_movement`
- `tesoreria.create_payment_request`
- `tesoreria.authorize_payment`
- `tesoreria.execute_payment`
- `tesoreria.view_cash_flow`
- `tesoreria.view_treasury_reports`

### 📊 Gerente
Permisos de visualización gerencial:
- `usuarios.view_dashboard`
- `usuarios.view_consolidado`
- `pos.view_all_sales`
- `pos.view_pos_reports`
- `pos.view_sales_statistics`
- `tesoreria.view_bank_balances`
- `tesoreria.view_cash_flow`
- `tesoreria.view_treasury_reports`
- `contabilidad.view_financial_statements`

---

## 🔐 USO EN EL CÓDIGO

### Backend (Django)
```python
# Verificar permiso en vista
if request.user.has_perm('pos.authorize_cancellation'):
    # Permitir autorización
    pass

# En un ViewSet
class MyViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
```

### Frontend (React)
```javascript
// En componentes
const { hasPermission } = useAuth();

{hasPermission('pos.authorize_cancellation') && (
    <Button>Autorizar</Button>
)}

// Proteger páginas
const canAccess = user?.is_staff || hasPermission?.('pos.authorize_cancellation');
if (!canAccess) {
    return <AccessDenied />;
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Migraciones**: Después de actualizar permisos, ejecutar:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Superusuarios**: Los superusuarios (`is_superuser=True`) tienen todos los permisos automáticamente.

3. **Staff**: Los usuarios staff (`is_staff=True`) pueden acceder al admin pero NO tienen permisos automáticos.

4. **Permisos vs Grupos**: Se recomienda asignar permisos a través de Grupos (roles) en lugar de directamente a usuarios.

---

**Última actualización**: 27 de Diciembre 2025  
**Total de permisos**: 70+  
**Módulos cubiertos**: 5 (Usuarios, POS, Tesorería, Contabilidad, RRHH*)  

*RRHH en desarrollo
