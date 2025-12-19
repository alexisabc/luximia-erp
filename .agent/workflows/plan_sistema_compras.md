# Plan de Implementación: Sistema de Compras, Cuentas por Pagar y Tesorería

Este documento describe la arquitectura para el nuevo sistema híbrido de Órdenes de Compra (OC), Contrarecibos (CR) y Programación de Pagos, diseñado para reemplazar y mejorar el flujo de Enkontrol.

## 1. Arquitectura de Módulos (Backend)

Dado que `contabilidad` actualmente maneja Ventas Inmobiliarias, separaremos la lógica en nuevas aplicaciones para mantener el código limpio:

### A. Nueva App: `compras` (Gestión de Proveedores y OCs)
Responsable de la negociación y formalización del gasto.
- **Modelos**:
    - `Proveedor`: Datos fiscales, cuentas bancarias, plazos de crédito.
    - `Insumo`: Catálogo de bienes/servicios con enlace a Cuentas Contables.
    - `OrdenCompra (OC)`: Cabecera con proveedor, fechas, totales. Estados: `BORRADOR`, `VOBO` (Nivel 1), `AUTORIZADA` (Nivel 2), `RECHAZADA`.
    - `DetalleOC`: Lista de insumos, cantidades, precios y descuentos.
    - `AutorizacionOC`: Registro de quién y cuándo autorizó (VoBo y Final).

### B. App Existente: `tesoreria` (Cuentas por Pagar y Bancos)
Responsable de la validación de facturas y la ejecución del pago.
- **Modelos**:
    - `ContraRecibo (CR)`: El núcleo del flujo "híbrido".
        - Puede nacer de una **OC Autorizada** (flujo normal).
        - Puede nacer de una **Solicitud Directa** (flujo sin factura/anticipo, el modo "híbrido").
        - Campos: XML/PDF (Factura), Fecha Recepción, Fecha Vencimiento, Saldo Pendiente.
        - Estados: `PENDIENTE`, `VALIDADO_FISCALMENTE`, `PROGRAMADO`, `PAGADO_PARCIAL`, `PAGADO_TOTAL`.
    - `ProgramacionPago`: Agrupador de CRs para autorización masiva de salida de dinero.
        - Estados: `BORRADOR`, `AUTORIZADA`, `PROCESADA`.
    - `MovimientoBancario`: Registro real del egreso (Cheque/Transferencia).
    - `LayoutBancario`: Configuración para generar TXT de bancos (Banorte, BBVA, etc.).

### C. App Existente: `contabilidad` (Libro Mayor)
Se extenderá para incluir la contabilidad real.
- **Modelos Nuevos**:
    - `CuentaContable`: Catálogo de cuentas (Activo, Pasivo, etc.).
    - `CentroCostos`: Para segmentar gastos por departamento/obra.
    - `Poliza`: Asientos contables automáticos generados por CRs y Pagos.

---

## 2. Flujo de Trabajo Detallado

1.  **Requisición y Compra (Módulo Compras)**
    *   Usuario genera **OC**.
    *   **Validación 1 (VoBo)**: Revisa precios/presupuesto.
    *   **Validación 2 (Autorización)**: Aprueba la compra.
    *   *Resultado*: La OC cambia a `AUTORIZADA` y queda lista para recibir factura.

2.  **Recepción y Contrarecibo (Módulo Tesorería)**
    *   Usuario sube Factura (XML+PDF) asociada a la OC.
    *   **Sistema**: Valida RFC, Montos vs OC, y vigencia del CFDI.
    *   **Caso Híbrido**: Si no hay factura (anticipo), se crea un "CR Provisional" o "Solicitud de Pago" manual.
    *   *Resultado*: Se genera un **Contrarecibo (CR)** con fecha de pago calculada según días de crédito del proveedor.
    *   *Automático*: Se genera Póliza de Provisión (Gasto vs Proveedor por Pagar).

3.  **Programación de Pagos (Módulo Tesorería)**
    *   Tesorero selecciona CRs vencidos o urgentes y crea una **Programación de Pago**.
    *   Gerencia autoriza la Programación.
    *   Sistema genera **Layout Bancario** (TXT/Excel) para subir al portal del banco.

4.  **Confirmación y Aplicación (Feedback)**
    *   Tesorero confirma que el banco procesó el pago.
    *   Sistema registra el **Pago**, actualiza el saldo del CR y genera Póliza de Egreso (Proveedor por Pagar vs Bancos).
    *   El CR puede quedar con saldo pendiente (pagos parciales).

---

## 3. Entregables Técnicos

### Backend (Django)
1.  **Crear App `compras`**: Migraciones y Modelos.
2.  **Actualizar `tesoreria`**: Modelos de CR y Programación.
3.  **Actualizar `contabilidad`**: Modelos de Cuentas y Pólizas.
4.  **Servicios**:
    - `CFDIValidator`: Leer XML y extraer datos.
    - `BankLayoutGenerator`: Factory para layouts de bancos.
    - `PolicyGenerator`: Lógica para crear asientos contables.

### Frontend (Next.js)
1.  **Dashboard de Compras**: Lista de OCs, Creación, y Panel de Autorización.
2.  **Mesa de Control (Contrarecibos)**: Subida de XML/PDF, validación visual.
3.  **Calendario de Pagos**: Vista de Programación y descarga de layouts.

---

## 4. Pasos de Ejecución Inmediata

1.  Inicializar App `compras`.
2.  Definir Modelos Core: `Proveedor`, `OrdenCompra`, `ContraRecibo`.
3.  Implementar Flujo de Autorización de OCs (2 niveles).
