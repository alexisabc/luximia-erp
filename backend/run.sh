#!/bin/bash
set -e

echo "Aplicando migraciones..."
python manage.py migrate

# ### NUEVA LÍNEA ###
# Ejecuta nuestro script para asegurar que el superusuario exista
echo "Asegurando la existencia del superusuario..."
python manage.py crear_superusuario_inicial

# Inicia el servidor Gunicorn
echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi -b 0.0.0.0:10000