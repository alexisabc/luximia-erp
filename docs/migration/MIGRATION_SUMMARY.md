✅ **Migración de Docker a Podman en Pop!_OS - Guía Completa**

He creado una guía completa para migrar tu entorno de desarrollo de Docker a Podman en Pop!_OS.

## Archivos Creados

### 1. Guía de Migración
**Archivo**: [`docs/migration/DOCKER_TO_PODMAN.md`](file:///home/alexisburgos/proyectos/sistema-erp/docs/migration/DOCKER_TO_PODMAN.md)

Incluye:
- ✅ Comandos exactos para desinstalar Docker completamente
- ✅ Instalación de Podman, podman-compose, y podman-docker
- ✅ Configuración del socket de Podman para VS Code
- ✅ Variables de entorno (DOCKER_HOST)
- ✅ Troubleshooting completo
- ✅ Tabla de comandos equivalentes

### 2. Script de Migración Automática
**Archivo**: [`scripts/migration/migrate_compose_to_podman.sh`](file:///home/alexisburgos/proyectos/sistema-erp/scripts/migration/migrate_compose_to_podman.sh)

Agrega automáticamente las etiquetas `:Z` a todos los bind mounts en `docker-compose.yml`.

**Uso**:
```bash
bash scripts/migration/migrate_compose_to_podman.sh
```

### 3. Script de Smoke Test
**Archivo**: [`scripts/migration/podman_smoke_test.sh`](file:///home/alexisburgos/proyectos/sistema-erp/scripts/migration/podman_smoke_test.sh)

Verifica que Podman esté correctamente instalado y funcionando.

**Uso**:
```bash
bash scripts/migration/podman_smoke_test.sh
```

## Cambios en docker-compose.yml

Ya actualicé tu `docker-compose.yml` agregando las etiquetas `:Z` necesarias:
- `./backend:/app` → `./backend:/app:Z` (celery_worker y celery_beat)

## Pasos Rápidos de Migración

### 1. Desinstalar Docker
```bash
# Detener contenedores
docker stop $(docker ps -aq) 2>/dev/null || true

# Desinstalar Docker
sudo apt-get purge -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo rm -rf /var/lib/docker ~/.docker
sudo apt-get autoremove -y
```

### 2. Instalar Podman
```bash
sudo apt-get update
sudo apt-get install -y podman podman-compose podman-docker buildah
```

### 3. Configurar Entorno
```bash
# Habilitar socket
systemctl --user enable --now podman.socket

# Agregar a ~/.bashrc o ~/.zshrc
echo 'export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock' >> ~/.bashrc
source ~/.bashrc
```

### 4. Verificar
```bash
# Ejecutar smoke test
bash scripts/migration/podman_smoke_test.sh
```

### 5. Levantar Proyecto
```bash
cd ~/proyectos/sistema-erp
podman-compose up -d
```

## Integración con VS Code

Con `podman-docker` instalado y `DOCKER_HOST` configurado, la extensión de Docker en VS Code funcionará automáticamente con Podman.

**Configuración opcional** en `settings.json`:
```json
{
  "docker.host": "unix:///run/user/1000/podman/podman.sock",
  "docker.dockerPath": "podman"
}
```

## Ventajas de Podman

- 🛡️ **Rootless por defecto** - Mayor seguridad
- 🚫 **Sin daemon** - Menos recursos, más estable
- 🔄 **Compatible con Docker** - Mismo CLI
- 📦 **Integración Systemd** - Gestión nativa de servicios
- 🎯 **Pods nativos** - Soporte Kubernetes

## Próximos Pasos

1. Ejecuta la guía de migración paso a paso
2. Verifica que todo funcione con el smoke test
3. Actualiza tus scripts si tienen `docker` hardcoded (opcional, ya que `podman-docker` crea el alias)

¿Necesitas ayuda con algún paso específico de la migración?
