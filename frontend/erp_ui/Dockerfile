#Frontend/erp_system_ui/Dockerfile
# --- Etapa 1: Builder ---
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./

# Instala las dependencias de forma rápida y determinista
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: Production ---
FROM node:24-alpine AS runner
WORKDIR /app

# Copia los artefactos de construcción desde la etapa 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expone el puerto que usa Next.js en producción
EXPOSE 3000

# Comando para iniciar el servidor de Next.js
CMD ["node", "server.js"]