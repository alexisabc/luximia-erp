#!/bin/bash
set -e

# Solo ejecuta collectstatic si NO estamos en modo desarrollo
if [ "$DEVELOPMENT_MODE" != "True" ]; then
    echo "Recolectando archivos estáticos para producción..."
    python manage.py collectstatic --noinput
fi 

echo "Aplicando migraciones..."
python manage.py migrate

echo "Creando superusuario inicial..."
python manage.py create_and_invite_superuser

echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi:application -b 0.0.0.0:10000