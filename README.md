Documentación del Proyecto: Luximia ERP
Versión: 1.0

Fecha de última actualización: 01 de julio de 2025

Resumen: Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP, diseñado inicialmente para la gestión de cuentas por cobrar de una desarrolladora inmobiliaria, con planes de expansión a un sistema ERP completo.

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
El backend está construido como un proyecto de Django (luximia_erp) que contiene múltiples "apps", donde cada app representa un módulo de negocio.

2.1. Estructura de Módulos (Apps)
cxc: Módulo principal de Cuentas por Cobrar. Gestiona los modelos, vistas y lógica de negocio relacionados con el flujo de ventas y pagos.

punto_de_venta (futuro): Contendrá la lógica del POS.

contabilidad (futuro): Contendrá los modelos y la lógica contable.

2.2. Modelos de Datos (models.py)
La base de datos es unificada y relacional. Los modelos principales residen en la app cxc:

Proyecto: Representa un desarrollo inmobiliario (ej. "Shark Tower").

Cliente: Almacena la información de los compradores.

UPE: Unidad de Propiedad Exclusiva (lote, departamento). Tiene una relación ForeignKey con Proyecto.

Contrato: Vincula una UPE con un Cliente. Usa on_delete=PROTECT para evitar la eliminación de UPEs o Clientes con contratos activos.

Pago: Registra los abonos realizados a un Contrato.

2.3. API Endpoints (views.py y urls.py)
Se utiliza Django Rest Framework (DRF) para crear una API RESTful.

ViewSets: Se usa ModelViewSet para proporcionar endpoints CRUD (GET, POST, PUT, DELETE) para cada modelo.

Serializers (serializers.py):

...ReadSerializer: Para peticiones GET, anidando información de modelos relacionados.

...WriteSerializer: Para POST y PUT, aceptando IDs para las relaciones.

Acciones Personalizadas (@action): Para necesidades particulares:

/api/users/all/ y /api/groups/all/: Listas completas sin paginación.

/api/upes/disponibles/: Filtra UPEs con estado "Disponible".

/api/contratos/<id>/pagos/: Devuelve los pagos de un contrato.

/api/contratos/<id>/pdf/: Genera un PDF del estado de cuenta con WeasyPrint.

Endpoints de Business Intelligence:

/api/dashboard-stats/: Provee KPIs para el dashboard.

/api/charts/valor-por-proyecto/: Entrega datos para gráficas.

2.4. Autenticación y Permisos
Tokens JWT: El acceso a la API requiere un Bearer Token. Se usa MyTokenObtainPairView para añadir permisos al token.

Permisos de Django: Se usan para un control de acceso granular. Por ejemplo, el permiso cxc.add_pago permite a un usuario registrar un pago.

## 3. Arquitectura del Frontend (Next.js)
El frontend es una única Single-Page Application (SPA) (luximia_erp_ui) construida con Next.js y el App Router.

3.1. Estructura de Rutas y Componentes
app/: La estructura de carpetas define las rutas de la aplicación.

components/: Contiene componentes reutilizables (Modal, ReusableTable, Sidebar).

services/api.js: Centraliza las llamadas a la API con Axios, incluyendo un interceptor para manejar tokens JWT.

context/AuthContext.js: Gestiona el estado global de autenticación y permisos con un hook useAuth.

hooks/: Contiene hooks personalizados (useResponsivePageSize).

3.2. Flujo de Autenticación
El usuario se loguea en la página de Login (/api/token/).

Los tokens JWT se guardan en localStorage.

El AuthContext decodifica el token y gestiona la sesión del usuario.

La UI se adapta dinámicamente según los permisos del usuario.

3.3. Funcionalidades Clave Implementadas
CRUD Completo: Para los módulos de Proyectos, Clientes, UPEs y Contratos.

Dashboard: KPIs y gráficas con Chart.js.

Estado de Cuenta: Detalle de contrato con historial de pagos, registro de nuevos abonos y descarga de PDF.

Manejo de Permisos en UI: Los botones y enlaces se muestran u ocultan según los permisos del usuario (ej. hasPermission('cxc.add_pago')).

## 4. Procedimientos Operativos
4.1. Configuración del Entorno de Desarrollo
Clonar el Repositorio: git clone <URL_DEL_REPO> y cd a la carpeta raíz del proyecto (ej. luximia-erp).

Configurar Backend:

cd backend

python -m venv env

source env/bin/activate (o env\Scripts\activate en Windows)

pip install -r requirements.txt

Crear archivo .env con las variables de entorno necesarias.

python manage.py migrate

python manage.py runserver

Configurar Frontend:

cd frontend/luximia_erp_ui

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