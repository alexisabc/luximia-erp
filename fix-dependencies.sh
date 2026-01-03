#!/bin/bash

# Script para solucionar el error de build de Docker
# Ejecutar desde la raíz del proyecto

echo "🔧 Solucionando dependencias faltantes del frontend..."

cd frontend/erp_ui

echo "📦 Instalando react-hot-toast..."
npm install react-hot-toast

echo "📦 Instalando tipos de TypeScript..."
npm install --save-dev @types/react @types/react-dom @types/node typescript

echo "✅ Dependencias instaladas correctamente"
echo ""
echo "🐳 Ahora puedes reconstruir Docker con:"
echo "   cd ../.."
echo "   dcb"
echo "   dcup -d"
