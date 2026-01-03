✅ **Sprint 28: Despliegue de Producción con Podman - COMPLETADO**

He creado toda la configuración necesaria para desplegar el ERP en producción con Podman Rootless.

## 📦 Archivos Creados/Actualizados

### 1. **docker-compose.prod.yml** ✅
- Usa imágenes pre-construidas de GHCR
- Sin restart policies (gestionado por Systemd)
- Flags `:Z` en volúmenes para SELinux
- Caddy como reverse proxy
- 7 servicios: db, redis, backend, frontend, celery_worker, celery_beat, caddy

### 2. **Caddyfile** ✅
- HTTPS automático con Let's Encrypt
- Security headers (HSTS, CSP)
- Rutas configuradas para API, admin, static, media
- Health checks integrados

### 3. **scripts/prod/setup_vps.sh** ✅
- Instalación de Podman + Cockpit
- Creación de usuario `erp_user`
- Configuración de puertos sin privilegios
- Firewall UFW
- Linger habilitado

### 4. **.github/workflows/deploy.yml** ✅
- Build con Buildah
- Push a GHCR
- Deploy automático vía SSH
- Migraciones automáticas
- Health checks

### 5. **.env.prod.example** ✅
- Template con todas las variables necesarias
- Configuración de dominio, email, secrets

### 6. **docs/PRODUCTION_DEPLOYMENT.md** ✅
- Guía completa de despliegue paso a paso
- Troubleshooting
- Comandos útiles

## 🚀 Próximos Pasos para Desplegar

### 1. Preparar VPS
```bash
scp scripts/prod/setup_vps.sh user@vps-ip:~
ssh user@vps-ip
sudo bash setup_vps.sh
```

### 2. Configurar GitHub Secrets
En tu repo → Settings → Secrets:
- `VPS_HOST`
- `VPS_USER` (erp_user)
- `SSH_PRIVATE_KEY`

### 3. Configurar Variables
```bash
sudo su - erp_user
cd ~/sistema-erp
cp .env.prod.example .env.prod
nano .env.prod  # Editar dominio, passwords, etc.
```

### 4. Primer Despliegue
```bash
# Login a GHCR
echo $GITHUB_TOKEN | podman login ghcr.io -u $GITHUB_USER --password-stdin

# Pull y start
podman-compose -f docker-compose.prod.yml pull
podman-compose -f docker-compose.prod.yml up -d

# Migraciones
podman exec erp_backend python manage.py migrate
podman exec -it erp_backend python manage.py createsuperuser
```

### 5. Configurar DNS
Apunta tu dominio al IP del VPS

### 6. Verificar
```bash
curl https://your-domain.com/
```

## 🔐 Seguridad Implementada
- ✅ Rootless containers (UID 1000)
- ✅ HTTPS automático
- ✅ Firewall UFW
- ✅ Security headers
- ✅ SELinux ready
- ✅ Systemd management

## 📊 Monitoreo
- Cockpit: `https://vps-ip:9090`
- Logs: `podman logs -f erp_backend`
- Stats: `podman stats`

¿Necesitas ayuda con algún paso específico del despliegue?
