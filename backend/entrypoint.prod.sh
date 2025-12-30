#!/bin/bash
set -e

# Wait for DB
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database..."
    while ! pg_isready -d "$DATABASE_URL" -q; do
        sleep 1
    done
else
    echo "Waiting for database at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
    while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -q; do
        sleep 1
    done
fi
echo "Database available!"

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
