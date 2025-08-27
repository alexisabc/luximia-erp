#!/bin/bash
set -e

# Este script es SOLO para desarrollo local

# Espera a que la base de datos de Docker Compose esté lista
echo "Esperando a la base de datos local..."
while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -q; do
  echo "La base de datos no está lista. Esperando 2 segundos..."
  sleep 2
done
echo "¡Base de datos lista!"

echo "Aplicando migraciones..."
python manage.py migrate

echo "Asegurando la existencia del superusuario de desarrollo..."
python manage.py create_and_invite_superuser

echo "Iniciando servidor de Desarrollo Django en http://localhost:8000"
# Inicia el servidor de desarrollo de Django
exec python manage.py runserver 0.0.0.0:8000