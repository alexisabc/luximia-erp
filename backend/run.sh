#!/bin/bash
set -e

echo "Aplicando migraciones..."
python manage.py migrate

# Le decimos a Gunicorn que escuche en todas las interfaces (0.0.0.0)
# y en el puerto 10000, que es el que Docker está esperando.
echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi -b 0.0.0.0:10000