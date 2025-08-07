#!/bin/bash
set -e

echo "Iniciando script de arranque..."

# --- Pasos solo para Desarrollo ---
# Si DEVELOPMENT_MODE es 'True', crea las migraciones.
if [ "$DEVELOPMENT_MODE" == "True" ]; then
    echo "Modo Desarrollo: Creando migraciones si hay cambios..."
    python manage.py makemigrations users
    python manage.py makemigrations
fi

# --- Pasos solo para Producción ---
# Si DEVELOPMENT_MODE no es 'True', recolecta los archivos estáticos.
if [ "$DEVELOPMENT_MODE" != "True" ]; then
    echo "Modo Producción: Recolectando archivos estáticos..."
    python manage.py collectstatic --noinput
fi

# --- Pasos para AMBOS Entornos ---

# Aplica las migraciones a la base de datos (necesario en ambos).
echo "Aplicando migraciones..."
python manage.py migrate

# Asegura que el superusuario exista (el comando es seguro de ejecutar siempre).
echo "Asegurando la existencia del superusuario inicial..."
python manage.py create_and_invite_superuser

# Inicia el servidor.
echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi:application -b 0.0.0.0:10000