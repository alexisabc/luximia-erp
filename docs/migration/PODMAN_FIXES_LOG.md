# Registro de Correcciones del Entorno de Desarrollo Podman

Fecha: 2026-01-03
Estado: ✅ **Exitoso**

## Resumen de Problemas y Soluciones

### 1. Incompatibilidad de `podman-compose`
- **Problema**: `podman-compose` fallaba al encontrar imágenes locales y gestionar dependencias de build.
- **Solución**: Se implementó `scripts/podman_start.sh`, un script bash robusto que orquesta la construcción y ejecución de contenedores usando comandos nativos de `podman`.

### 2. Error de Build Frontend
- **Problema 1 (Contexto)**: El contexto de build era `.` (raíz), causando que `COPY package.json` copiara el archivo incorrecto (Husky) en lugar del de Next.js.
  - *Fix*: Se cambió el contexto a `./frontend/erp_ui`.
- **Problema 2 (Dependencias)**: Faltaba `dexie-react-hooks` en `package.json`, rompiendo la compilación.
  - *Fix*: Se agregó la dependencia.

### 3. Errores de Runtime Frontend
- **Problema**: `EACCES: permission denied` al intentar escribir en `/app/.next`.
- **Solución**: Se agregó un volumen anónimo `-v /app/.next` para aislar la carpeta de build del sistema de archivos del host (rootless compatibility).

### 4. Errores de Backend y Celery Crash
- **Problema 1 (Imports)**: `ModuleNotFoundError: No module named 'rrhh.views.asistencia_views'`. La estructura de archivos mezclaba `views.py` con carpeta `views/`.
  - *Fix*: Se refactorizó `views.py` a `views/general_views.py` y se creó `views/__init__.py` para unificar el paquete.
- **Problema 2 (Race Condition)**: Backend y Workers intentaban ejecutar migraciones simultáneamente, causando `ProgrammingError: relation already exists`.
  - *Fix*: Se modificó `backend/entrypoint.sh` para que los workers (`celery`) omitan el paso de migración.

### 5. Configuración de Red y Branding
- **Problema**: Los contenedores no se veían entre sí (ej. Backend -> Mailhog) y usaban nombres antiguos (`luximia`).
- **Solución**: 
  - Se agregaron `--network-alias` (mailhog, redis, db) a todos los contenedores.
  - Se renombraron todos los recursos a `sistema-erp-*`.

## Estado Final
Todos los servicios (`db`, `redis`, `mailhog`, `backend`, `frontend`, `workers`) están operativos y estables.
