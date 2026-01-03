#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: setup_vps.sh
# Descripción: Configuración inicial del VPS para Podman Rootless en producción
# Uso: sudo bash setup_vps.sh
# ============================================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Variables
ERP_USER="erp_user"
ERP_USER_UID=1000
ERP_HOME="/home/$ERP_USER"
REPO_URL="${REPO_URL:-https://github.com/your-org/sistema-erp.git}"

# ============================================================================
# Verificaciones
# ============================================================================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root (usa sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_error "Este script está diseñado para Ubuntu"
        exit 1
    fi
    log_info "Sistema: Ubuntu $(lsb_release -rs)"
}

# ============================================================================
# Actualización del sistema
# ============================================================================

update_system() {
    log_step "Actualizando el sistema..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    apt-get autoremove -y
    log_info "Sistema actualizado"
}

# ============================================================================
# Instalación de Podman
# ============================================================================

install_podman() {
    log_step "Instalando Podman y herramientas..."
    
    apt-get install -y \
        podman \
        podman-compose \
        buildah \
        cockpit \
        cockpit-podman \
        git \
        curl \
        wget
    
    log_info "Podman instalado: $(podman --version)"
}

# ============================================================================
# Configuración de usuario ERP
# ============================================================================

create_erp_user() {
    log_step "Creando usuario $ERP_USER..."
    
    if id "$ERP_USER" &>/dev/null; then
        log_warn "El usuario $ERP_USER ya existe"
    else
        useradd -m -u $ERP_USER_UID -s /bin/bash $ERP_USER
        log_info "Usuario $ERP_USER creado con UID $ERP_USER_UID"
    fi
    
    # Configurar subuid/subgid
    if ! grep -q "^$ERP_USER:" /etc/subuid; then
        echo "$ERP_USER:100000:65536" >> /etc/subuid
    fi
    
    if ! grep -q "^$ERP_USER:" /etc/subgid; then
        echo "$ERP_USER:100000:65536" >> /etc/subgid
    fi
    
    # Crear directorios
    mkdir -p "$ERP_HOME/sistema-erp"
    mkdir -p "$ERP_HOME/.config/systemd/user"
    chown -R $ERP_USER:$ERP_USER "$ERP_HOME"
    
    log_info "Directorios creados"
}

enable_linger() {
    log_step "Habilitando linger para $ERP_USER..."
    loginctl enable-linger $ERP_USER
    log_info "Linger habilitado"
}

# ============================================================================
# Configuración de puertos sin privilegios
# ============================================================================

configure_unprivileged_ports() {
    log_step "Configurando puertos sin privilegios..."
    
    if ! grep -q "net.ipv4.ip_unprivileged_port_start" /etc/sysctl.conf; then
        echo "net.ipv4.ip_unprivileged_port_start=80" >> /etc/sysctl.conf
        sysctl -p
        log_info "Puertos sin privilegios configurados (80+)"
    else
        log_warn "Configuración ya existe"
    fi
}

# ============================================================================
# Firewall
# ============================================================================

configure_firewall() {
    log_step "Configurando firewall UFW..."
    
    apt-get install -y ufw
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw allow 9090/tcp comment 'Cockpit'
    
    ufw --force enable
    
    log_info "Firewall configurado"
}

# ============================================================================
# Configurar registros de contenedores
# ============================================================================

configure_registries() {
    log_step "Configurando registros de contenedores para $ERP_USER..."
    
    su - $ERP_USER -c "mkdir -p ~/.config/containers"
    su - $ERP_USER -c "cat > ~/.config/containers/registries.conf << 'EOF'
unqualified-search-registries = [\"docker.io\"]

[[registry]]
location = \"docker.io\"

[[registry]]
location = \"ghcr.io\"
EOF"
    
    log_info "Registros configurados"
}

# ============================================================================
# Clonar repositorio
# ============================================================================

clone_repository() {
    log_step "Clonando repositorio..."
    
    if [ -d "$ERP_HOME/sistema-erp/.git" ]; then
        log_warn "Repositorio ya existe"
    else
        su - $ERP_USER -c "git clone $REPO_URL ~/sistema-erp"
        log_info "Repositorio clonado"
    fi
}

# ============================================================================
# Configurar variables de entorno
# ============================================================================

setup_environment() {
    log_step "Configurando variables de entorno..."
    
    su - $ERP_USER -c "cat >> ~/.bashrc << 'EOF'

# Podman configuration
export DOCKER_HOST=unix:///run/user/\$UID/podman/podman.sock
EOF"
    
    log_info "Variables de entorno configuradas"
}

# ============================================================================
# Habilitar Cockpit
# ============================================================================

enable_cockpit() {
    log_step "Habilitando Cockpit..."
    
    systemctl enable --now cockpit.socket
    
    log_info "Cockpit habilitado en puerto 9090"
}

# ============================================================================
# Resumen
# ============================================================================

print_summary() {
    echo ""
    echo "============================================================================"
    log_info "Configuración del VPS completada exitosamente!"
    echo "============================================================================"
    echo ""
    echo "📋 Resumen:"
    echo "  ✓ Sistema actualizado"
    echo "  ✓ Podman instalado: $(podman --version)"
    echo "  ✓ Usuario ERP: $ERP_USER (UID: $ERP_USER_UID)"
    echo "  ✓ Linger habilitado"
    echo "  ✓ Puertos sin privilegios: 80+"
    echo "  ✓ Firewall configurado"
    echo "  ✓ Cockpit habilitado"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Cambiar a usuario ERP:"
    echo "     sudo su - $ERP_USER"
    echo ""
    echo "  2. Configurar variables de entorno:"
    echo "     cd ~/sistema-erp"
    echo "     cp .env.example .env.prod"
    echo "     nano .env.prod"
    echo ""
    echo "  3. Configurar GitHub Container Registry:"
    echo "     echo \$GITHUB_TOKEN | podman login ghcr.io -u \$GITHUB_USER --password-stdin"
    echo ""
    echo "  4. Descargar imágenes:"
    echo "     podman-compose -f docker-compose.prod.yml pull"
    echo ""
    echo "  5. Iniciar servicios:"
    echo "     podman-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "  6. Generar servicios Systemd:"
    echo "     bash scripts/prod/generate_systemd.sh"
    echo ""
    echo "🔐 Acceso a Cockpit:"
    echo "  https://$(hostname -I | awk '{print $1}'):9090"
    echo ""
    echo "============================================================================"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_info "Iniciando configuración del VPS para Podman Rootless..."
    echo ""
    
    check_root
    check_ubuntu
    
    update_system
    install_podman
    create_erp_user
    enable_linger
    configure_unprivileged_ports
    configure_firewall
    configure_registries
    setup_environment
    enable_cockpit
    
    # Opcional: clonar repositorio
    if [ -n "${REPO_URL:-}" ]; then
        clone_repository
    fi
    
    print_summary
}

# Ejecutar
main "$@"
