# Usamos una imagen base de Python que ya incluye herramientas de sistema
FROM python:3.12-slim-bookworm

# Establecemos variables de entorno para que Python no guarde archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Creamos un directorio de trabajo dentro de la imagen
WORKDIR /app

# ### PASO CLAVE: INSTALAR DEPENDENCIAS DEL SISTEMA ###
# Aquí le decimos al sistema operativo Linux de Render que instale las
# librerías que WeasyPrint necesita antes de instalar las de Python.
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgobject-2.0-0

# Copiamos solo el archivo de requerimientos primero para aprovechar la caché de Docker
COPY requirements.txt /app/

# Instalamos las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto de nuestro código de la aplicación
COPY . /app/