#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: podman_smoke_test.sh
# Descripción: Smoke test para verificar instalación de Podman
# Uso: bash podman_smoke_test.sh
# ============================================================================

echo "=== PODMAN SMOKE TEST ==="
echo ""

# Test 1: Verificar versión
echo "1. Verificando versión de Podman..."
podman version
echo ""

# Test 2: Verificar alias docker
echo "2. Verificando alias docker -> podman..."
docker --version
echo ""

# Test 3: Hello World
echo "3. Ejecutando Hello World..."
podman run --rm hello-world
echo ""

# Test 4: Verificar socket
echo "4. Verificando socket de Podman..."
systemctl --user status podman.socket | grep Active
echo ""

# Test 5: Verificar DOCKER_HOST
echo "5. Verificando DOCKER_HOST..."
echo "DOCKER_HOST=$DOCKER_HOST"
echo ""

# Test 6: Verificar subuid/subgid
echo "6. Verificando subuid/subgid..."
cat /etc/subuid | grep $USER
cat /etc/subgid | grep $USER
echo ""

# Test 7: Levantar proyecto
echo "7. Levantando proyecto con podman-compose..."
cd ~/proyectos/sistema-erp
podman-compose up -d

echo ""
echo "8. Verificando contenedores..."
podman ps

echo ""
echo "9. Verificando logs del backend..."
podman logs backend --tail 20

echo ""
echo "=== SMOKE TEST COMPLETADO ==="
echo ""
echo "Comandos útiles:"
echo "  - Ver contenedores: podman ps"
echo "  - Ver logs: podman logs -f backend"
echo "  - Detener: podman-compose down"
echo "  - Reiniciar: podman-compose restart backend"
