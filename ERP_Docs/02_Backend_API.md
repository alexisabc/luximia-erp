# 🐍 Backend API (Django)

El backend es el núcleo de la lógica de negocio. Está organizado modularmente en "Apps" de Django.

## 📂 Estructura de Directorios (`backend/`)

- `config/`: Configuración global (`settings.py`, `urls.py`).
- `contabilidad/`: **[CORE]** Gestión financiera, Proyectos, Clientes.
- `rrhh/`: Recursos Humanos, Empleados, Nómina.
- `users/`: Autenticación, Passkeys, Gestión de Usuarios.
- `auditoria/`: Logs y trazabilidad.

## 🧩 Apps Principales

### 1. Contabilidad (`backend/contabilidad`)
Módulo más extenso. Maneja el flujo de dinero.
- **Modelos Clave:**
    - `Proyecto`, `UPE` (Unidad Privativa).
    - `Cliente`, `Contrato`, `Presupuesto`.
    - `Pago` (Ingresos), `PlanPago` (Programado).
    - `TipoCambio` (Manual y Banxico).
- **API ViewSets:** `api/contabilidad/`
    - `/proyectos`, `/clientes`, `/contratos`.
    - `/dashboard/strategic/`: Endpoint especial de agregación de datos para gráficas.

### 2. RRHH (`backend/rrhh`)
Gestión del capital humano y Nómina.
-   **Modelos Clave:**
    -   `Empleado` (Vinculado a `CustomUser`).
    -   `Departamento`, `Puesto`.
    -   `Nomina`, `ReciboNomina`, `ConfiguracionEconomica` (UMA, tablas ISR).
-   **Motor de Cálculo (`engine.py`):**
    -   Cálculo de ISR (Reglones/Tablas), Subsidio.
    -   **IMSS:** Cálculo cuotas Obrero/Patronal detallado.
    -   **Presupuestos:** Proyección de costo anual por empleado.
-   **Servicios Nuevos:**
    -   `NominaImporter`: Carga masiva desde Excel.
    -   `NominaIOService`: Generación de archivos **SUA** e **IDSE**.
-   **Relaciones:** Un `Empleado` pertenece a un `Departamento` y tiene un `Puesto`.

### 3. Usuarios (`backend/users`)
Gestión de identidad.
- **Modelo:** `CustomUser` (Extiende `AbstractUser`).
    - Campos extra: `passkey_credentials`, `totp_secret`.
- **Autenticación:**
    - `enrollment/`: Flujo de alta de nuevos usuarios vía Token.
    - `invite/`: Envío de correos de invitación.

## ⚙️ Configuración Clave (`settings.py`)

- **CORS:** Configurado para permitir peticiones solo desde el dominio del frontend.
- **CSRF:** Protección activada incluso para API calls (vía headers).
- **Cloudflare R2:** Backend de almacenamiento para archivos estáticos/media.
