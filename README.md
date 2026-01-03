# Sistema ERP - Luximia

![Podman](https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=podman&logoColor=white)
![Rootless](https://img.shields.io/badge/Rootless-✓-success?style=for-the-badge)
![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**Sistema Integral de Planificación de Recursos Empresariales (ERP)** diseñado para Gestión Corporativa con arquitectura moderna, segura y cloud-native.

- **Versión:** 3.2
- **Última actualización:** 03 de enero de 2026
- **Arquitectura:** Podman Rootless + Systemd + Caddy

---

## 🎯 Características Principales

- ✅ **Seguridad Máxima**: Contenedores rootless (sin privilegios de root)
- ✅ **Cloud-Native**: Arquitectura OCI-compliant sin daemon
- ✅ **HTTPS Automático**: Caddy con Let's Encrypt integrado
- ✅ **Mobile First**: UI responsive con Atomic Design
- ✅ **CI/CD Automatizado**: GitHub Actions + GHCR
- ✅ **Multi-tenancy**: Soporte para múltiples empresas
- ✅ **Fiscal Compliance**: Generación de CFDI 4.0 y complementos

---

## 📋 Prerrequisitos

### Para Desarrollo Local

- **Podman** v4.0+ ([Guía de instalación](docs/migration/DOCKER_TO_PODMAN.md))
- **Podman Compose** v1.0+
- **Python** 3.11+
- **Node.js** 20+
- **PostgreSQL** 15+ (via Podman)
- **Sistema Operativo**: Linux/WSL2 (Recomendado: Pop!_OS/Ubuntu 22.04+)

### Para Producción

- **VPS Ubuntu** 22.04+ con kernel 5.11+
- **Podman** + **Buildah** + **Cockpit**
- **Dominio** con DNS configurado
- **GitHub Container Registry** (GHCR) access

---

## 🚀 Quick Start (Desarrollo Local)

### 1. Clonar Repositorio

```bash
git clone https://github.com/your-org/sistema-erp.git
cd sistema-erp
```

### 2. Instalar Podman

**Pop!_OS/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y podman podman-compose podman-docker
```

**Fedora/RHEL:**
```bash
sudo dnf install -y podman podman-compose
```

Para migrar desde Docker, consulta: [`docs/migration/DOCKER_TO_PODMAN.md`](docs/migration/DOCKER_TO_PODMAN.md)

### 3. Configurar Entorno

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar configuración
nano .env
```

### 4. Levantar Servicios

```bash
# Iniciar todos los servicios
podman-compose up -d

# Verificar contenedores
podman ps
```

### 5. Aplicar Migraciones

```bash
# Ejecutar migraciones de base de datos
podman exec -it luximia-backend python manage.py migrate

# Crear superusuario
podman exec -it luximia-backend python manage.py createsuperuser

# Cargar datos iniciales
podman exec -it luximia-backend python manage.py loaddata initial_data
```

### 6. Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **Mailhog**: http://localhost:8025

---

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend:**
- Django 5.0 + Django REST Framework
- PostgreSQL 17 con pgvector
- Celery + Redis para tareas asíncronas
- Gunicorn (producción)

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TailwindCSS
- Atomic Design pattern

**Infraestructura:**
- **Runtime**: Podman Rootless (OCI-compliant, daemonless)
- **Orquestación**: Systemd + Podman Compose
- **Reverse Proxy**: Caddy (HTTPS automático)
- **CI/CD**: GitHub Actions + GHCR
- **Monitoreo**: Cockpit

### Arquitectura Segura

```
Internet → Caddy (80/443) → Internal Network
                ↓
        Backend (8000) ← Frontend (3000)
                ↓
        PostgreSQL (5432) + Redis (6379)
                ↓
        Celery Worker + Beat
```

**Características de Seguridad:**
- ✅ Contenedores rootless (UID 1000)
- ✅ Sin daemon privilegiado
- ✅ SELinux/AppArmor ready
- ✅ HTTPS obligatorio en producción
- ✅ Security headers (HSTS, CSP)
- ✅ Firewall UFW configurado

---

## 📚 Documentación

### Para Desarrolladores

- **[Migración Docker → Podman](docs/migration/DOCKER_TO_PODMAN.md)** - Guía completa de migración
- **[Arquitectura del Sistema](ERP_Docs/README.md)** - Documentación técnica completa (66 documentos)
- **[Atomic Design](ERP_Docs/frontend/)** - Sistema de componentes UI
- **[API Documentation](docs/API.md)** - Endpoints y schemas

### Para DevOps

- **[Despliegue en Producción](docs/PRODUCTION_DEPLOYMENT.md)** - Guía completa de deployment
- **[Setup del VPS](scripts/prod/setup_vps.sh)** - Script de configuración automática
- **[Cockpit Monitoring](docs/COCKPIT.md)** - Monitoreo web-based
- **[CI/CD Pipeline](.github/workflows/deploy.yml)** - Workflow de GitHub Actions

### Módulos de Negocio

- **[Tesorería](ERP_Docs/tesoreria/)** - CXC, CXP, pagos y REP
- **[POS](ERP_Docs/pos/)** - Punto de venta
- **[Contabilidad](ERP_Docs/contabilidad/)** - CFDI 4.0 y fiscal
- **[RRHH](ERP_Docs/rrhh/)** - Nómina y empleados

---

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Ver logs
podman logs -f luximia-backend
podman logs -f luximia-frontend

# Reiniciar servicio
podman-compose restart backend

# Ejecutar tests
podman exec luximia-backend pytest

# Shell de Django
podman exec -it luximia-backend python manage.py shell

# Detener todo
podman-compose down

# Limpiar volúmenes
podman-compose down -v
```

### Producción

```bash
# Pull de imágenes
podman-compose -f docker-compose.prod.yml pull

# Deploy
podman-compose -f docker-compose.prod.yml up -d

# Ver estado
podman ps

# Logs de producción
podman logs -f erp_backend

# Health check
curl https://your-domain.com/api/health/
```

---

## 🚢 Despliegue en Producción

### Opción 1: Despliegue Automático (CI/CD)

1. Configurar GitHub Secrets:
   - `VPS_HOST`
   - `VPS_USER` (erp_user)
   - `SSH_PRIVATE_KEY`

2. Push a `main`:
   ```bash
   git push origin main
   ```

3. GitHub Actions automáticamente:
   - Construye imágenes con Buildah
   - Push a GHCR
   - Despliega al VPS
   - Ejecuta migraciones
   - Verifica health

### Opción 2: Despliegue Manual

Ver guía completa: [`docs/PRODUCTION_DEPLOYMENT.md`](docs/PRODUCTION_DEPLOYMENT.md)

```bash
# 1. Setup VPS
sudo bash scripts/prod/setup_vps.sh

# 2. Como erp_user
sudo su - erp_user
cd ~/sistema-erp

# 3. Configurar
cp .env.prod.example .env.prod
nano .env.prod

# 4. Deploy
podman-compose -f docker-compose.prod.yml pull
podman-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Seguridad

### Buenas Prácticas Implementadas

- **Rootless Containers**: Todos los contenedores corren sin privilegios de root
- **No Daemon**: Podman no requiere daemon privilegiado
- **Systemd Management**: Reinicio automático gestionado por el sistema operativo
- **HTTPS Automático**: Caddy gestiona certificados Let's Encrypt
- **Security Headers**: HSTS, CSP, X-Frame-Options configurados
- **Firewall**: UFW configurado (solo puertos necesarios)
- **Secrets Management**: Variables de entorno y GitHub Secrets
- **Audit Trail**: Logs completos de todas las operaciones

### Verificación de Seguridad

```bash
# Verificar que contenedores corren como usuario no-root
podman top erp_backend

# Verificar SELinux labels
podman inspect erp_backend | grep -i selinux

# Verificar firewall
sudo ufw status
```

---

## 📊 Monitoreo

### Cockpit (Producción)

Accede a `https://vps-ip:9090` para:
- Ver contenedores en tiempo real
- Logs streaming
- Uso de recursos (CPU, RAM, Disk)
- Gestión de servicios Systemd

### Comandos de Monitoreo

```bash
# Uso de recursos
podman stats

# Estado de servicios
systemctl --user status 'container-erp_*'

# Logs en tiempo real
journalctl --user -u container-erp_backend.service -f
```

---

## 🤝 Contribuir

### Workflow de Desarrollo

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit con Conventional Commits: `git commit -m "feat: nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

---

## 📝 Licencia

Este proyecto es privado y propietario.

---

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: dev@luximia.com
- **Documentación**: [ERP_Docs/](./ERP_Docs/README.md)
- **Issues**: GitHub Issues (solo equipo interno)

---

## 🎯 Roadmap

- [x] Migración a Podman Rootless
- [x] CI/CD con GitHub Actions
- [x] HTTPS automático con Caddy
- [x] Módulo de Tesorería
- [ ] Módulo de Inventario
- [ ] Módulo de Compras
- [ ] Dashboard Analytics
- [ ] Mobile App (React Native)

---

**Hecho con ❤️ por el equipo de Luximia**
