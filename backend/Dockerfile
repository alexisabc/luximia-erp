[⚠️ Suspicious Content] # backend/Dockerfile

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# --- SECCIÓN PARA INSTALAR LOCALES Y DEPENDENCIAS DEL SISTEMA ---
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

# --- FIN DE LA SECCIÓN ---

WORKDIR /app

# Copia los requerimientos del backend
COPY backend/requirements.txt .

# --- CAMBIO: Actualiza pip y luego instala los requerimientos ---
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia la carpeta global de assets
COPY assets /app/static/assets

# Copia todo el código del backend
COPY backend/ .

# El comando para iniciar tu aplicación se define en el "Start Command" de Render