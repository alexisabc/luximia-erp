# 🚀 Despliegue y DevOps - Guía Paso a Paso

Esta guía detalla cómo levantar el sistema desde cero en un entorno de desarrollo.

## 🐳 Docker (Entorno Local)

El proyecto utiliza `docker-compose` para orquestar los servicios.

### Servicios Definidos
1.  **db (PostgreSQL 17):** Persistencia de datos. Puerto `5432`.
2.  **backend (Django):** API REST. Puerto `8000`.
3.  **frontend (Next.js):** UI. Puerto `3000`.
4.  **redis:** Broker de mensajes.
5.  **worker:** Ejecuta tareas en segundo plano.
6.  **mailhog:** SMTP falso para pruebas (`http://localhost:8025`).

### 👨‍💻 Paso a Paso: Iniciar el Proyecto

#### Paso 1: Requisitos Previos
Asegúrate de tener instalado:
- **Docker Desktop** (o Docker Engine + Compose).
- **Git**.

#### Paso 2: Clonar y Configurar
```bash
# 1. Clonar
git clone <url-del-repo>
cd sistema-erp

# 2. Configurar Variables de Entorno
# Copia el ejemplo para crear tu archivo .env local
cp .env.example .env
```

#### Paso 3: Arrancar Contenedores
```bash
docker-compose up -d --build
```
*Espera unos minutos a que se descarguen las imágenes y se construyan los contenedores.*

#### Paso 4: Migraciones y Superusuario
Una vez que los contenedores estén corriendo (`docker ps` para verificar):

```bash
# 1. Aplicar migraciones a la Base de Datos
docker-compose exec backend python manage.py migrate

# 2. Crear un usuario administrador
docker-compose exec backend python manage.py createsuperuser
# Sigue las instrucciones en pantalla (usuario, email, password)
```

#### Paso 5: Verificar Acceso
- **Frontend:** Abre `http://localhost:3000`
- **Backend API:** Abre `http://localhost:8000`
- **Admin Panel:** Abre `http://localhost:8000/admin` e ingresa con tu superusuario.
- **Mailhog:** Abre `http://localhost:8025` para ver correos salientes.

---

## 🌐 Mantenimiento Común

### Ver Logs
Para ver qué está pasando en el backend:
```bash
docker-compose logs -f backend
```

### Reiniciar un servicio
Si cambias código de Python, a veces es útil reiniciar si el autoreload falla:
```bash
docker-compose restart backend
```

### Detener todo
```bash
docker-compose down
```

---

## 🔒 Variables de Entorno Críticas
¡NUNCA SUBIR EL `.env` AL REPOSITORIO!

- `SECRET_KEY`: Llave criptográfica de Django.
- `POSTGRES_PASSWORD`: Contraseña de la DB.
- `SENDGRID_API_KEY`: Para envío de correos reales.
- `OPENAI_API_KEY`: Para funcionalidad de IA.

---

## 🌍 Producción
El despliegue se realiza en una arquitectura Serverless/Containerizada (ej. Render.com o AWS ECS) usando las imágenes de Docker reservadas para producción.
