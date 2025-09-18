#Frontend/luximia_erp_ui/Dockerfile
# --- Etapa 1: Builder ---
FROM node:22-alpine AS builder

WORKDIR /app

# COMANDO DE DEPURACIÓN: Muestra el contenido del directorio actual
RUN ls -la

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Construye la aplicación
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