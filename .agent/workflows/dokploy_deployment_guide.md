---
description: Guía de optimización de despliegues en Dokploy y gestión de Producción
---

# Guía de Despliegue Configurada (Dokploy + Docker)

## 1. Automatización de Base de Datos y Migraciones

Hemos configurado el `entrypoint.sh` del Backend para manejar automáticamente el ciclo de vida de la base de datos en cada despliegue.

**Flujo Automático:**
1.  **Espera de DB**: El contenedor espera a que PostgreSQL esté listo (`wait_for_db`).
2.  **Refresco de Colación**: Ejecuta `python manage.py refresh_collation`.
    *   *Optimización*: Ahora incluye `template1`, lo que previene errores al crear nuevas bases de datos tras actualizaciones del sistema operativo del contenedor.
3.  **Setup Sandbox**: Ejecuta `python manage.py init_sandbox`.
    *   Crea la DB `erp-system_sandbox` si no existe.
    *   Ejecuta migraciones específicas para el sandbox.
4.  **Migraciones Principales**: Ejecuta `python manage.py migrate` para la DB de producción.
5.  **Verificaciones de Seguridad**: Asegura la existencia de un superusuario.

**Configuración en Dokploy (Backend):**
*   **Command / Entrypoint**: Asegúrate de que apunte a `sh /app/entrypoint.sh` (o `./entrypoint.sh`).
*   **Variables de Entorno**:
    *   `POSTGRES_DB_SANDBOX`: Nombre de la DB de sandbox (ej. `erp-system_sandbox`).
    *   `DEVELOPMENT_MODE`: Debe ser `False` en Producción.

## 2. Optimización del Build (Frontend & Backend)

### Frontend (Next.js)
*   **Output Standalone**: `next.config.mjs` tiene `output: 'standalone'`.
    *   *Beneficio*: Reduce drásticamente el tamaño de la imagen final al incluir solo los archivos necesarios para correr el servidor, excluyendo devDependencies y archivos intermedios.
*   **Docker Layers**: El Dockerfile usa multi-stage building.
    *   *Acción*: Verifica que tu Dockerfile copie `package.json` antes que el resto del código para aprovechar el caché de Docker si no han cambiado las dependencias.
*   **Generación Estática**:
    *   Tus logs muestran `Generating static pages`. Esto es bueno.
    *   *Mejora*: Configura cabeceras de caché (Cache-Control) en tu servidor web (Traefik/Nginx en Dokploy) para servir archivos de `_next/static` con `max-age=31536000, immutable`.

### Backend (Django)
*   **Dockerfile**: Asegura instalar dependencias (`pip install`) antes de copiar el código fuente (`COPY . .`) para maximizar el caché.
*   **.dockerignore**: Ya está configurado para excluir `venv`, `__pycache__`, `.git`, y logs. Esto hace que el contexto de build sea ligero (~MBs en lugar de GBs).

## 3. Optimización en Dokploy

*   **Git Clone Depth**: Si Dokploy lo permite (a veces en configuración avanzada o build args), configura el `git clone --depth 1`.
    *   *Impacto*: Tus logs muestran `Counting objects: 755`. Una clonación superficial (shallow clone) es mucho más rápida y consume menos ancho de banda.
*   **Resource Limits**: Define límites de CPU/RAM para tus contenedores en Dokploy para evitar que un build consuma todos los recursos del VPS y tire el servicio en producción.

---

**Resumen de Estado Actual:**
✅ **Colación DB**: Corregido (incluye `template1`).
✅ **Migrations**: Automatizadas en Entrypoint.
✅ **Frontend Build**: Optimizado con `standalone` mode.
✅ **Ignore Files**: Correctamente configurados para evitar builds pesados.
