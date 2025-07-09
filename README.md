# **Documentación del Proyecto: Luximia ERP**

* **Versión:** 1.2
* **Fecha de última actualización:** 03 de julio de 2025
* **Resumen:** Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP, diseñado para la gestión de cuentas por cobrar, con funcionalidades de importación de datos y un asistente de consulta por IA.

***

### ## 1. Visión General del Proyecto

#### 1.1. Objetivo Principal
Desarrollar un sistema web interno para **Grupo Luximia** que centralice y automatice la gestión de Cuentas por Cobrar (CXC). El sistema maneja el ciclo de vida completo de una venta inmobiliaria, desde la gestión de unidades (UPEs) y clientes hasta el registro de contratos y pagos detallados.

#### 1.2. Módulos Futuros (Visión ERP)
El proyecto está diseñado con una arquitectura modular para facilitar su expansión futura. Los módulos planeados son:
* **Punto de Venta (POS):** Con capacidad de operación offline/online.
* **Gestión de Proyectos (ENKONTROL):** Para el control de obra y avances.
* **Contabilidad (Contpaqi):** Para la integración de facturación y pólizas contables.

#### 1.3. Stack Tecnológico Principal
* **Backend:** Python con **Django Rest Framework**.
* **Frontend:** JavaScript con **Next.js** y **Tailwind CSS**.
* **Base de Datos:** PostgreSQL (en producción y desarrollo con Docker), SQLite (opcional).
* **Inteligencia Artificial:** Integración con API de **OpenAI**.
* **Contenerización:** **Docker** y **Docker Compose** para el entorno de desarrollo.
* **Autenticación:** JSON Web Tokens (JWT).
* **Control de Versiones:** Git y GitHub.

***

### ## 2. Arquitectura del Backend (Django)

El backend (`luximia_erp`) contiene múltiples "apps" que representan los módulos de negocio. La app principal actual es `cxc` (Cuentas por Cobrar).

***

### ## 3. Arquitectura del Frontend (Next.js)

La interfaz (`luximia_erp_ui`) es una **única** Single-Page Application (SPA) que consume la API del backend.


#### 3.1. Funcionalidades Clave Implementadas
* **CRUDs Completos y Estilizados:** Módulos para gestionar Proyectos, Clientes, UPEs y Contratos con una interfaz consistente y responsiva.
* **Dashboard Avanzado:**
    * Tarjetas de KPIs con métricas clave del negocio.
    * Gráfica de barras de "Valor por Proyecto" y una gráfica de dona para el "Estado de UPEs".
* **Estado de Cuenta Detallado:** El formulario para agregar pagos fue rediseñado con un layout de múltiples columnas y ahora incluye todos los nuevos campos detallados del modelo `Pago`.
* **Páginas de Importación Dedicadas:** Interfaces consistentes con "arrastrar y soltar" para la carga de archivos CSV para todos los módulos.
* **Asistente con IA:** Un widget de chat flotante que consume el endpoint de consulta inteligente, con efecto de tipeo y formato amigable de respuestas.
* **Interfaz de Usuario Mejorada (UX):**
    * **Sidebar colapsable** que se adapta al tamaño de la pantalla.
    * Resaltado dinámico del enlace activo en el menú de navegación.
    * Uso de **etiquetas de colores (badges)** en las tablas para una rápida identificación de estados y categorías.
    * **Página de login rediseñada** con un tema oscuro y la funcionalidad de ver/ocultar contraseña.

***

### ## 4. Procedimientos Operativos

#### 4.1. Configuración del Entorno de Desarrollo (Recomendado con Docker)
Este método simula el entorno de producción y es la forma recomendada para trabajar en el proyecto.

1.  **Requisitos:** Tener **Docker Desktop** instalado y corriendo.
2.  **Iniciar el Entorno:** En la carpeta raíz del proyecto, ejecuta:
    ```bash
    docker compose up --build
    ```
    Esto levantará el contenedor del backend (en `http://localhost:8000`) y el de la base de datos PostgreSQL.
3.  **Iniciar Frontend:** En una **segunda terminal**, navega a la carpeta del frontend y ejecuta:
    ```bash
    cd frontend/luximia_erp_ui
    npm run dev
    ```
4.  **Crear Superusuario (la primera vez):** En una **tercera terminal**, ejecuta el siguiente comando para crear un administrador en la base de datos de Docker:
    ```bash
    docker exec -it luximia-backend-local python manage.py createsuperuser
    ```

#### 4.2. Flujo de Trabajo con Git
1.  **Iniciar:** Antes de empezar a trabajar, traer los últimos cambios: `git pull origin main`.
2.  **Guardar:** Guardar los cambios en el repositorio con mensajes descriptivos.
    * `git add .`
    * `git commit -m "feat: Descripcion del cambio"`
    * `git push origin main`