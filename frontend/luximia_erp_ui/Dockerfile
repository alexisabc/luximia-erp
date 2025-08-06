#Frontend/luximia_erp_ui/Dockerfile
# Etapa 1: Base de desarrollo
# Usamos una imagen ligera de Node.js con Alpine Linux
FROM node:22-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero package.json y package-lock.json para aprovechar el caché de Docker
# Si estos archivos no cambian, Docker no volverá a instalar las dependencias
COPY package*.json ./

# Instalamos las dependencias del proyecto
RUN npm install --legacy-peer-deps

# Copiamos el resto del código del frontend
# Esto se hace al final porque es lo que cambia más a menudo
COPY . .

# Exponemos el puerto 3000, que es el que usa Next.js por defecto en desarrollo
EXPOSE 3000

# El comando para iniciar el servidor de desarrollo de Next.js
# Le decimos a npm que el directorio de trabajo real es la subcarpeta
CMD cd luximia_erp_ui && npm run dev