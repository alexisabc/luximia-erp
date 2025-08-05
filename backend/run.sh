#!/bin/bash
set -e

echo "Recolectando archivos estáticos..."
# Añade esta línea para que Whitenoise funcione correctamente
python manage.py collectstatic --noinput

echo "Aplicando migraciones..."
python manage.py migrate

echo "Creando superusuario inicial..."
python manage.py create_and_invite_superuser

echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi:application -b 0.0.0.0:10000
