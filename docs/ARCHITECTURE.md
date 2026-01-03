# Arquitectura del Sistema ERP

## Visión General

Sistema ERP moderno basado en arquitectura de microservicios con contenedores OCI rootless, diseñado para máxima seguridad, escalabilidad y mantenibilidad.

---

## Stack Tecnológico

### Backend
- **Framework**: Django 5.0
- **API**: Django REST Framework 3.14
- **Base de Datos**: PostgreSQL 17 con pgvector
- **Cache**: Redis 7
- **Task Queue**: Celery + Redis
- **WSGI Server**: Gunicorn (producción)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 3.4
- **State Management**: React Context + SWR
- **Design System**: Atomic Design

### Infraestructura

#### Runtime
- **Container Engine**: **Podman 4.9+** (Rootless, Daemonless)
- **OCI Compliance**: Sí
- **Security**: Contenedores sin privilegios de root (UID 1000)
- **SELinux/AppArmor**: Compatible

#### Orquestación

**Desarrollo:**
- Podman Compose 1.0+
- Hot reload habilitado
- Volúmenes locales con `:Z` flags

**Producción:**
- **Systemd** (gestión de servicios)
- **Podman Compose** (definición de servicios)
- **Linger** habilitado para persistencia

#### Reverse Proxy
- **Caddy 2.x**
- HTTPS automático con Let's Encrypt
- HTTP/3 support
- Security headers (HSTS, CSP, X-Frame-Options)
- Health checks integrados

#### CI/CD
- **Platform**: GitHub Actions
- **Build Tool**: Buildah
- **Registry**: GitHub Container Registry (GHCR)
- **Deployment**: SSH + Podman Compose

#### Monitoreo
- **Cockpit** (web-based container management)
- **Systemd Journals** (logs centralizados)
- **Podman Stats** (métricas de recursos)

---

## Arquitectura de Contenedores

### Diagrama de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Caddy (Proxy) │
              │   80/443       │
              └────────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
   ┌──────────┐              ┌─────────────┐
   │ Frontend │              │   Backend   │
   │ Next.js  │              │   Django    │
   │  :3000   │              │   :8000     │
   └──────────┘              └──────┬──────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌──────────┐    ┌─────────┐    ┌──────────┐
              │PostgreSQL│    │  Redis  │    │  Celery  │
              │  :5432   │    │  :6379  │    │  Worker  │
              └──────────┘    └─────────┘    └──────────┘
```

### Servicios

#### 1. Database (PostgreSQL)
- **Imagen**: `pgvector/pgvector:pg17`
- **Volumen**: `postgres_data:/var/lib/postgresql/data:Z`
- **Health Check**: `pg_isready`
- **Backup**: Automático vía cron

#### 2. Cache/Broker (Redis)
- **Imagen**: `redis:7-alpine`
- **Volumen**: `redis_data:/data:Z`
- **Persistencia**: AOF habilitado
- **Health Check**: `redis-cli ping`

#### 3. Backend (Django)
- **Imagen**: `ghcr.io/your-org/sistema-erp/backend:latest`
- **Build**: Multi-stage Dockerfile
- **User**: UID 1000 (appuser)
- **Volúmenes**:
  - `static_files:/app/staticfiles:Z`
  - `media_files:/app/mediafiles:Z`
  - `logs:/app/logs:Z`
- **Health Check**: `/health/` endpoint

#### 4. Frontend (Next.js)
- **Imagen**: `ghcr.io/your-org/sistema-erp/frontend:latest`
- **Build**: Standalone output
- **User**: UID 1000 (nextjs)
- **Health Check**: HTTP GET `/`

#### 5. Celery Worker
- **Imagen**: Misma que backend
- **Command**: `celery -A config worker`
- **Concurrency**: Auto (basado en CPU cores)

#### 6. Celery Beat
- **Imagen**: Misma que backend
- **Command**: `celery -A config beat`
- **Scheduler**: DatabaseScheduler

#### 7. Caddy (Reverse Proxy)
- **Imagen**: `caddy:2-alpine`
- **Volúmenes**:
  - `caddy_data:/data:Z` (certificados)
  - `caddy_config:/config:Z`
  - `./caddy/Caddyfile:/etc/caddy/Caddyfile:ro,Z`
- **Puertos**: 80, 443, 443/udp (HTTP/3)

---

## Seguridad

### Contenedores Rootless

**Ventajas:**
- ✅ Sin daemon privilegiado
- ✅ Aislamiento de usuario
- ✅ Menor superficie de ataque
- ✅ Compatible con SELinux/AppArmor

**Implementación:**
```bash
# Todos los contenedores corren como UID 1000
podman top erp_backend
# USER   PID   PPID   %CPU   ELAPSED   TTY   TIME   COMMAND
# 1000   1     0      0.0    5m        ?     0s     gunicorn
```

### Network Isolation

- **Red Interna**: `erp_network` (bridge)
- **Exposición Externa**: Solo Caddy (80/443)
- **Comunicación Interna**: Por nombres de servicio

### Volúmenes con SELinux

Todos los volúmenes usan flag `:Z` para relabeling automático:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data:Z
```

