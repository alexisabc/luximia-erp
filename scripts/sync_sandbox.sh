#!/bin/bash

# =============================================================================
# LUXIMIA ERP - SCRIPT DE SINCRONIZACIÓN SANDBOX
# =============================================================================
# Este script clona la base de datos de producción (default) a la de pruebas (sandbox).
# Uso: ./scripts/sync_sandbox.sh
# =============================================================================

# Cargar variables de entorno si existe el archivo .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuración (Valores por defecto si no están en .env)
DB_USER=${POSTGRES_USER:-system_erp_user}
DB_PASS=${POSTGRES_PASSWORD:-system_erp_password}
DB_PROD=${POSTGRES_DB:-system_erp_db}
DB_SANDBOX=${POSTGRES_DB_SANDBOX:-system_erp_db_sandbox}

# Hosts internos de Docker (o externos si se corre fuera de la red de docker)
# Si corres esto DESDE el host, usa localhost:5432 y localhost:5433
# Si corres esto VÍA docker-compose exec, usa los nombres de los servicios
HOST_PROD="localhost"
PORT_PROD="5432"
HOST_SANDBOX="localhost"
PORT_SANDBOX="5433"

echo "🧪 Iniciando sincronización de Sandbox..."
echo "📦 Origen: $DB_PROD ($HOST_PROD:$PORT_PROD)"
echo "🎯 Destino: $DB_SANDBOX ($HOST_SANDBOX:$PORT_SANDBOX)"

# Exportar password para pg_dump y psql
export PGPASSWORD=$DB_PASS

# 1. Crear respaldo de producción
echo "🚀 Volcando base de datos de producción..."
pg_dump -h $HOST_PROD -p $PORT_PROD -U $DB_USER -F c -b -v -f /tmp/backup_prod.dump $DB_PROD

# 2. Limpiar y restaurar en sandbox
echo "🧹 Limpiando base de datos Sandbox..."
# Forzar desconexión de usuarios
psql -h $HOST_SANDBOX -p $PORT_SANDBOX -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_SANDBOX' AND pid <> pg_backend_pid();"
psql -h $HOST_SANDBOX -p $PORT_SANDBOX -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_SANDBOX;"
psql -h $HOST_SANDBOX -p $PORT_SANDBOX -U $DB_USER -d postgres -c "CREATE DATABASE $DB_SANDBOX;"

echo "♻️ Restaurando datos en Sandbox..."
pg_restore -h $HOST_SANDBOX -p $PORT_SANDBOX -U $DB_USER -d $DB_SANDBOX -v /tmp/backup_prod.dump

# 3. Limpieza de archivos temporales
rm /tmp/backup_prod.dump
unset PGPASSWORD

echo "✅ Sandbox sincronizado exitosamente con datos de producción."
