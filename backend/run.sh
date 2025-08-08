#!/bin/bash
set -e

echo "Iniciando script de arranque..."

# --- INICIO DE LA SOLUCIÓN ---
# Bucle de espera para la base de datos.
# La variable de entorno POSTGRES_HOST se define en settings.py, por defecto es 'db'.
# Usamos las variables de entorno para la conexión.
echo "Esperando a que la base de datos esté lista..."
while ! pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; do
  echo "La base de datos no está lista todavía. Esperando 2 segundos..."
  sleep 2
done
echo "¡La base de datos está lista!"
# --- FIN DE LA SOLUCIÓN ---


# --- Pasos solo para Desarrollo ---
if [ "$DEVELOPMENT_MODE" == "True" ]; then
    echo "Modo Desarrollo: Creando migraciones si hay cambios..."
    python manage.py makemigrations users
    python manage.py makemigrations
fi

# --- Pasos solo para Producción ---
if [ "$DEVELOPMENT_MODE" != "True" ]; then
    echo "Modo Producción: Recolectando archivos estáticos..."
    python manage.py collectstatic --noinput
fi

# --- Pasos para AMBOS Entornos ---

echo "Aplicando migraciones..."
python manage.py migrate

echo "Asegurando la existencia del superusuario inicial..."
python manage.py create_and_invite_superuser

echo "Iniciando Gunicorn..."
gunicorn luximia_erp.wsgi:application -b 0.0.0.0:10000