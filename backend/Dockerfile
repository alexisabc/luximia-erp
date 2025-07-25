# backend/Dockerfile

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# ### CAMBIO: Usamos la lista de paquetes recomendada oficialmente ###
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-icu0 \
    locales \
    --no-install-recommends \
    && sed -i -e 's/# es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app/