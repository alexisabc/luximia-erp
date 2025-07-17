# **Documentación del Proyecto: Luximia ERP**

* **Versión:** 2.0
* **Fecha de última actualización:** 07 de julio de 2025
* **Resumen:** Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP. El sistema cuenta con un módulo avanzado de Cuentas por Cobrar (CXC) que incluye generación de planes de pago, cálculo de intereses y un estado de cuenta detallado.

***

### ## 1. Visión General del Proyecto

#### 1.1. Objetivo Principal
Desarrollar un sistema web interno para **Grupo Luximia** que centralice y automatice la gestión de Cuentas por Cobrar (CXC) con una lógica financiera completa, similar a un crédito bancario.

#### 1.2. Módulos Futuros (Visión ERP)
El proyecto está diseñado para expandirse y reemplazar sistemas existentes como ENKONTROL y Contpaqi, añadiendo módulos de Punto de Venta, Gestión de Proyectos y Contabilidad.

#### 1.3. Stack Tecnológico Principal
* **Backend:** Python con **Django Rest Framework**.
* **Frontend:** JavaScript con **Next.js** y **Tailwind CSS**.
* **Base de Datos:** PostgreSQL.
* **Contenerización:** **Docker** y **Docker Compose** para el entorno de desarrollo local.
* **Autenticación:** JSON Web Tokens (JWT).
* **Control de Versiones:** Git y GitHub.

***

### ## 2. Arquitectura del Backend

El backend (`luximia_erp`) está organizado en apps modulares, siendo `cxc` la principal.

* **Lógica de Negocio Clave:**
    * Al crear un **Contrato**, el sistema genera automáticamente un **Plan de Pagos** (calendario de amortización).
    * La API calcula y expone en tiempo real un resumen financiero por contrato, incluyendo **total pagado, adeudo capital, intereses generados y adeudo al corte**.
    * El modelo `Pago` fue extendido para capturar un alto nivel de detalle por cada transacción.
* **Automatización:** Se utiliza un **management command** personalizado para crear el superusuario inicial de forma segura en cualquier entorno, leyendo las credenciales desde variables de entorno.

***

### ## 3. Arquitectura del Frontend

La interfaz (`luximia_erp_ui`) es una única Single-Page Application (SPA) que consume la API del backend.

* **Funcionalidades Clave Implementadas:**
    * **Estado de Cuenta Detallado:** La página de detalle de contrato es el centro del sistema, mostrando un resumen financiero, el plan de pagos completo y el historial de transacciones.
    * **Dashboard Financiero:** Los KPIs principales ahora reflejan datos financieros clave como "Saldo Vencido" y "Deuda Total".
    * **Asistente con IA:** Un widget de chat flotante permite realizar consultas en lenguaje natural.
    * **Importadores de Datos:** Interfaces consistentes para la carga masiva de Proyectos, Clientes, UPEs, Contratos y un importador dedicado para el **histórico de pagos**.
* **Experiencia de Usuario (UX):**
    * Sidebar colapsable y responsivo.
    * Resaltado dinámico del enlace activo.
    * Uso de "badges" de colores en las tablas para una fácil identificación de estados.
    * Diseño unificado y profesional en todos los formularios y modales, con soporte para modo oscuro.

***

### ## 4. Procedimientos Operativos

#### 4.1. Configuración del Entorno de Desarrollo
1.  **Requisitos:** Tener **Docker Desktop** instalado y corriendo.
2.  **Iniciar:** En la raíz del proyecto, ejecutar `docker compose up`.
3.  **Frontend:** En otra terminal, `cd frontend/luximia_erp_ui` y ejecutar `npm run dev`.
4.  **Superusuario:** Si es la primera vez, el superusuario se creará automáticamente según las variables en `docker-compose.yml`.

#### 4.2. Flujo de Trabajo con Git
1.  **Iniciar:** `git pull origin main`.
2.  **Guardar:** `git add .` -> `git commit -m "feat: Descripcion del cambio"` -> `git push origin main`.