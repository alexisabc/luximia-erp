#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: ubuntu_hardening.sh
# Descripción: Hardening de Ubuntu + Setup Podman Rootless
# Uso: sudo bash ubuntu_hardening.sh
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
ERP_DATA="$ERP_HOME/erp_data"

# ============================================================================
# 1. VERIFICACIONES INICIALES
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
    
    . /etc/os-release
    log_info "Sistema detectado: Ubuntu $VERSION"
    
    # Verificar versión mínima (22.04)
    if [[ "${VERSION_ID}" < "22.04" ]]; then
        log_warn "Se recomienda Ubuntu 22.04 o superior"
    fi
}

# ============================================================================
# 2. ACTUALIZACIÓN DEL SISTEMA
# ============================================================================

update_system() {
    log_step "Actualizando el sistema..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update
    apt-get upgrade -y
    apt-get dist-upgrade -y
    apt-get autoremove -y
    apt-get autoclean
    
    log_info "Sistema actualizado correctamente"
}

# ============================================================================
# 3. INSTALACIÓN DE PODMAN Y HERRAMIENTAS
# ============================================================================

install_podman() {
    log_step "Instalando Podman y herramientas..."
    
    # Instalar dependencias
    apt-get install -y \
        curl \
        wget \
        git \
        gnupg2 \
        software-properties-common \
        ca-certificates \
        lsb-release \
        apt-transport-https
    
    # Instalar Podman (disponible en Ubuntu 22.04+)
    apt-get install -y podman podman-compose buildah
    
    # Verificar instalación
    podman --version
    buildah --version
    
    log_info "Podman instalado: $(podman --version)"
}

install_cockpit() {
    log_step "Instalando Cockpit para monitoreo..."
    
    apt-get install -y cockpit cockpit-podman
    
    # Habilitar servicio
    systemctl enable --now cockpit.socket
    
    log_info "Cockpit instalado y habilitado en puerto 9090"
}

install_additional_tools() {
    log_step "Instalando herramientas adicionales..."
    
    apt-get install -y \
        ufw \
        fail2ban \
        unattended-upgrades \
        logrotate \
        htop \
        ncdu \
        net-tools
    
    log_info "Herramientas adicionales instaladas"
}

# ============================================================================
# 4. CREACIÓN DE USUARIO ERP (SIN SUDO)
# ============================================================================

create_erp_user() {
    log_step "Creando usuario $ERP_USER..."
    
    # Verificar si ya existe
    if id "$ERP_USER" &>/dev/null; then
        log_warn "El usuario $ERP_USER ya existe"
    else
        # Crear usuario sin privilegios sudo
        useradd -m -u $ERP_USER_UID -s /bin/bash $ERP_USER
        log_info "Usuario $ERP_USER creado con UID $ERP_USER_UID"
    fi
    
    # Configurar subuid/subgid para rootless
    if ! grep -q "^$ERP_USER:" /etc/subuid; then
        echo "$ERP_USER:100000:65536" >> /etc/subuid
    fi
    
    if ! grep -q "^$ERP_USER:" /etc/subgid; then
        echo "$ERP_USER:100000:65536" >> /etc/subgid
    fi
    
    # Crear directorios de datos
    mkdir -p "$ERP_DATA"/{postgres,redis,static,media,logs,caddy}
    chown -R $ERP_USER:$ERP_USER "$ERP_DATA"
    
    log_info "Directorios de datos creados en $ERP_DATA"
}

enable_linger() {
    log_step "Habilitando linger para $ERP_USER..."
    
    loginctl enable-linger $ERP_USER
    
    # Verificar
    if loginctl show-user $ERP_USER | grep -q "Linger=yes"; then
        log_info "Linger habilitado correctamente"
    else
        log_warn "No se pudo verificar linger"
    fi
}

# ============================================================================
# 5. CONFIGURACIÓN DE PUERTOS SIN PRIVILEGIOS
# ============================================================================

configure_unprivileged_ports() {
    log_step "Configurando puertos sin privilegios..."
    
    # Permitir puertos >= 80 sin root
    if ! grep -q "net.ipv4.ip_unprivileged_port_start" /etc/sysctl.conf; then
        echo "net.ipv4.ip_unprivileged_port_start=80" >> /etc/sysctl.conf
        sysctl -p
        log_info "Puertos sin privilegios configurados (80+)"
    else
        log_warn "Configuración de puertos ya existe"
    fi
}

# ============================================================================
# 6. HARDENING DE SEGURIDAD
# ============================================================================