### HTTPS Obligatorio

Caddy gestiona automáticamente:
- Obtención de certificados Let's Encrypt
- Renovación automática
- Redirección HTTP → HTTPS
- HSTS headers

---

## Flujo de Datos

### Request Flow

```
1. Cliente → Caddy (443)
2. Caddy → Frontend (3000) o Backend (8000)
3. Backend → PostgreSQL (5432) / Redis (6379)
4. Response ← Backend ← PostgreSQL/Redis
5. Response ← Caddy ← Frontend/Backend
6. Cliente ← Caddy
```

### Async Tasks Flow

```
1. API Request → Backend
2. Backend → Celery Task (via Redis)
3. Celery Worker → Task Execution
4. Worker → PostgreSQL (update)
5. Worker → Redis (result)
6. Backend ← Redis (task result)
7. API Response ← Backend
```

---

## Deployment Pipeline

### CI/CD Flow

```
1. Git Push → GitHub
2. GitHub Actions → Trigger
3. Buildah → Build Images
4. GHCR ← Push Images
5. SSH → VPS
6. Podman ← Pull Images
7. Podman Compose → Deploy
8. Systemd → Manage Services
```

### Build Process

**Backend:**
```dockerfile
# Stage 1: Builder
FROM python:3.11-slim as builder
RUN pip install --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
COPY --from=builder /root/.local /home/appuser/.local
USER appuser  # UID 1000
```

**Frontend:**
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
USER nextjs  # UID 1000
CMD ["node", "server.js"]
```

---

## Escalabilidad

### Horizontal Scaling

**Backend:**
- Múltiples instancias detrás de Caddy
- Session storage en Redis
- Stateless design

**Celery:**
- Workers escalables independientemente
- Auto-scaling basado en queue length

**Database:**
- Read replicas (futuro)
- Connection pooling

### Vertical Scaling

Recursos configurables en `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

---

## Monitoreo y Observabilidad

### Logs

**Systemd Journals:**
```bash
journalctl --user -u container-erp_backend.service -f
```

**Podman Logs:**
```bash
podman logs -f erp_backend
```

### Métricas

**Cockpit Dashboard:**
- CPU, RAM, Disk, Network
- Container status
- Systemd services

**Podman Stats:**
```bash
podman stats
```

### Health Checks

Todos los servicios tienen health checks:
- Backend: `curl http://localhost:8000/health/`
- Frontend: HTTP GET `/`
- Database: `pg_isready`
- Redis: `redis-cli ping`

---

## Backup y Recovery

### Database Backups

```bash
# Backup automático
podman exec erp_db pg_dump -U $DB_USER $DB_NAME > backup.sql

# Restore
cat backup.sql | podman exec -i erp_db psql -U $DB_USER -d $DB_NAME
```

### Volúmenes

Ubicación: `~/.local/share/containers/storage/volumes/`

Backup:
```bash
podman volume export postgres_data > postgres_data.tar
```

---

## Principios de Diseño

### 1. Security First
- Rootless por defecto
- Mínimos privilegios
- Secrets management

### 2. Cloud-Native
- OCI-compliant
- Stateless cuando es posible
- 12-factor app

### 3. Developer Experience
- Hot reload en desarrollo
- Comandos simples
- Documentación completa

### 4. Production Ready
- Health checks
- Graceful shutdown
- Zero-downtime deploys

---

## Tecnologías Futuras

- [ ] Kubernetes (migración desde Podman Compose)
- [ ] Prometheus + Grafana (métricas avanzadas)
- [ ] Elasticsearch (logs centralizados)
- [ ] MinIO (object storage)
- [ ] Traefik (alternativa a Caddy)

---

**Última actualización:** 03 de enero de 2026
