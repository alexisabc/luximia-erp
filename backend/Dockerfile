# backend/Dockerfile

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# --- SECCIÓN CORREGIDA PARA INSTALAR LOCALES Y DEPENDENCIAS ---

# Actualiza e instala las dependencias del sistema y el paquete de locales
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-icu0 \
    locales \
    # Limpia la caché de apt para mantener la imagen ligera
    && rm -rf /var/lib/apt/lists/*

# Genera y configura el locale español
RUN sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales

# Configura las variables de entorno para que el sistema use el nuevo locale
ENV LANG es_ES.UTF-8
ENV LANGUAGE es_ES:es
ENV LC_ALL es_ES.UTF-8

# --- FIN DE LA SECCIÓN CORREGIDA ---

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/