# 🚀 Guía de Despliegue y Uso - Sistema ERP v2.6

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Comandos Importantes](#comandos-importantes)
5. [Uso del Sistema](#uso-del-sistema)
6. [Solución de Problemas](#solución-de-problemas)

---

## 1. Requisitos Previos

### Software Necesario
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Node.js** 18+ (solo para desarrollo local)
- **Python** 3.12+ (solo para desarrollo local)
- **PostgreSQL** 17+ con extensión `pgvector`

### Variables de Entorno Requeridas

#### Backend (.env)
```bash
# Base de Datos
DATABASE_URL=postgresql://user:password@db:5432/erp_db

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# IA (Opcional)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...

# Almacenamiento (Cloudflare R2)
AWS_ACCESS_KEY_ID=your-r2-access-key
AWS_SECRET_ACCESS_KEY=your-r2-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Sistema ERP
```

---

## 2. Instalación

### Opción A: Usando Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/sistema-erp.git
cd sistema-erp

# 2. Crear archivos .env
cp backend/.env.example backend/.env
cp frontend/erp_ui/.env.local.example frontend/erp_ui/.env.local

# 3. Editar variables de entorno
nano backend/.env
nano frontend/erp_ui/.env.local

# 4. Construir y levantar contenedores
docker-compose up -d --build

# 5. Aplicar migraciones
docker-compose exec backend python manage.py migrate

# 6. Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# 7. Actualizar permisos
docker-compose exec backend python manage.py update_permissions

# 8. (Opcional) Indexar modelos para IA
docker-compose exec backend python manage.py index_models --limit 100
```

### Opción B: Desarrollo Local

#### Backend
```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Actualizar permisos
python manage.py update_permissions

# Ejecutar servidor
python manage.py runserver 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend/erp_ui

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# O construir para producción
npm run build
npm start
```

---

## 3. Configuración

### Configuración de PostgreSQL

```sql
-- Crear base de datos
CREATE DATABASE erp_db;

-- Crear usuario
CREATE USER erp_user WITH PASSWORD 'your-password';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE erp_db TO erp_user;

-- Conectar a la base de datos
\c erp_db

-- Crear extensión pgvector (para IA)
CREATE EXTENSION IF NOT EXISTS vector;
```

### Configuración de NGINX (Producción)

```nginx
# /etc/nginx/sites-available/erp

# API Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Comandos Importantes

### Gestión de Permisos

```bash
# Actualizar todos los permisos y traducciones
docker-compose exec backend python manage.py update_permissions

# Ver permisos de un usuario
docker-compose exec backend python manage.py shell
>>> from users.models import CustomUser
>>> user = CustomUser.objects.get(email='user@example.com')
>>> user.get_all_permissions()
```

### Indexación de IA

```bash
# Indexar todos los modelos
docker-compose exec backend python manage.py index_models

# Indexar solo Tesorería
docker-compose exec backend python manage.py index_models --app tesoreria

# Indexar solo Cuentas Bancarias
docker-compose exec backend python manage.py index_models --app tesoreria --model CuentaBancaria

# Indexar con límite (para pruebas)
docker-compose exec backend python manage.py index_models --limit 50
```

### Migraciones

```bash
# Crear migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Ver estado de migraciones
docker-compose exec backend python manage.py showmigrations

# Revertir migración
docker-compose exec backend python manage.py migrate app_name migration_name
```

### Gestión de Datos

```bash
# Crear datos de prueba (si existe comando)
docker-compose exec backend python manage.py seed_data

# Exportar datos
docker-compose exec backend python manage.py dumpdata app_name > backup.json

# Importar datos
docker-compose exec backend python manage.py loaddata backup.json

# Limpiar sesiones expiradas
docker-compose exec backend python manage.py clearsessions
```

### Logs y Debugging

```bash
# Ver logs del backend
docker-compose logs -f backend

# Ver logs del frontend
docker-compose logs -f frontend

# Ver logs de la base de datos
docker-compose logs -f db

# Entrar al shell de Django
docker-compose exec backend python manage.py shell

# Entrar al shell de PostgreSQL
docker-compose exec db psql -U erp_user -d erp_db
```

---

## 5. Uso del Sistema

### Primer Acceso

1. **Acceder al sistema**: `https://yourdomain.com`
2. **Login con superusuario** creado anteriormente
3. **Crear empresa** en `/sistemas/empresas`
4. **Crear usuarios** en `/sistemas/usuarios`
5. **Asignar permisos** en `/sistemas/roles`

### Configuración Inicial

#### 1. Configurar Empresa
- Ir a **Sistemas → Empresas**
- Crear o editar empresa
- Completar datos fiscales (RFC, razón social, etc.)

#### 2. Configurar Catálogos Base

**Contabilidad:**
- Monedas (`/contabilidad/monedas`)
- Bancos (`/contabilidad/bancos`) - Requerido para Tesorería
- Cuentas Contables (`/contabilidad/cuentas-contables`)

**RRHH:**
- Departamentos (`/rrhh/departamentos`)
- Puestos (`/rrhh/puestos`)

**Compras:**
- Proveedores (`/compras/proveedores`)
- Insumos (`/compras/insumos`)

#### 3. Configurar Tesorería

**Cuentas Bancarias:**
1. Ir a **Tesorería → Cuentas Bancarias**
2. Click en **+ Nueva Cuenta**
3. Completar:
   - Banco
   - Número de cuenta
   - CLABE
   - Tipo de cuenta
   - Moneda
   - Saldo inicial

**Cajas Chicas:**
1. Ir a **Tesorería → Cajas Chicas**
2. Click en **+ Nueva Caja**
3. Completar:
   - Nombre
   - Responsable
   - Monto del fondo

### Flujos de Trabajo

#### Flujo de Pago a Proveedor

```
1. Crear ContraRecibo
   → Tesorería → ContraRecibos → + Nuevo
   → Seleccionar proveedor y tipo
   → Subir XML/PDF de factura
   → Guardar

2. Validar ContraRecibo
   → Click en "Validar" en el ContraRecibo
   → Estado cambia a VALIDADO

3. Crear Egreso
   → Tesorería → Egresos → + Nuevo
   → Seleccionar cuenta bancaria
   → Completar beneficiario y monto
   → Vincular con ContraRecibo (opcional)
   → Guardar (Estado: BORRADOR)

4. Autorizar Egreso
   → Click en "Autorizar" (requiere permiso)
   → Estado cambia a AUTORIZADO

5. Realizar Pago
   → Click en "Pagar" (requiere permiso)
   → Estado cambia a PAGADO
   → Saldo de cuenta se actualiza automáticamente
```

#### Flujo de Caja Chica

```
1. Registrar Gasto
   → Tesorería → Cajas Chicas
   → Click en "Registrar Gasto"
   → Completar concepto y monto
   → Guardar
   → Saldo se actualiza automáticamente

2. Cerrar Caja
   → Click en "Cerrar" (requiere permiso)
   → Estado cambia a CERRADA

3. Reembolsar Caja
   → Click en "Reembolsar"
   → Fondo se restaura
   → Estado cambia a REEMBOLSADA
```

---

## 6. Solución de Problemas

### Error: "Module not found"

**Problema**: Falta algún paquete de Node.js

**Solución**:
```bash
cd frontend/erp_ui
npm install
```

### Error: "Database connection failed"

**Problema**: PostgreSQL no está corriendo o credenciales incorrectas

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Revisar logs
docker-compose logs db

# Verificar variables de entorno
cat backend/.env | grep DATABASE_URL
```

### Error: "Permission denied"

**Problema**: Usuario no tiene permisos para la operación

**Solución**:
```bash
# Actualizar permisos
docker-compose exec backend python manage.py update_permissions

# Asignar permisos al usuario en /sistemas/roles
```

### Error: "CORS policy"

**Problema**: Frontend no puede conectar con backend

**Solución**:
```bash
# Verificar CORS_ALLOWED_ORIGINS en backend/.env
# Debe incluir la URL del frontend

# Ejemplo:
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
```

### Error: "pgvector extension not found"

**Problema**: Extensión pgvector no instalada

**Solución**:
```bash
# Conectar a PostgreSQL
docker-compose exec db psql -U erp_user -d erp_db

# Crear extensión
CREATE EXTENSION IF NOT EXISTS vector;
```

### Build de Frontend Falla

**Problema**: Error en construcción de Next.js

**Solución**:
```bash
# Limpiar cache
cd frontend/erp_ui
rm -rf .next node_modules
npm install
npm run build
```

---

## 📞 Soporte

Para más información, consulta la documentación en `ERP_Docs/`:

- **PERMISOS_Y_ROLES.md** - Guía de permisos
- **TESORERIA_API.md** - API de tesorería
- **TESORERIA_FRONTEND.md** - UI de tesorería
- **ACTUALIZACIONES_IA_NAVEGACION.md** - Sistema de IA

---

**Versión**: 2.6  
**Última Actualización**: 27 de Diciembre de 2025
