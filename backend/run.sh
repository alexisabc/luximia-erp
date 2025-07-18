#!/bin/bash
set -e

echo "Aplicando migraciones..."
python manage.py migrate

echo "Asegurando la existencia del superusuario..."
python manage.py crear_superusuario_inicial

echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi:application -b 0.0.0.0:10000