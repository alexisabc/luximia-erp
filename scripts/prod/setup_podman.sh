#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: setup_podman.sh
# Descripción: Configuración inicial del VPS para Podman Rootless
# Uso: sudo bash setup_podman.sh
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
ERP_USER="erp_user"
ERP_USER_UID=1000
ERP_USER_GID=1000

# Funciones de utilidad
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root (usa sudo)"
        exit 1
    fi
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "No se pudo detectar el sistema operativo"
        exit 1
    fi
    log_info "Sistema detectado: $OS $VER"
}

install_podman_ubuntu_debian() {
    log_info "Instalando Podman en Ubuntu/Debian..."
    
    # Actualizar repositorios
    apt-get update
    
    # Instalar dependencias
    apt-get install -y \
        curl \
        wget \
        gnupg2 \
        software-properties-common \
        ca-certificates \
        lsb-release
    
    # Instalar Podman
    apt-get install -y podman podman-compose
    
    # Instalar Buildah
    apt-get install -y buildah
    
    log_info "Podman instalado: $(podman --version)"
}

install_podman_fedora_rhel() {
    log_info "Instalando Podman en Fedora/RHEL/CentOS..."
    
    # Actualizar sistema
    dnf update -y
    
    # Instalar Podman y herramientas
    dnf install -y podman podman-compose buildah
    
    log_info "Podman instalado: $(podman --version)"
}

create_erp_user() {
    log_info "Creando usuario $ERP_USER..."
    
    # Verificar si el usuario ya existe
    if id "$ERP_USER" &>/dev/null; then
        log_warn "El usuario $ERP_USER ya existe"
    else
        # Crear usuario con UID específico
        useradd -m -u $ERP_USER_UID -s /bin/bash $ERP_USER
        log_info "Usuario $ERP_USER creado con UID $ERP_USER_UID"
    fi
    
    # Agregar al grupo sudo/wheel según el OS
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        usermod -aG sudo $ERP_USER
    else
        usermod -aG wheel $ERP_USER
    fi
    
    # Configurar subuid y subgid para rootless
    if ! grep -q "^$ERP_USER:" /etc/subuid; then
        echo "$ERP_USER:100000:65536" >> /etc/subuid
    fi
    
    if ! grep -q "^$ERP_USER:" /etc/subgid; then
        echo "$ERP_USER:100000:65536" >> /etc/subgid
    fi
    
    log_info "Configuración de subuid/subgid completada"
}

enable_linger() {
    log_info "Habilitando linger para $ERP_USER..."
    
    # Habilitar linger para que los procesos del usuario persistan
    loginctl enable-linger $ERP_USER
    
    # Verificar
    if loginctl show-user $ERP_USER | grep -q "Linger=yes"; then
        log_info "Linger habilitado correctamente"
    else
        log_warn "No se pudo verificar linger, puede requerir reinicio"
    fi
}

configure_unprivileged_ports() {
    log_info "Configurando puertos sin privilegios..."
    
    # Permitir binding de puertos < 1024 sin root
    if ! grep -q "net.ipv4.ip_unprivileged_port_start" /etc/sysctl.conf; then
        echo "net.ipv4.ip_unprivileged_port_start=80" >> /etc/sysctl.conf
        sysctl -p
        log_info "Puertos sin privilegios configurados (80+)"
    else
        log_warn "Configuración de puertos ya existe en sysctl.conf"
    fi
}

configure_resource_limits() {
    log_info "Configurando límites de recursos..."
    
    # Aumentar límites para contenedores
    cat >> /etc/security/limits.conf <<EOF

# Límites para usuario ERP (Podman)
$ERP_USER soft nofile 65536
$ERP_USER hard nofile 65536
$ERP_USER soft nproc 4096
$ERP_USER hard nproc 4096
EOF
    
    log_info "Límites de recursos configurados"
}

