# **Documentación del Proyecto: Luximia ERP**

* **Versión:** 1.1
* **Fecha de última actualización:** 01 de julio de 2025
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
* **Base de Datos:** PostgreSQL (en producción), SQLite (en desarrollo).
* **Inteligencia Artificial:** Integración con API de **OpenAI** para consultas en lenguaje natural.
* **Autenticación:** JSON Web Tokens (JWT) a través de `djangorestframework-simplejwt`.
* **Control de Versiones:** Git y GitHub.

***

### ## 2. Arquitectura del Backend (Django)

El backend (`luximia_erp`) contiene múltiples "apps" que representan los módulos de negocio.

#### 2.1. Estructura de Módulos (Apps)
* **`cxc`**: Módulo principal de **Cuentas por Cobrar**. Gestiona los modelos, vistas y lógica de negocio.
* **`punto_de_venta` (futuro):** Contendrá la lógica del POS.
* **`contabilidad` (futuro):** Contendrá los modelos y la lógica contable.

#### 2.2. Modelos de Datos (`models.py`)
La base de datos es unificada. Los modelos principales son `Proyecto`, `Cliente`, `UPE`, `Contrato` y `Pago`. El modelo **`Pago`** ha sido extendido para incluir un desglose detallado de la transacción, como `instrumento_pago`, `banco_origen`, `fecha_ingreso_cuentas`, etc.

#### 2.3. API Endpoints (`views.py` y `urls.py`)
Se utiliza **Django Rest Framework (DRF)** para crear una API RESTful.
* **`ViewSets`**: Proporcionan endpoints CRUD para cada modelo.
* **Serializers**: Se dividen en `ReadSerializer` (para obtener datos detallados) y `WriteSerializer` (para crear/actualizar). El `ClienteSerializer` fue modificado para incluir los proyectos asociados a cada cliente.
* **Acciones y Vistas Personalizadas**:
    * `/api/importar-pagos-historicos/`: Nuevo endpoint para la carga masiva de pagos desde un archivo CSV.
    * `/api/consulta-inteligente/`: Endpoint que procesa preguntas en lenguaje natural, las traduce usando la API de **OpenAI** a un JSON estructurado y ejecuta una consulta segura a la base de datos.
    * `/api/charts/upe-status/`: Provee datos agregados para la gráfica de estado de UPEs.
    * Otras acciones para PDFs, datos de dashboard y listas sin paginación.

***

### ## 3. Arquitectura del Frontend (Next.js)

La interfaz (`luximia_erp_ui`) es una **única** Single-Page Application (SPA) que consume la API del backend.

#### 3.1. Funcionalidades Clave Implementadas
* **CRUDs Completos y Estilizados:** Módulos para gestionar Proyectos, Clientes, UPEs y Contratos con una interfaz consistente.
* **Dashboard Avanzado:**
    * Tarjetas de KPIs con métricas clave del negocio.
    * Gráfica de barras de "Valor por Proyecto".
    * **Nueva Gráfica de Dona** para visualizar el estado del inventario de UPEs.
* **Estado de Cuenta Detallado:**
    * El formulario para **agregar pagos** ha sido rediseñado con un layout de múltiples columnas y ahora incluye todos los nuevos campos detallados del modelo `Pago`.
    * La tabla de historial de pagos ahora muestra la información con **etiquetas de colores (badges)** para una mejor visualización.
* **Páginas de Importación Dedicadas:**
    * Se implementó una página en `/importar/pagos` con una interfaz de "arrastrar y soltar" para la **carga masiva del histórico de pagos**. Incluye descarga de plantilla y feedback detallado de errores.
* **Asistente con IA:**
    * Un **widget de chat flotante** permite a los usuarios realizar consultas en lenguaje natural (ej. "¿cuántos contratos tiene el cliente X?").
    * El chat presenta las respuestas de forma amigable, formateando listas de resultados y mostrando un efecto de tipeo para una mejor experiencia de usuario.

#### 3.2. Estructura y Lógica
La aplicación utiliza el App Router de Next.js. La lógica de negocio está separada en:
* **`components/`**: Componentes reutilizables (`Modal`, `ReusableTable`, `ChatInteligente`, etc.).
* **`services/api.js`**: Centraliza todas las llamadas a la API con Axios.
* **`context/AuthContext.js`**: Gestiona el estado global de autenticación y permisos.

***

### ## 4. Procedimientos Operativos

#### 4.1. Configuración del Entorno de Desarrollo
1.  **Clonar:** `git clone <URL_DEL_REPO>` y `cd` a la carpeta raíz.
2.  **Backend:** `cd backend`, crear y activar entorno virtual, `pip install -r requirements.txt`, configurar `.env`, `python manage.py migrate`, `python manage.py runserver`.
3.  **Frontend:** `cd frontend/luximia_erp_ui`, `npm install`, configurar `.env.local`, `npm run dev`.

#### 4.2. Flujo de Trabajo con Git
1.  **Iniciar:** `git pull origin main`.
2.  **Guardar:** `git add .` -> `git commit -m "feat: Descripcion del cambio"` -> `git push origin main`.