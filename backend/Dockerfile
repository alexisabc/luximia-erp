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
    --no-install-recommends

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app/