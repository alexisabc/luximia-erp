Documentación del Proyecto: CRM Luximia
Versión: 1.0

Fecha de última actualización: 01 de julio de 2025

Resumen: Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema CRM Luximia, diseñado para la gestión de cuentas por cobrar de una desarrolladora inmobiliaria, con planes de expansión a un sistema ERP completo.

## 1. Visión General del Proyecto
1.1. Objetivo Principal
Desarrollar un sistema web interno para Grupo Luximia que centralice y automatice la gestión de Cuentas por Cobrar (CXC). El sistema maneja el ciclo de vida completo de una venta inmobiliaria, desde la gestión de unidades (UPEs) y clientes hasta el registro de contratos y pagos.

1.2. Módulos Futuros (Visión ERP)
El proyecto está diseñado con una arquitectura modular para facilitar su expansión futura y reemplazar sistemas existentes. Los módulos planeados son:

Punto de Venta (POS): Con capacidad de operación offline/online.

Gestión de Proyectos (ENKONTROL): Para el control de obra y avances.

Contabilidad (Contpaqi): Para la integración de facturación y pólizas contables.

1.3. Stack Tecnológico Principal
Backend: Python con Django Rest Framework.

Frontend: JavaScript con Next.js y Tailwind CSS.

Base de Datos: PostgreSQL (en producción), SQLite (en desarrollo).

Autenticación: JSON Web Tokens (JWT) a través de djangorestframework-simplejwt.

Control de Versiones: Git y GitHub.

## 2. Arquitectura del Backend (Django)
El backend está construido como un proyecto de Django que contiene múltiples "apps", donde cada app representa un módulo de negocio.

2.1. Estructura de Módulos (Apps)
api (o cxc): Módulo principal de Cuentas por Cobrar. Gestiona los modelos, vistas y lógica de negocio relacionados con el flujo de ventas y pagos.

punto_de_venta (futuro): Contendrá la lógica del POS.

contabilidad (futuro): Contendrá los modelos y la lógica contable.

2.2. Modelos de Datos (models.py)
La base de datos es unificada y relacional. Los modelos principales son:

Proyecto: Representa un desarrollo inmobiliario (ej. "Shark Tower").

Cliente: Almacena la información de los compradores.

UPE: Unidad de Propiedad Exclusiva (lote, departamento). Tiene una relación ForeignKey con Proyecto.

Contrato: Vincula una UPE con un Cliente. Usa on_delete=PROTECT para evitar la eliminación de UPEs o Clientes con contratos activos.

Pago: Registra los abonos realizados a un Contrato. Tiene una @property (monto_en_mxn) para calcular el valor en pesos.

2.3. API Endpoints (views.py y urls.py)
Se utiliza Django Rest Framework (DRF) para crear una API RESTful.

ViewSets: Se usa ModelViewSet para proporcionar endpoints CRUD (GET, POST, PUT, DELETE) para cada modelo.

Serializers (serializers.py):

Serializers de Lectura (...ReadSerializer): Se usan para las peticiones GET. Anidan información de modelos relacionados para enviar respuestas completas y útiles al frontend (ej. ContratoReadSerializer incluye los datos del cliente y de la UPE).

Serializers de Escritura (...WriteSerializer): Se usan para POST y PUT. Aceptan IDs para las relaciones, simplificando la creación y actualización de objetos.

Acciones Personalizadas (@action): Se han creado endpoints específicos para necesidades particulares:

/api/users/all/ y /api/groups/all/: Devuelven listas completas sin paginación para la gestión de usuarios.

/api/upes/disponibles/: Filtra solo las UPEs con estado "Disponible".

/api/contratos/<id>/pagos/: Devuelve todos los pagos de un contrato específico.

/api/contratos/<id>/pdf/: Genera y descarga un estado de cuenta en PDF usando la librería WeasyPrint.

Endpoints de Business Intelligence:

/api/dashboard-stats/: Provee KPIs para el dashboard principal.

/api/charts/valor-por-proyecto/: Entrega datos formateados para las gráficas, usando agregaciones de Django (Sum, Case, When).

2.4. Autenticación y Permisos
Tokens JWT: El acceso a la API está protegido y requiere un Bearer Token en la cabecera de autorización. Se usa una vista MyTokenObtainPairView personalizada para añadir permisos de usuario al payload del token.

Permisos Personalizados: Se usan los permisos de Django para un control de acceso granular. Por ejemplo, el permiso api.add_pago permite a un usuario registrar un pago. Estos permisos se validan tanto en el backend como en el frontend para mostrar/ocultar botones y funcionalidades.

## 3. Arquitectura del Frontend (Next.js)
El frontend es una Single-Page Application (SPA) construida con Next.js y el App Router.

3.1. Estructura de Rutas y Componentes
app/: La estructura de carpetas dentro de app/ define las rutas de la aplicación.

/layout.js: Define la estructura principal que envuelve toda la aplicación, incluyendo el Sidebar de navegación.

/contratos/[id]/page.js: Ejemplo de ruta dinámica para mostrar el detalle de un objeto específico.

components/: Contiene componentes reutilizables como Modal.js, ReusableTable.js y Sidebar.js.

services/api.js: Centraliza todas las llamadas a la API del backend usando la librería Axios. Un interceptor de Axios maneja automáticamente la inyección y el refresco de los tokens JWT.

context/AuthContext.js: Gestiona el estado global de autenticación (tokens, información de usuario, permisos). Provee un hook useAuth para acceder a esta información desde cualquier componente.

hooks/: Contiene hooks personalizados, como useResponsivePageSize para adaptar el número de filas de las tablas al tamaño de la pantalla.

3.2. Flujo de Autenticación
El usuario ingresa credenciales en la página de Login.

Se realiza una petición POST a /api/token/.

Si es exitosa, los tokens JWT (access y refresh) se guardan en localStorage.

El AuthContext decodifica el token para obtener los datos y permisos del usuario.

Las rutas protegidas y los componentes dinámicos usan la información del AuthContext para renderizarse. El Sidebar, por ejemplo, oculta los enlaces a los que el usuario no tiene permiso.

3.3. Funcionalidades Clave Implementadas
CRUD Completo: Para los módulos de Proyectos, Clientes, UPEs y Contratos, con modales para creación/edición.

Dashboard: Tarjetas de KPIs y gráficas (usando Chart.js) que consumen los endpoints de Business Intelligence del backend.

Estado de Cuenta: La página de detalle del contrato (/contratos/[id]) funciona como un estado de cuenta completo, listando todos los pagos y permitiendo registrar nuevos pagos y descargar el PDF.

Manejo de Permisos en UI: Los botones de acción (Crear, Editar, Eliminar) y los enlaces de navegación están condicionados por los permisos del usuario (hasPermission('api.add_pago')).

## 4. Procedimientos Operativos
4.1. Configuración del Entorno de Desarrollo
Clonar el Repositorio: git clone <URL_DEL_REPO>

Configurar Backend:

cd backend

python -m venv env

source env/bin/activate (o env\Scripts\activate en Windows)

pip install -r requirements.txt

Crear archivo .env con las variables de entorno necesarias.

python manage.py migrate

python manage.py runserver

Configurar Frontend:

cd frontend/nombre-del-proyecto-ui

npm install

Crear archivo .env.local con NEXT_PUBLIC_API_URL=http://127.0.0.1:8000.

npm run dev

4.2. Flujo de Trabajo con Git
Iniciar: Antes de empezar a trabajar, traer los últimos cambios: git pull origin main.

Trabajar: Realizar los cambios en el código.

Guardar: Guardar los cambios en el repositorio con mensajes descriptivos.

git add .

git commit -m "Work: Descripcion del cambio"

git push origin main