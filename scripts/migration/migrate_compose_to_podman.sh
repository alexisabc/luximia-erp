#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: migrate_compose_to_podman.sh
# Descripción: Migra docker-compose.yml agregando etiquetas :Z para Podman
# Uso: bash migrate_compose_to_podman.sh
# ============================================================================

COMPOSE_FILE="docker-compose.yml"
BACKUP_FILE="docker-compose.yml.docker-backup"

echo "=== Migración de docker-compose.yml para Podman ==="
echo ""

# Verificar que existe el archivo
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE no encontrado"
    exit 1
fi

# Crear backup
cp "$COMPOSE_FILE" "$BACKUP_FILE"
echo "✓ Backup creado: $BACKUP_FILE"

# Agregar :Z a bind mounts (rutas que empiezan con ./ o /)
# Esto es necesario para SELinux/AppArmor en Podman rootless

# Patrón 1: ./ruta:/destino -> ./ruta:/destino:Z
sed -i 's|\(\s*-\s*\./[^:]*:[^:]*\)$|\1:Z|g' "$COMPOSE_FILE"

# Patrón 2: /ruta/absoluta:/destino -> /ruta/absoluta:/destino:Z
sed -i 's|\(\s*-\s*/[^:]*:[^:]*\)$|\1:Z|g' "$COMPOSE_FILE"

# Patrón 3: ../ruta:/destino -> ../ruta:/destino:Z
sed -i 's|\(\s*-\s*\.\./[^:]*:[^:]*\)$|\1:Z|g' "$COMPOSE_FILE"

echo "✓ Etiquetas :Z agregadas a bind mounts"
echo ""
echo "Cambios realizados:"
diff "$BACKUP_FILE" "$COMPOSE_FILE" || true
echo ""
echo "✓ Migración completada"
echo ""
echo "Próximos pasos:"
echo "  1. Revisa los cambios: diff $BACKUP_FILE $COMPOSE_FILE"
echo "  2. Prueba con: podman-compose up -d"
echo "  3. Si todo funciona, elimina el backup: rm $BACKUP_FILE"
