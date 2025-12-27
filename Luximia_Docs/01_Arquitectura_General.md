# 🏗 Arquitectura General del Sistema

## 🔄 Flujo de Información
El sistema sigue una arquitectura **Client-Server desacoplada (Headless)**:

1.  **Frontend (Cliente):** Next.js (Standalone) consume datos vía REST API.
2.  **Reverse Proxy (NGINX):** Maneja la seguridad (Headers, SSL Termination en Prod), compresión Gzip y enruta peticiones al Frontend o Backend.
3.  **API Gateway (Django):** Recibe las peticiones, valida autenticación (JWT/Passkeys) y permisos.
3.  **Lógica de Negocio:** ViewSets de DRF procesan la solicitud.
4.  **Persistencia:** PostgreSQL guarda datos relacionales y vectores (para IA).

## 🛠 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js** | 16.0.4 | App Router, Server Actions, Suspense. |
| **UI Lib** | **React** | 19.x | Componentes funcionales, Hooks. |
| **Estilos** | **Tailwind CSS** | 4.0 | Estilizado utility-first. |
| **Backend** | **Django** | 6.0 | Framework web robusto. |
| **API** | **DRF** | 3.16 | API RESTful estandarizada. |
| **DB** | **PostgreSQL** | 17 | Datos relacionales + Vector Extension. |
| **Auth** | **WebAuthn** | FIDO2 | Passkeys (Huella/FaceID). |

## 🛡 Seguridad (Security-First)

### 1. Autenticación Híbrida
- **Passkeys (Principal):** Uso de biometría del dispositivo para login sin contraseña.
- **TOTP (Respaldo):** Código de 6 dígitos (Authenticator App).
- **JWT:** Tokens de acceso (15 min) y refresco (1 día) rotativos.

### 2. Autorización Granular
- **RBAC (Role-Based Access Control):** Permissions a nivel de modelo (`view_cliente`, `add_pago`).
- **Soft Delete:** Los registros nunca se borran físicamente (`activo=False`) excepto por superusuarios (`hard_delete`).

### 3. Protección de Datos
- **Audit Logs:** Cada acción de escritura deja rastro (Quién, Qué, Cuándo).
- **Frontend Validations:** Zod/React Hook Form para validar datos antes de enviar.
