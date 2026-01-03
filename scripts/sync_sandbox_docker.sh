#!/bin/bash

# =============================================================================
# LUXIMIA ERP - SCRIPT DE SINCRONIZACIÓN SANDBOX (Docker Version)
# =============================================================================

echo "🧪 Iniciando sincronización de Sandbox vía Docker (No-TTY)..."

DB_USER="system_erp_user"
DB_PROD="system_erp_db"
DB_SANDBOX="system_erp_db_sandbox"

# 1. Crear respaldo de producción
echo "🚀 Volcando base de datos de producción..."
docker compose exec -T db pg_dump -U $DB_USER -F c -b $DB_PROD > /tmp/backup_prod.dump

# 2. Limpiar y restaurar en sandbox
echo "🧹 Recreando base de datos Sandbox..."
docker compose exec -T db_sandbox psql -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_SANDBOX' AND pid <> pg_backend_pid();"
docker compose exec -T db_sandbox psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_SANDBOX;"
docker compose exec -T db_sandbox psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_SANDBOX;"

echo "♻️ Restaurando datos en Sandbox..."
cat /tmp/backup_prod.dump | docker compose exec -T db_sandbox pg_restore -U $DB_USER -d $DB_SANDBOX

# 3. Limpieza
rm /tmp/backup_prod.dump

echo "✅ Sandbox sincronizado exitosamente."
