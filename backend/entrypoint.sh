#!/bin/bash
set -e

# Función para esperar a la base de datos
wait_for_db() {
    echo "🟡 Esperando a la base de datos en ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
    while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -q; do
        sleep 1
    done
    echo "🟢 ¡Base de datos lista!"
}

# Ejecutar siempre al inicio
wait_for_db

# 1. Migraciones (Generar y Aplicar)
echo "🔄 Generando y aplicando migraciones..."
python manage.py makemigrations --noinput
python manage.py migrate ia --noinput
python manage.py migrate --noinput

# 2. Tareas específicas de desarrollo
# Verifica si la variable DEVELOPMENT_MODE es "True" (definida en settings.py/.env)
if [ "$DEVELOPMENT_MODE" = "True" ]; then
    echo "🛠️  Modo Desarrollo detectado."
    
    # Opcional: Recopilar estáticos en dev si hace falta (normalmente runserver lo maneja)
    # python manage.py collectstatic --noinput

    echo "👤 Asegurando superusuario..."
    # Usamos un try/catch simple o ignoramos error si ya existe
    python manage.py create_and_invite_superuser || echo "⚠️  No se pudo crear/invitar superusuario (¿ya existe?)"
fi

# 3. Ejecutar el comando pasado al contenedor (CMD)
# Esto permite que el mismo entrypoint sirva para 'runserver', 'gunicorn', 'celery', etc.
echo "🚀 Iniciando comando: $@"
exec "$@"