# Sprint 28: Despliegue de Producción - Resumen Completo

## ✅ Archivos Creados/Actualizados

### 1. Docker Compose de Producción
**Archivo**: [`docker-compose.prod.yml`](file:///home/alexisburgos/proyectos/sistema-erp/docker-compose.prod.yml)

**Características**:
- ✅ Usa imágenes pre-construidas de GHCR
- ✅ Sin restart policies (gestionado por Systemd)
- ✅ Flags `:Z` en todos los volúmenes para SELinux
- ✅ Health checks en todos los servicios
- ✅ Caddy como reverse proxy con SSL automático
- ✅ Variables de entorno desde `.env.prod`

**Servicios**:
1. `db` - PostgreSQL 17 con pgvector
2. `redis` - Cache y message broker
3. `backend` - Django con Gunicorn
4. `frontend` - Next.js standalone
5. `celery_worker` - Procesamiento en background
6. `celery_beat` - Tareas programadas
7. `caddy` - Reverse proxy con HTTPS automático

### 2. Configuración de Caddy
**Archivo**: [`caddy/Caddyfile`](file:///home/alexisburgos/proyectos/sistema-erp/caddy/Caddyfile)

**Características**:
- ✅ HTTPS automático con Let's Encrypt
- ✅ HTTP/3 support
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Health checks para backend y frontend
- ✅ Logging en JSON
- ✅ Redirección www → apex domain

**Rutas configuradas**:
- `/api/*` → backend:8000
- `/admin/*` → backend:8000
- `/static/*` → backend:8000
- `/media/*` → backend:8000
- `/*` → frontend:3000

### 3. Script de Setup del VPS
**Archivo**: [`scripts/prod/setup_vps.sh`](file:///home/alexisburgos/proyectos/sistema-erp/scripts/prod/setup_vps.sh)

**Funcionalidades**:
- ✅ Actualización del sistema
- ✅ Instalación de Podman, podman-compose, Buildah
- ✅ Instalación de Cockpit para monitoreo
- ✅ Creación de usuario `erp_user` (UID 1000)
- ✅ Configuración de linger
- ✅ Puertos sin privilegios (80+)
- ✅ Firewall UFW (22, 80, 443, 9090)
- ✅ Configuración de registros de contenedores

**Uso**:
```bash
sudo bash scripts/prod/setup_vps.sh
```

### 4. GitHub Actions Workflow
**Archivo**: [`.github/workflows/deploy.yml`](file:///home/alexisburgos/proyectos/sistema-erp/.github/workflows/deploy.yml)

**Jobs**:

**Build and Push**:
1. Construye backend con Buildah
2. Construye frontend con Buildah
3. Push a GitHub Container Registry (GHCR)
4. Tagea con `latest` y commit SHA

**Deploy**:
1. SSH al VPS como `erp_user`
2. `git pull` del código
3. Login a GHCR
4. `podman-compose pull` de imágenes
5. `podman-compose down` y `up -d`
6. Ejecuta migraciones
7. Collectstatic
8. Health checks

### 5. Variables de Entorno
**Archivo**: [`.env.prod.example`](file:///home/alexisburgos/proyectos/sistema-erp/.env.prod.example)

Template con todas las variables necesarias para producción.

## 📋 Guía de Despliegue

### Paso 1: Preparar el VPS

```bash
# En tu máquina local, copia el script al VPS
scp scripts/prod/setup_vps.sh user@vps-ip:~

# SSH al VPS
ssh user@vps-ip

# Ejecuta el script de setup
sudo bash setup_vps.sh
```

### Paso 2: Configurar el Proyecto

```bash
# Cambiar a usuario ERP
sudo su - erp_user

# Clonar repositorio (si no se hizo automáticamente)
git clone https://github.com/your-org/sistema-erp.git ~/sistema-erp
cd ~/sistema-erp

# Configurar variables de entorno
cp .env.prod.example .env.prod
nano .env.prod

# Configurar:
# - DOMAIN=your-domain.com
# - ACME_EMAIL=admin@your-domain.com
# - POSTGRES_PASSWORD=strong-password
# - SECRET_KEY=django-secret
# - GITHUB_REPOSITORY=your-org/sistema-erp
```

### Paso 3: Configurar GitHub Secrets

En tu repositorio de GitHub, ve a Settings → Secrets and variables → Actions y agrega:

- `VPS_HOST`: IP o dominio del VPS
- `VPS_USER`: `erp_user`
- `VPS_PORT`: `22` (o tu puerto SSH)
- `SSH_PRIVATE_KEY`: Llave privada SSH para `erp_user`

### Paso 4: Despliegue Inicial

```bash
# En el VPS como erp_user
cd ~/sistema-erp

# Login a GHCR
echo $GITHUB_TOKEN | podman login ghcr.io -u $GITHUB_USER --password-stdin

# Pull de imágenes
export GITHUB_REPOSITORY=your-org/sistema-erp
export IMAGE_TAG=latest
podman-compose -f docker-compose.prod.yml pull

# Iniciar servicios
podman-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
podman exec erp_backend python manage.py migrate

# Crear superusuario
podman exec -it erp_backend python manage.py createsuperuser

# Collectstatic
podman exec erp_backend python manage.py collectstatic --noinput
```

### Paso 5: Configurar Systemd (Opcional)

```bash
# Generar servicios Systemd
bash scripts/prod/generate_systemd.sh

# Verificar servicios
systemctl --user list-units 'container-erp_*'
```

### Paso 6: Configurar DNS

Apunta tu dominio al IP del VPS:
```
A     @              VPS_IP
A     www            VPS_IP
```

### Paso 7: Verificar Despliegue

```bash
# Ver contenedores
podman ps

# Ver logs
podman logs -f erp_backend
podman logs -f erp_caddy

# Verificar health
curl http://localhost:8000/health/
curl https://your-domain.com/
```

## 🔐 Seguridad

- ✅ Contenedores rootless (UID 1000)
- ✅ Firewall UFW configurado
- ✅ HTTPS automático con Let's Encrypt
- ✅ Security headers (HSTS, CSP)
- ✅ SELinux/AppArmor ready (`:Z` flags)
- ✅ Secrets en GitHub Actions
- ✅ No restart policies (Systemd gestiona)

## 📊 Monitoreo

### Cockpit
Accede a `https://vps-ip:9090` para:
- Ver contenedores
- Logs en tiempo real
- Uso de recursos
- Gestión de servicios

### Comandos Útiles

```bash
# Ver todos los contenedores
podman ps

# Logs de un servicio
podman logs -f erp_backend

# Reiniciar servicio
podman-compose -f docker-compose.prod.yml restart backend

# Ver uso de recursos
podman stats

# Health check
curl https://your-domain.com/api/health/
```

## 🚀 CI/CD

Cada push a `main` automáticamente:
1. Construye imágenes
2. Push a GHCR
3. Despliega al VPS
4. Ejecuta migraciones
5. Verifica health

## 📝 Próximos Pasos

1. ✅ Configurar backup automático de base de datos
2. ✅ Configurar monitoreo con Prometheus/Grafana
3. ✅ Configurar alertas
4. ✅ Implementar rollback automático
5. ✅ Configurar staging environment

## 🔧 Troubleshooting

### Caddy no obtiene certificado SSL
```bash
# Verificar DNS
dig your-domain.com

# Ver logs de Caddy
podman logs erp_caddy

# Verificar firewall
sudo ufw status
```

### Contenedores no inician
```bash
# Ver logs
podman logs erp_backend

# Verificar imágenes
podman images

# Reconstruir
podman-compose -f docker-compose.prod.yml build
```

### Error de permisos
```bash
# Verificar subuid/subgid
cat /etc/subuid | grep erp_user
cat /etc/subgid | grep erp_user

# Verificar linger
loginctl show-user erp_user | grep Linger
```

## 📚 Recursos

- [Podman Documentation](https://docs.podman.io/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cockpit Project](https://cockpit-project.org/)
