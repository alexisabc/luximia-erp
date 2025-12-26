#!/bin/bash
set -e

# Función para esperar a la base de datos
# Función para esperar a la base de datos
wait_for_db() {
    if [ -n "$DATABASE_URL" ]; then
        echo "🟡 Detectada DATABASE_URL. Esperando a la base de datos..."
        # pg_isready soporta URIs de conexión en el parámetro -d
        while ! pg_isready -d "$DATABASE_URL" -q; do
            sleep 1
        done
    else
        echo "🟡 Esperando a la base de datos en ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
        while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -q; do
            sleep 1
        done
    fi
    echo "🟢 ¡Base de datos lista!"
}

# Ejecutar siempre al inicio
wait_for_db

# Refrescar colación si es necesario (limpia advertencias de Postgres)
echo "🧹 Refrescando versiones de colación..."
python manage.py refresh_collation || echo "⚠️ Advertencia: No se pudo refrescar la colación (posible falta de permisos o DB no postgres)."

# 1. Migraciones (Generar solo en Dev, Aplicar siempre)
if [ "$DEVELOPMENT_MODE" = "True" ]; then
    echo "🔄 Generando migraciones (Dev Mode)..."
    python manage.py makemigrations --noinput
fi

echo "🔄 Aplicando migraciones..."
python manage.py migrate ia --noinput
python manage.py migrate --noinput
python manage.py init_sandbox

# 2. Tareas específicas de desarrollo
if [ "$DEVELOPMENT_MODE" = "True" ]; then
    echo "🛠️  Modo Desarrollo detectado."
    # Opcional: Recopilar estáticos en dev si hace falta (normalmente runserver lo maneja)
    # python manage.py collectstatic --noinput
fi

# 3. Asegurar Superusuario (Ejecutar en Dev y Prod)
echo "👤 Asegurando superusuario..."
# Usamos un try/catch simple o ignoramos error si ya existe o falla el correo
python manage.py create_and_invite_superuser || echo "⚠️  No se pudo crear/invitar superusuario (¿ya existe o error SMTP?)"

# 3. Ejecutar el comando pasado al contenedor (CMD)
# Esto permite que el mismo entrypoint sirva para 'runserver', 'gunicorn', 'celery', etc.
echo "🚀 Iniciando comando: $@"
exec "$@"