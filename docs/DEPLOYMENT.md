# Deployment Guide - Podman Rootless

## Overview
This guide covers deploying the ERP system using **Podman** in rootless mode with **Systemd** orchestration for maximum security and reliability.

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 22.04+, Debian 12+, Fedora 38+, or RHEL 9+
- **Kernel**: 5.11+ (for full cgroups v2 support)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores

### Access Requirements
- SSH access with sudo privileges
- Domain name pointed to VPS IP
- GitHub account with repository access

## Initial VPS Setup

### 1. Run Setup Script
```bash
# Clone repository
git clone https://github.com/your-org/sistema-erp.git
cd sistema-erp

# Run setup script as root
sudo bash scripts/prod/setup_podman.sh
```

This script will:
- Install Podman, Buildah, and podman-compose
- Create `erp_user` with UID 1000
- Enable linger for persistent processes
- Configure sysctl for unprivileged ports (80/443)
- Set up firewall rules
- Configure resource limits

### 2. Switch to ERP User
```bash
sudo su - erp_user
cd ~/sistema-erp
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.prod

# Edit with your values
nano .env.prod
```

**Required variables:**
```bash
# Database
POSTGRES_DB=system_erp_db
POSTGRES_USER=system_erp_user
POSTGRES_PASSWORD=<strong-password>

# Django
SECRET_KEY=<generate-with-django>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Redis
REDIS_PASSWORD=<strong-password>

# Fiscal
FISCAL_SANDBOX_MODE=False
FISCAL_PAC_PROVIDER=<your-pac-provider>

# GitHub (for CI/CD)
GITHUB_REPOSITORY=your-org/sistema-erp
```

## Building and Running

### Build Images
```bash
# Build all images
podman-compose -f docker-compose.prod.yml build

# Or build individually
podman build -f backend/Dockerfile.prod -t erp-backend:latest .
podman build -f frontend/erp_ui/Dockerfile.prod -t erp-frontend:latest frontend/erp_ui
```

### Start Services
```bash
# Start all services
podman-compose -f docker-compose.prod.yml up -d

# Check status
podman ps

# View logs
podman logs -f erp_backend
```

### Run Migrations
```bash
# Apply database migrations
podman exec erp_backend python manage.py migrate

# Create superuser
podman exec -it erp_backend python manage.py createsuperuser

# Collect static files
podman exec erp_backend python manage.py collectstatic --noinput
```

## Systemd Integration

### Generate Unit Files
```bash
# Run generation script
bash scripts/prod/generate_systemd.sh
```

### Manage Services
```bash
# View all ERP services
systemctl --user list-units 'container-erp_*'

# Start/stop individual service
systemctl --user start container-erp_backend.service
systemctl --user stop container-erp_backend.service

# Restart all services
systemctl --user restart 'container-erp_*'

# View logs
journalctl --user -u container-erp_backend.service -f
```

### Verify Auto-Start
```bash
# Check linger status
loginctl show-user erp_user | grep Linger

# Should output: Linger=yes

# Test by rebooting
sudo reboot

# After reboot, verify services started
podman ps
```

## CI/CD Setup

### 1. Configure GitHub Secrets
In your GitHub repository, add these secrets:
- `VPS_HOST`: Your VPS IP or domain
- `VPS_USER`: `erp_user`
- `VPS_PORT`: SSH port (default: 22)
- `SSH_PRIVATE_KEY`: Private key for SSH access

### 2. Deploy Workflow
The workflow `.github/workflows/deploy-podman.yml` will:
1. Build images with Buildah
2. Push to GitHub Container Registry (GHCR)
3. SSH to VPS
4. Pull latest images
5. Restart services
6. Run migrations
7. Health check

### 3. Manual Deployment
```bash
# On VPS as erp_user
cd ~/sistema-erp
git pull origin main

# Pull latest images
podman pull ghcr.io/your-org/sistema-erp/backend:latest
podman pull ghcr.io/your-org/sistema-erp/frontend:latest

# Restart services
podman-compose -f docker-compose.prod.yml down
podman-compose -f docker-compose.prod.yml up -d

# Run migrations
podman exec erp_backend python manage.py migrate --noinput
```

## Security Checklist

- [ ] All containers run as non-root user (UID 1000)
- [ ] SELinux enabled with `:Z` flags on volumes
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] Strong passwords for database and Redis
- [ ] SSL/TLS certificates installed
- [ ] `DEBUG=False` in production
- [ ] Secret keys rotated and secure
- [ ] Regular backups configured

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health/

# Frontend health
curl http://localhost:3000/

# Database connection
podman exec erp_db pg_isready -U system_erp_user
```

### Backups
```bash
# Database backup
podman exec erp_db pg_dump -U system_erp_user system_erp_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260103.sql | podman exec -i erp_db psql -U system_erp_user -d system_erp_db
```

### Logs
```bash
# View all logs
podman-compose -f docker-compose.prod.yml logs -f

# Specific service
podman logs -f erp_backend

# Systemd logs
journalctl --user -u container-erp_backend.service --since today
```

## Troubleshooting

### Containers Won't Start
```bash
# Check podman status
podman ps -a

# View logs
podman logs erp_backend

# Check systemd status
systemctl --user status container-erp_backend.service
```

### Permission Errors
```bash
# Verify user UID
id erp_user  # Should be 1000

# Check volume permissions
podman volume inspect erp_postgres_data

# Recreate volumes if needed
podman volume rm erp_postgres_data
podman volume create erp_postgres_data
```

### Port Binding Issues
```bash
# Verify unprivileged port setting
sysctl net.ipv4.ip_unprivileged_port_start

# Should be 80 or lower

# Check if port is in use
ss -tlnp | grep :8000
```

### SELinux Issues
```bash
# Check SELinux status
getenforce

# View denials
ausearch -m avc -ts recent

# Relabel volumes
podman volume inspect --format '{{.Mountpoint}}' erp_postgres_data
sudo restorecon -Rv /path/to/volume
```

## Rollback Procedure

### Quick Rollback
```bash
# Pull specific version
podman pull ghcr.io/your-org/sistema-erp/backend:abc123

# Tag as latest
podman tag ghcr.io/your-org/sistema-erp/backend:abc123 \
  ghcr.io/your-org/sistema-erp/backend:latest

# Restart
podman-compose -f docker-compose.prod.yml down
podman-compose -f docker-compose.prod.yml up -d
```

### Database Rollback
```bash
# Restore from backup
cat backup_20260103.sql | podman exec -i erp_db psql -U system_erp_user -d system_erp_db

# Run migrations to specific version
podman exec erp_backend python manage.py migrate app_name 0042_previous_migration
```

## Performance Tuning

### Resource Limits
Edit `docker-compose.prod.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Database Optimization
```bash
# Tune PostgreSQL
podman exec -it erp_db psql -U system_erp_user -d system_erp_db

# Run VACUUM
VACUUM ANALYZE;

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Additional Resources
- [Podman Documentation](https://docs.podman.io/)
- [Systemd User Services](https://wiki.archlinux.org/title/Systemd/User)
- [SELinux Guide](https://www.redhat.com/en/topics/linux/what-is-selinux)