enable_cgroups_v2() {
    log_info "Verificando cgroups v2..."
    
    # Verificar si cgroups v2 está habilitado
    if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
        log_info "cgroups v2 ya está habilitado"
    else
        log_warn "cgroups v2 no detectado. Puede requerir actualización de kernel."
        log_warn "Kernel mínimo recomendado: 5.11+"
        log_warn "Kernel actual: $(uname -r)"
    fi
}

configure_firewall() {
    log_info "Configurando firewall..."
    
    # Detectar firewall activo
    if command -v ufw &> /dev/null; then
        log_info "Configurando UFW..."
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 22/tcp
        log_info "Puertos 22, 80, 443 permitidos en UFW"
    elif command -v firewall-cmd &> /dev/null; then
        log_info "Configurando firewalld..."
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --reload
        log_info "Servicios HTTP/HTTPS/SSH permitidos en firewalld"
    else
        log_warn "No se detectó firewall (ufw/firewalld)"
    fi
}

setup_erp_directories() {
    log_info "Creando directorios del proyecto..."
    
    # Crear estructura de directorios
    su - $ERP_USER -c "mkdir -p ~/sistema-erp"
    su - $ERP_USER -c "mkdir -p ~/.config/systemd/user"
    su - $ERP_USER -c "mkdir -p ~/.local/share/containers/storage"
    
    log_info "Directorios creados en /home/$ERP_USER"
}

install_additional_tools() {
    log_info "Instalando herramientas adicionales..."
    
    # Git
    if ! command -v git &> /dev/null; then
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt-get install -y git
        else
            dnf install -y git
        fi
    fi
    
    # Docker Compose (para compatibilidad)
    if ! command -v docker-compose &> /dev/null; then
        log_info "Instalando docker-compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
            -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    log_info "Herramientas adicionales instaladas"
}

print_summary() {
    echo ""
    echo "============================================================================"
    log_info "Configuración de Podman completada exitosamente!"
    echo "============================================================================"
    echo ""
    echo "Próximos pasos:"
    echo "1. Cambiar a usuario erp_user: sudo su - $ERP_USER"
    echo "2. Clonar repositorio: git clone <repo-url> ~/sistema-erp"
    echo "3. Configurar variables de entorno en ~/sistema-erp/.env.prod"
    echo "4. Construir imágenes: podman-compose -f docker-compose.prod.yml build"
    echo "5. Iniciar servicios: podman-compose -f docker-compose.prod.yml up -d"
    echo "6. Generar systemd units: bash ~/sistema-erp/scripts/prod/generate_systemd.sh"
    echo ""
    echo "Verificación:"
    echo "  - Podman version: $(podman --version)"
    echo "  - Podman Compose: $(podman-compose --version 2>/dev/null || echo 'No instalado')"
    echo "  - Buildah version: $(buildah --version)"
    echo "  - Usuario ERP: $ERP_USER (UID: $ERP_USER_UID)"
    echo "  - Linger: $(loginctl show-user $ERP_USER | grep Linger)"
    echo "  - Puertos sin privilegios: $(sysctl net.ipv4.ip_unprivileged_port_start)"
    echo ""
    log_warn "Se recomienda reiniciar el servidor para aplicar todos los cambios"
    echo "============================================================================"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log_info "Iniciando configuración de Podman Rootless para ERP..."
    
    check_root
    detect_os
    
    # Instalación según OS
    case $OS in
        ubuntu|debian)
            install_podman_ubuntu_debian
            ;;
        fedora|rhel|centos|rocky|almalinux)
            install_podman_fedora_rhel
            ;;
        *)
            log_error "Sistema operativo no soportado: $OS"
            exit 1
            ;;
    esac
    
    # Configuración
    create_erp_user
    enable_linger
    configure_unprivileged_ports
    configure_resource_limits
    enable_cgroups_v2
    configure_firewall
    setup_erp_directories
    install_additional_tools
    
    # Resumen
    print_summary
}

# Ejecutar
main "$@"