configure_firewall() {
    log_step "Configurando firewall UFW..."
    
    # Resetear UFW
    ufw --force reset
    
    # Políticas por defecto
    ufw default deny incoming
    ufw default allow outgoing
    
    # Permitir servicios esenciales
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Cockpit (opcional, restringir por IP si es posible)
    ufw allow 9090/tcp comment 'Cockpit'
    
    # Habilitar UFW
    ufw --force enable
    
    log_info "Firewall configurado: SSH(22), HTTP(80), HTTPS(443), Cockpit(9090)"
}

configure_fail2ban() {
    log_step "Configurando Fail2Ban..."
    
    # Crear configuración para SSH
    cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
EOF
    
    systemctl enable --now fail2ban
    
    log_info "Fail2Ban configurado y habilitado"
}

configure_automatic_updates() {
    log_step "Configurando actualizaciones automáticas..."
    
    # Configurar unattended-upgrades
    cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Habilitar actualizaciones automáticas
    cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
    
    log_info "Actualizaciones automáticas de seguridad habilitadas"
}

harden_ssh() {
    log_step "Endureciendo configuración SSH..."
    
    # Backup de configuración original
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Aplicar configuraciones seguras
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    
    # Reiniciar SSH
    systemctl restart sshd
    
    log_info "SSH endurecido: Root login deshabilitado, solo autenticación por llave"
}

configure_resource_limits() {
    log_step "Configurando límites de recursos..."
    
    cat >> /etc/security/limits.conf <<EOF

# Límites para usuario ERP
$ERP_USER soft nofile 65536
$ERP_USER hard nofile 65536
$ERP_USER soft nproc 4096
$ERP_USER hard nproc 4096
EOF
    
    log_info "Límites de recursos configurados"
}

# ============================================================================
# 7. CONFIGURACIÓN DE SYSTEMD PARA ERP USER
# ============================================================================

setup_systemd_user() {
    log_step "Configurando Systemd para $ERP_USER..."
    
    # Crear directorio de systemd de usuario
    su - $ERP_USER -c "mkdir -p ~/.config/systemd/user"
    
    log_info "Directorio de Systemd de usuario creado"
}

# ============================================================================
# 8. RESUMEN Y VERIFICACIÓN
# ============================================================================

print_summary() {
    echo ""
    echo "============================================================================"
    log_info "Ubuntu Hardening completado exitosamente!"
    echo "============================================================================"
    echo ""
    echo "📋 Resumen de configuración:"
    echo "  ✓ Sistema actualizado a la última versión"
    echo "  ✓ Podman instalado: $(podman --version)"
    echo "  ✓ Cockpit habilitado en puerto 9090"
    echo "  ✓ Usuario ERP: $ERP_USER (UID: $ERP_USER_UID)"
    echo "  ✓ Linger habilitado para persistencia"
    echo "  ✓ Puertos sin privilegios: 80+"
    echo "  ✓ Firewall UFW: SSH(22), HTTP(80), HTTPS(443), Cockpit(9090)"
    echo "  ✓ Fail2Ban habilitado"
    echo "  ✓ Actualizaciones automáticas de seguridad"
    echo "  ✓ SSH endurecido (solo llave pública)"
    echo ""
    echo "📂 Directorios de datos:"
    echo "  $ERP_DATA"
    echo ""
    echo "🔐 Acceso a Cockpit:"
    echo "  https://$(hostname -I | awk '{print $1}'):9090"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Cambiar a usuario ERP: sudo su - $ERP_USER"
    echo "  2. Clonar repositorio: git clone <repo-url> ~/sistema-erp"
    echo "  3. Configurar .env.prod"
    echo "  4. Ejecutar: podman-compose -f docker-compose.prod.yml up -d"
    echo "  5. Generar systemd: bash ~/sistema-erp/scripts/prod/generate_systemd.sh"
    echo ""
    log_warn "IMPORTANTE: Configura tu llave SSH pública antes de cerrar la sesión"
    log_warn "Se recomienda reiniciar el servidor para aplicar todos los cambios"
    echo "============================================================================"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_info "Iniciando Ubuntu Hardening + Podman Rootless Setup..."
    echo ""
    
    check_root
    check_ubuntu
    
    update_system
    install_podman
    install_cockpit
    install_additional_tools
    
    create_erp_user
    enable_linger
    configure_unprivileged_ports
    
    configure_firewall
    configure_fail2ban
    configure_automatic_updates
    harden_ssh
    configure_resource_limits
    
    setup_systemd_user
    
    print_summary
}

# Ejecutar
main "$@"
