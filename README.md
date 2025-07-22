# Luximia ERP - Documentación del Proyecto

* **Versión:** 2.2
* **Fecha de última actualización:** 22 de julio de 2025
* **Resumen:** Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP. El sistema cuenta con un módulo de Cuentas por Cobrar (CXC) robusto, completo y desplegado en producción.

---

## 1. Visión General del Proyecto

### 1.1. Objetivo Principal
Desarrollar un sistema web interno para **Grupo Luximia** que centralice y automatice la gestión de Cuentas por Cobrar (CXC), incluyendo la generación de planes de pago, cálculo de intereses y un estado de cuenta detallado para cada contrato.

### 1.2. Características Principales
* **CRUD Completo de Pagos:** Funcionalidad completa para registrar, ver, editar y eliminar pagos.
* **Lógica Financiera Automática:** El estado del plan de pagos y los resúmenes financieros se recalculan tras cada transacción.
* **Reportes Personalizados:**
    * **PDF:** Generación de un estado de cuenta profesional para el cliente.
    * **Excel:** Exportación de un reporte con **columnas seleccionables**, formatos de celda (fecha, contabilidad) y el **logo de la empresa** en el encabezado.
* **Automatización de Tipo de Cambio:** El tipo de cambio oficial de Banxico se obtiene y almacena diariamente de forma automática.
* **Importadores de Datos:** Módulos para la carga masiva de datos desde archivos CSV, con plantillas de Excel que incluyen instrucciones para el usuario.
* **Asistente con IA:** Interfaz de chat para realizar consultas a la base de datos en lenguaje natural.

### 1.3. Stack Tecnológico
* **Backend:** Python con **Django Rest Framework**.
* **Frontend:** JavaScript con **Next.js** y **Tailwind CSS**.
* **Base de Datos:** PostgreSQL.
* **Procesamiento de Datos:** **Polars** para la manipulación de datos en importaciones y exportaciones.
* **Contenerización:** **Docker** y **Docker Compose**.
* **Despliegue:** **Vercel** (Frontend) y **Render** (Backend, Base de Datos y Cron Jobs).

---

## 2. Automatización y Tareas Programadas
El sistema cuenta con un proceso automatizado para la actualización del tipo de cambio:
* **Comando:** `python manage.py obtener_tipo_cambio`.
* **Fuente:** API del Sistema de Información Económica (SIE) de Banxico.
* **Ejecución en Producción:** Se ejecuta diariamente a través de un **Cron Job** configurado en **Render**.

---

## 3. Procedimientos Operativos

### 3.1. Configuración del Entorno de Desarrollo
1.  **Requisitos:** Tener **Docker Desktop** instalado y corriendo.
2.  **Clonar:** Clonar el repositorio de GitHub.
3.  **Archivo `.env`**: Crear un archivo `.env` en la raíz del proyecto (usar `.env.example` como plantilla) y llenarlo con las credenciales locales y el token de Banxico.
4.  **Iniciar Servicios:** En la raíz del proyecto, ejecutar `docker-compose up -d --build`.
5.  **Iniciar Frontend:** En una terminal separada, navegar a `frontend/luximia_erp_ui` y ejecutar `npm run dev`.
6.  **Acceso:** Backend en `http://localhost:8000/api/` y Frontend en `http://localhost:3000`.

### 3.2. Flujo de Trabajo con Git (Recomendado)
Se recomienda el uso de ramas para cada nueva funcionalidad.
1.  **Sincronizar:** `git checkout main` y `git pull`.
2.  **Crear Rama:** `git checkout -b feat/nombre-de-la-funcionalidad`.
3.  **Trabajar y Guardar:** `git add .` -> `git commit -m "feat: Descripcion del cambio"`.
4.  **Subir Rama:** `git push origin feat/nombre-de-la-funcionalidad`.
5.  **Integrar:** Crear un **Pull Request** en GitHub para revisar y fusionar los cambios a `main`.