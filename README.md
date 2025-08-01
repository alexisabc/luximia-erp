# Luximia ERP - Documentación del Proyecto

* **Versión:** 2.3
* **Fecha de última actualización:** 24 de julio de 2025
* **Resumen:** Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP. El sistema cuenta con un módulo de Cuentas por Cobrar (CXC) robusto y una arquitectura de frontend modular y reutilizable.

---

## 1. Visión General del Proyecto

### 1.1. Objetivo Principal
Desarrollar un sistema web interno para **Grupo Luximia** que centralice y automatice la gestión de Cuentas por Cobrar (CXC), con reportes financieros avanzados y una alta capacidad de personalización.

### 1.2. Características Principales
* **Gestión Segura:** La eliminación de registros clave (Proyectos, Clientes, UPEs, Contratos) se ha reemplazado por un sistema de **desactivación (soft delete)** para prevenir la pérdida de datos.
* **Dashboard Estratégico:** Una nueva interfaz de Business Intelligence que muestra proyecciones de **Ventas, Cobranza, Programado y Morosidad**. Los datos se pueden **filtrar por proyecto y por periodo** (semanal, mensual, anual).
* **Reportes Personalizados:**
    * **PDF:** Generación de un estado de cuenta profesional para el cliente, con **columnas seleccionables** y el **logo de la empresa como marca de agua**.
    * **Excel:** Exportación de reportes para cada módulo (Proyectos, Clientes, etc.) con **columnas seleccionables**, formatos de celda y el logo de la empresa.
* **Gestión de Clientes:** Formularios en el frontend permiten el **alta, edición y listado** de clientes aprovechando componentes reutilizables.
* **Lógica Financiera Automática:** El estado del plan de pagos se recalcula tras cada transacción (creación, edición o eliminación de pagos).
* **Automatización de Tipo de Cambio:** El tipo de cambio oficial de Banxico se obtiene y almacena diariamente de forma automática a través de un Cron Job.
* **Contraseñas Seguras:** Las claves de usuario se cifran con **Argon2** y una sal aleatoria para mayor seguridad.

### 1.3. Stack Tecnológico
* **Backend:** Python con **Django Rest Framework**.
* **Frontend:** JavaScript con **Next.js** y **Tailwind CSS**.
* **Base de Datos:** PostgreSQL.
* **Procesamiento de Datos:** **Polars** para la manipulación de datos en importaciones y exportaciones.
* **Contenerización:** **Docker** y **Docker Compose**.
* **Despliegue:** **Vercel** (Frontend) y **Render** (Backend, Base de Datos y Cron Jobs).

---

## 2. Arquitectura del Frontend (Refactorización Mayor)
La interfaz ha sido refactorizada a una arquitectura basada en componentes reutilizables para mejorar la mantenibilidad y escalabilidad del proyecto:
* **`ReusableTable`:** Componente de tabla inteligente que renderiza datos y genera automáticamente los botones de acción (Ver, Editar, Eliminar) según las funciones que recibe.
* **`FormModal`:** Modal genérico que construye formularios de creación y edición de forma dinámica.
* **`ConfirmationModal` y `ExportModal`:** Componentes reutilizables para las ventanas de confirmación y selección de columnas de exportación.

---

## 3. Procedimientos Operativos

### 3.1. Configuración del Entorno de Desarrollo
1.  **Requisitos:** Tener **Docker Desktop** instalado y corriendo.
2.  **Clonar:** Clonar el repositorio de GitHub.
3.  **Archivo `.env`**: Crear un archivo `.env` en la raíz (usar `.env.example` como plantilla) y llenarlo con las credenciales locales y el token de Banxico.
4.  **Iniciar Servicios:** En la raíz del proyecto, ejecutar `docker-compose up -d --build`.
5.  **Iniciar Frontend:** En una terminal separada, navegar a `frontend/luximia_erp_ui` y ejecutar `npm run dev`.
6.  **Acceso:** Backend en `http://localhost:8000/api/` y Frontend en `http://localhost:3000`.
7.  **Fechas en Español:** El contenedor genera automáticamente el locale `es_ES.UTF-8`, por lo que las fechas se mostrarán en español tanto en desarrollo como en producción.

### 3.2. Flujo de Trabajo con Git (Recomendado)
Se recomienda el uso de ramas para cada nueva funcionalidad.
1.  **Sincronizar:** `git checkout main` y `git pull`.
2.  **Crear Rama:** `git checkout -b feat/nombre-de-la-funcionalidad`.
3.  **Trabajar y Guardar:** `git add .` -> `git commit -m "feat: Descripcion del cambio"`.
4.  **Subir Rama:** `git push origin feat/nombre-de-la-funcionalidad`.
5.  **Integrar:** Crear un **Pull Request** en GitHub para revisar y fusionar los cambios a `main`.