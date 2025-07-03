#!/bin/bash
set -e
python manage.py collectstatic --no-input
python manage.py migrate
gunicorn luximia_erp.wsgi