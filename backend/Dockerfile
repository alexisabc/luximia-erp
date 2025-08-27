# backend/Dockerfile

FROM python:3.13-slim-bookworm

# Variables de entorno estándar
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Configura las variables de entorno para el locale
    LANG="es_ES.UTF-8" \
    LANGUAGE="es_ES:es" \
    LC_ALL="es_ES.UTF-8"

# Establece el directorio de trabajo
WORKDIR /app

# Instala dependencias del sistema, incluyendo el cliente de postgresql
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-icu0 \
    locales \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Genera y configura el locale español
RUN sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales


# Asegura que la carpeta de assets exista antes de cualquier otra cosa
RUN mkdir -p /app/assets

# Copia los requerimientos del backend
COPY backend/requirements.txt .

# Actualiza pip e instala los requerimientos
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia la carpeta global de assets
COPY assets /app/static/assets

# Copia todo el código del backend
COPY backend/ .

# Recolecta los archivos estáticos dentro de la imagen
# Pasamos una clave temporal solo para este comando
RUN SECRET_KEY="dummy-key-for-build" python manage.py collectstatic --noinput

# Expone el puerto que Gunicorn usará
EXPOSE 8000

# El comando para iniciar la aplicación en producción
# Se adapta al puerto que Azure le asigne a través de la variable $PORT
CMD ["gunicorn", "luximia_erp.wsgi:application", "--bind", "0.0.0.0:8000"]