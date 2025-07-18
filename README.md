# Luximia ERP - Documentación del Proyecto

* **Versión:** 2.0
* **Fecha de última actualización:** 18 de julio de 2025
* **Resumen:** Este documento detalla la arquitectura, funcionalidades y procedimientos del sistema Luximia ERP. El sistema cuenta con un módulo avanzado de Cuentas por Cobrar (CXC) con una lógica financiera completa.

---

## 1. Visión General del Proyecto

### 1.1. Objetivo Principal
Desarrollar un sistema web interno para **Grupo Luximia** que centralice y automatice la gestión de Cuentas por Cobrar (CXC), incluyendo la generación de planes de pago, cálculo de intereses y un estado de cuenta detallado para cada contrato.

### 1.2. Características Principales
* **Gestión de Contratos:** Creación de contratos con términos financieros (enganche, mensualidades, tasa de interés) que generan automáticamente un plan de pagos.
* **CRUD Completo de Pagos:** Funcionalidad completa para registrar, ver, **editar** y **eliminar** pagos, con una lógica que recalcula automáticamente el estado del contrato y el plan de pagos.
* **Estado de Cuenta en PDF:** Generación de un estado de cuenta profesional y limpio en formato PDF para los clientes.
* **Dashboard Financiero:** KPIs en tiempo real que muestran la salud financiera de la cartera, incluyendo "Saldo Vencido" y "Deuda Total".
* **Asistente con IA:** Interfaz de chat para realizar consultas a la base de datos en lenguaje natural.
* **Importadores de Datos:** Módulos para la carga masiva de datos históricos desde archivos CSV.

### 1.3. Stack Tecnológico
* **Backend:** Python con **Django Rest Framework**.
* **Frontend:** JavaScript con **Next.js** y **Tailwind CSS**.
* **Base de Datos:** PostgreSQL.
* **Contenerización:** **Docker** y **Docker Compose** para el entorno de desarrollo local.
* **Despliegue:** **Vercel** para el Frontend y **Render** para el Backend y la Base de Datos.

---

## 2. Arquitectura del Backend
El backend (`luximia_erp`) está organizado en apps modulares, siendo `cxc` la principal.

* **Lógica de Negocio Clave:**
    * Al crear un **Contrato**, el sistema genera automáticamente un **Plan de Pagos** (calendario de amortización), asegurando que la suma de las cuotas sea exacta al céntimo.
    * La API expone un resumen financiero en tiempo real por contrato, incluyendo **total pagado, adeudo capital, intereses y adeudo al corte**, con manejo de múltiples monedas.
    * El modelo `Pago` se actualiza y recalcula el estado del `PlanDePagos` asociado cada vez que se crea, edita o elimina una transacción.

---

## 3. Arquitectura del Frontend
La interfaz (`luximia_erp_ui`) es una Single-Page Application (SPA) robusta que consume la API del backend.

* **Funcionalidades Clave Implementadas:**
    * **Estado de Cuenta Interactivo:** Vista de detalle de contrato que muestra un resumen financiero, el plan de pagos y un historial de transacciones con funcionalidad CRUD completa.
    * **Formularios Completos:** Modales consistentes y profesionales para registrar y editar pagos con todos los campos necesarios.
    * **Experiencia de Usuario (UX):** Diseño unificado, responsivo y con soporte completo para modo oscuro en toda la aplicación.

---

## 4. Procedimientos Operativos

### 4.1. Configuración del Entorno de Desarrollo
1.  **Requisitos:** Tener **Docker Desktop** instalado y corriendo.
2.  **Clonar:** Clonar el repositorio de GitHub.
3.  **Archivo `.env`**: Crear un archivo `.env` en la raíz del proyecto y llenarlo con las variables de entorno necesarias (usar `.env.example` como plantilla).
4.  **Iniciar Backend:** En la raíz del proyecto, ejecutar `docker-compose up -d --build`.
    * El superusuario se creará automáticamente según las variables del archivo `.env`.
5.  **Iniciar Frontend:** En una terminal separada, navegar a la carpeta del frontend y ejecutar los comandos:
    ```bash
    cd frontend/luximia_erp_ui
    npm install
    npm run dev
    ```
6.  **Acceso:**
    * **Backend API:** `http://localhost:8000/api/`
    * **Frontend App:** `http://localhost:3000`

### 4.2. Flujo de Trabajo con Git (Recomendado)
Se recomienda el uso de ramas para cada nueva funcionalidad.
1.  **Sincronizar:** `git checkout main` y `git pull`.
2.  **Crear Rama:** `git checkout -b feat/nombre-de-la-funcionalidad`.
3.  **Trabajar y Guardar:** `git add .` -> `git commit -m "feat: Descripcion del cambio"`.
4.  **Subir Rama:** `git push origin feat/nombre-de-la-funcionalidad`.
5.  **Integrar:** Crear un **Pull Request** en GitHub para revisar y fusionar los cambios a `main`.