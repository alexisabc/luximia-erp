#!/bin/bash
set -e

# Espera a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; do
  echo "La base de datos no está lista todavía. Esperando 2 segundos..."
  sleep 2
done
echo "¡La base de datos está lista!"

# Lógica condicional para desarrollo y producción
if [ "$DEVELOPMENT_MODE" == "True" ]; then
    echo "Modo Desarrollo: Creando migraciones si hay cambios..."
    python manage.py makemigrations users
    python manage.py makemigrations
fi

echo "Aplicando migraciones..."
python manage.py migrate

echo "Asegurando la existencia del superusuario inicial..."
python manage.py create_and_invite_superuser

if [ "$DEVELOPMENT_MODE" != "True" ]; then
    echo "Modo Producción: Recolectando archivos estáticos..."
    python manage.py collectstatic --noinput
    echo "Iniciando Gunicorn en modo Producción..."
    exec gunicorn luximia_erp.wsgi:application --bind 0.0.0.0:10000 --workers 4
else
    echo "Iniciando servidor de Desarrollo..."
    exec python manage.py runserver 0.0.0.0:10000
fi