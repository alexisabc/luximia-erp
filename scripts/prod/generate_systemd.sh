#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: generate_systemd.sh
# Descripción: Genera unit files de Systemd para Podman containers
# Uso: bash generate_systemd.sh
# ============================================================================

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Variables
PROJECT_DIR="$HOME/sistema-erp"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
POD_NAME="erp_pod"

log_info "Generando unit files de Systemd para Podman..."

# Crear directorio de systemd si no existe
mkdir -p "$SYSTEMD_USER_DIR"

# Cambiar al directorio del proyecto
cd "$PROJECT_DIR"

# Verificar que los contenedores estén corriendo
if ! podman ps --format "{{.Names}}" | grep -q "erp_"; then
    log_warn "No se detectaron contenedores ERP corriendo"
    log_info "Iniciando servicios con podman-compose..."
    podman-compose -f docker-compose.prod.yml up -d
    sleep 10
fi

# Generar unit files para cada contenedor
log_info "Generando unit files individuales..."

# Lista de contenedores a generar
CONTAINERS=("erp_db" "erp_redis" "erp_backend" "erp_frontend" "erp_celery_worker" "erp_celery_beat")

for container in "${CONTAINERS[@]}"; do
    if podman ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
        log_info "Generando unit file para $container..."
        podman generate systemd \
            --new \
            --name "$container" \
            --files \
            --restart-policy=always \
            --start-timeout=90 \
            --stop-timeout=30
        
        # Mover el archivo generado al directorio de systemd
        if [ -f "container-${container}.service" ]; then
            mv "container-${container}.service" "$SYSTEMD_USER_DIR/"
            log_info "✓ Unit file creado: $SYSTEMD_USER_DIR/container-${container}.service"
        fi
    else
        log_warn "Contenedor $container no encontrado, saltando..."
    fi
done

# Recargar daemon de systemd
log_info "Recargando systemd daemon..."
systemctl --user daemon-reload

# Habilitar servicios
log_info "Habilitando servicios..."
for container in "${CONTAINERS[@]}"; do
    if [ -f "$SYSTEMD_USER_DIR/container-${container}.service" ]; then
        systemctl --user enable "container-${container}.service"
        log_info "✓ Servicio habilitado: container-${container}.service"
    fi
done

# Verificar estado
log_info ""
log_info "============================================================================"
log_info "Servicios de Systemd configurados exitosamente!"
log_info "============================================================================"
log_info ""
log_info "Comandos útiles:"
log_info "  - Ver estado de todos los servicios:"
log_info "    systemctl --user list-units 'container-erp_*'"
log_info ""
log_info "  - Ver logs de un servicio:"
log_info "    journalctl --user -u container-erp_backend.service -f"
log_info ""
log_info "  - Reiniciar un servicio:"
log_info "    systemctl --user restart container-erp_backend.service"
log_info ""
log_info "  - Detener todos los servicios:"
log_info "    systemctl --user stop 'container-erp_*'"
log_info ""
log_info "  - Iniciar todos los servicios:"
log_info "    systemctl --user start 'container-erp_*'"
log_info ""
log_info "Los servicios se iniciarán automáticamente al reiniciar el servidor."
log_info "============================================================================"
