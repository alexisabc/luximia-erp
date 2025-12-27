# 🚀 Despliegue y DevOps

## 🐳 Docker (Entorno Local)

El proyecto utiliza `docker-compose` para orquestar los servicios.

### Servicios Definidos
1.  **db (PostgreSQL 17):** Persistencia de datos. Puerto `5432`.
2.  **backend (Django):** API REST. Puerto `8000`.
3.  **frontend (Next.js):** UI. Puerto `3000`.
4.  **redis:** Broker de mensajes para Celery (Tareas en segundo plano).
5.  **worker:** Ejecuta tareas pesadas (envío de emails, reportes largos).
6.  **mailhog:** Servidor SMTP falso para pruebas de correo (`http://localhost:8025`).

### Comandos Útiles

**Iniciar sistema:**
```bash
docker-compose up -d --build
```
*(La bandera `-d` corre los contenedores en segundo plano)*.

**Ver logs (en vivo):**
```bash
docker-compose logs -f backend
```

**Ejecutar migraciones manuales:**
```bash
docker-compose exec backend python manage.py migrate
```

**Crear superusuario:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

## 🛡️ NGINX Reverse Proxy (Híbrido)

El sistema utiliza NGINX como un **Reverse Proxy** seguro y optimizado, compatible con Next.js Standalone (SSR).

### Características
- **Hybrid Mode:** Funciona tanto en local (`localhost:3000`) como en producción.
- **Seguridad:** Inyecta headers anti-XSS (`HttpOnly`, `SameSite=Lax`) y `X-Frame-Options`.
- **Performance:** Habilita **Gzip** para compresión de assets y maneja el caching.
- **HMR Support:** Soporta Hot-Module-Reloading para desarrollo local (WebSockets).

### Configuración
El archivo de configuración se encuentra en `frontend/erp_ui/nginx.conf`.
Si necesitas ajustar los tiempos de espera o el tamaño máximo de subida, edita este archivo y reconstruye el contenedor.

---

## 🌐 Variables de Entorno (`.env`)

¡NUNCA SUBIR EL `.env` AL REPOSITORIO!

**Variables Críticas:**
- `SECRET_KEY`: Llave criptográfica de Django.
- `POSTGRES_PASSWORD`: Contraseña de la DB.
- `SENDGRID_API_KEY`: Para envío de correos reales.
- `OPENAI_API_KEY`: Para funcionalidad de IA.

---
**Producción:** El despliegue se realiza en una arquitectura Serverless/Containerizada (ej. Render.com o AWS ECS) usando las imágenes de Docker optimizadas (`target: production`).
