# backend/Dockerfile

FROM python:3.13-slim-bookworm

# Variables de entorno estándar
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instala dependencias del sistema y configura locales
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-icu0 \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Genera y configura el locale español
RUN sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales

# Configura las variables de entorno para el locale
ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES:es
ENV LC_ALL es_ES.UTF-8


# Establece el directorio de trabajo
WORKDIR /app

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

# El comando para iniciar tu aplicación se define en el "Start Command" de Render