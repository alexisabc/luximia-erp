#Frontend/luximia_erp_ui/Dockerfile
# --- Etapa 1: Builder ---
# En esta etapa construimos la aplicación de Next.js
FROM node:22-alpine AS builder

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Construimos la aplicación para producción
# Esto creará una carpeta 'out' con los archivos estáticos optimizados
RUN npm run build


# --- Etapa 2: Production ---
# En esta etapa, servimos los archivos construidos con un servidor NGINX
FROM nginx:stable-alpine

# Copiamos los archivos estáticos optimizados desde la etapa 'builder'
# La carpeta de salida de Next.js es 'out'
COPY --from=builder /app/out /usr/share/nginx/html

# Copiamos nuestro archivo de configuración personalizado de NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80, que es el puerto estándar para HTTP
EXPOSE 80

# El comando para iniciar el servidor NGINX
CMD ["nginx", "-g", "daemon off;"]