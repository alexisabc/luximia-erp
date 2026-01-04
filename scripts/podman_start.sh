#!/bin/bash
# Script robusto para iniciar contenedores con Podman
# Evita problemas de podman-compose/docker-compose

echo "🚀 Iniciando entorno de desarrollo con Podman (SISTEMA ERP)..."
echo ""

# 1. Crear red y volúmenes
podman network exists erp_network || podman network create erp_network
podman volume exists postgres_data || podman volume create postgres_data
podman volume exists postgres_sandbox_data || podman volume create postgres_sandbox_data

# 2. Iniciar Bases de Datos
echo "📦 Iniciando PostgreSQL Primary..."
podman run -d --name sistema-erp-db --replace \
  --network erp_network \
  --network-alias db \
  -e POSTGRES_DB=system_erp_db \
  -e POSTGRES_USER=system_erp_user \
  -e POSTGRES_PASSWORD=system_erp_password \
  -v postgres_data:/var/lib/postgresql/data:Z \
  -p 5432:5432 \
  pgvector/pgvector:pg17

echo "📦 Iniciando PostgreSQL Sandbox..."
podman run -d --name sistema-erp-db-sandbox --replace \
  --network erp_network \
  --network-alias db_sandbox \
  -e POSTGRES_DB=system_erp_db_sandbox \
  -e POSTGRES_USER=system_erp_user \
  -e POSTGRES_PASSWORD=system_erp_password \
  -v postgres_sandbox_data:/var/lib/postgresql/data:Z \
  -p 5433:5432 \
  pgvector/pgvector:pg17

# 3. Iniciar Redis y Mailhog
echo "📦 Iniciando Redis..."
podman run -d --name sistema-erp-redis --replace \
  --network erp_network \
  --network-alias redis \
  -p 6379:6379 \
  redis:7-alpine

echo "📦 Iniciando Mailhog..."
podman run -d --name sistema-erp-mailhog --replace \
  --network erp_network \
  --network-alias mailhog \
  -p 1025:1025 -p 8025:8025 \
  mailhog/mailhog

# 4. Construir e Iniciar Backend
echo "🏗️  Construyendo Backend..."
podman build -t sistema-erp-backend:latest -f backend/Dockerfile .

echo "📦 Iniciando Backend..."
# Nota: --network-alias backend es crítico para que el frontend lo encuentre
podman run -d --name sistema-erp-backend --replace \
  --network erp_network \
  --network-alias backend \
  -v ./backend:/app:Z \
  -v ./assets:/app/assets:Z \
  -p 8000:8000 \
  --env-file .env \
  sistema-erp-backend:latest \
  python manage.py runserver 0.0.0.0:8000

# 5. Construir e Iniciar Frontend
echo "🏗️  Construyendo Frontend..."
podman build -t sistema-erp-frontend:latest --target builder ./frontend/erp_ui

echo "📦 Iniciando Frontend..."
podman run -d --name sistema-erp-frontend --replace \
  --network erp_network \
  --network-alias frontend \
  -v ./frontend/erp_ui:/app:Z \
  -v /app/.next \
  -p 3000:3000 \
  --env-file .env \
  sistema-erp-frontend:latest \
  npm run dev

# 6. Iniciar Celery Workers
echo "📦 Iniciando Celery Worker..."
podman run -d --name sistema-erp-celery-worker --replace \
  --network erp_network \
  -v ./backend:/app:Z \
  --env-file .env \
  sistema-erp-backend:latest \
  celery -A config worker --loglevel=info

echo "📦 Iniciando Celery Beat..."
podman run -d --name sistema-erp-celery-beat --replace \
  --network erp_network \
  -v ./backend:/app:Z \
  --env-file .env \
  sistema-erp-backend:latest \
  celery -A config beat --loglevel=info

echo ""
echo "✅ Todos los servicios iniciados!"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
