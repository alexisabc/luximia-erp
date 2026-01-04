#!/bin/bash
set -euo pipefail

# ============================================================================
# Script: run_security_audit.sh
# Descripción: Ejecuta auditorías de seguridad en backend y frontend
# Uso: bash scripts/audit/run_security_audit.sh
# ============================================================================

echo "=== Auditoría de Seguridad - Sistema ERP ==="
echo ""

# Crear directorio de reportes
mkdir -p reports/security

# ============================================================================
# 1. Backend - Bandit (SAST para Python)
# ============================================================================

echo "📊 Ejecutando Bandit en Backend..."
echo ""

# Instalar Bandit si no está instalado
if ! podman exec luximia-backend python -c "import bandit" 2>/dev/null; then
    echo "Instalando Bandit..."
    podman exec luximia-backend pip install bandit
fi

# Ejecutar análisis
podman exec luximia-backend bandit -r /app \
    -f txt \
    -o /app/security_report.txt \
    --exclude /app/venv,/app/__pycache__,/app/staticfiles,/app/mediafiles

# Copiar reporte
podman cp luximia-backend:/app/security_report.txt reports/security/backend_bandit_report.txt

echo "✅ Reporte de Bandit generado: reports/security/backend_bandit_report.txt"
echo ""

# También generar reporte JSON para análisis programático
podman exec luximia-backend bandit -r /app \
    -f json \
    -o /app/security_report.json \
    --exclude /app/venv,/app/__pycache__,/app/staticfiles,/app/mediafiles

podman cp luximia-backend:/app/security_report.json reports/security/backend_bandit_report.json

# ============================================================================
# 2. Frontend - NPM Audit
# ============================================================================

echo "📊 Ejecutando npm audit en Frontend..."
echo ""

# Ejecutar npm audit
podman exec luximia-frontend npm audit --json > reports/security/frontend_npm_audit.json || true
podman exec luximia-frontend npm audit > reports/security/frontend_npm_audit.txt || true

echo "✅ Reporte de npm audit generado: reports/security/frontend_npm_audit.txt"
echo ""

# ============================================================================
# 3. Dockerfile Lint
# ============================================================================

echo "📊 Verificando Dockerfiles..."
echo ""

# Verificar que no se use 'latest' en producción
echo "Verificando uso de 'latest' en Dockerfiles de producción..."
if grep -r "FROM.*:latest" backend/Dockerfile.prod frontend/erp_ui/Dockerfile.prod 2>/dev/null; then
    echo "⚠️  ADVERTENCIA: Se encontró uso de ':latest' en Dockerfiles de producción"
else
    echo "✅ No se usa ':latest' en Dockerfiles de producción"
fi

echo ""

# Verificar que se use usuario no-root
echo "Verificando usuarios no-root en Dockerfiles..."
if grep -r "USER.*1000\|USER appuser\|USER nextjs" backend/Dockerfile.prod frontend/erp_ui/Dockerfile.prod 2>/dev/null; then
    echo "✅ Dockerfiles usan usuarios no-root"
else
    echo "⚠️  ADVERTENCIA: Verificar que Dockerfiles usen usuarios no-root"
fi

echo ""

# ============================================================================
# 4. Resumen
# ============================================================================

echo "=== Resumen de Auditoría ==="
echo ""
echo "Reportes generados:"
echo "  - reports/security/backend_bandit_report.txt"
echo "  - reports/security/backend_bandit_report.json"
echo "  - reports/security/frontend_npm_audit.txt"
echo "  - reports/security/frontend_npm_audit.json"
echo ""
echo "Próximos pasos:"
echo "  1. Revisar reportes de seguridad"
echo "  2. Priorizar vulnerabilidades críticas y altas"
echo "  3. Actualizar dependencias vulnerables"
echo "  4. Refactorizar código inseguro"
echo ""
