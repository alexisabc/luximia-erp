# 🐍 Backend API (Django)

El backend es el núcleo de la lógica de negocio. Está organizado modularmente en "Apps" de Django.

## 📂 Estructura de Directorios (`backend/`)

- `sistema_erp/`: Configuración global (`settings.py`, `urls.py`). *Nota: Nombre genérico, antes luximia_erp.*
- `contabilidad/`: **[CORE]** Gestión financiera, Proyectos, Clientes.
- `rrhh/`: Recursos Humanos, Empleados, Nómina.
- `users/`: Autenticación, Passkeys, Gestión de Usuarios.
- `auditoria/`: Logs y trazabilidad.

## 🧩 Apps Principales

### 1. Contabilidad (`backend/contabilidad`)
Módulo más extenso. Maneja el flujo de dinero.
- **Modelos Clave:**
    - `Proyecto`, `UPE` (Unidad Privativa).
    - `Cliente`, `Contrato`, `Presupuesto`.
    - `Pago` (Ingresos), `PlanPago` (Programado).
    - `TipoCambio` (Manual y Banxico).
- **API ViewSets:** `api/contabilidad/`
    - `/proyectos`, `/clientes`, `/contratos`.
    - `/dashboard/strategic/`: Endpoint especial de agregación de datos para gráficas.

### 2. RRHH (`backend/rrhh`)
Gestión del capital humano.
- **Modelos Clave:**
    - `Empleado` (Vinculado a `CustomUser`).
    - `Departamento`, `Puesto`.
    - `EsquemaComision`.
- **Relaciones:** Un `Empleado` pertenece a un `Departamento` y tiene un `Puesto`.

### 3. Usuarios (`backend/users`)
Gestión de identidad.
- **Modelo:** `CustomUser` (Extiende `AbstractUser`).
    - Campos extra: `passkey_credentials`, `totp_secret`.
- **Autenticación:**
    - `enrollment/`: Flujo de alta de nuevos usuarios vía Token.
    - `invite/`: Envío de correos de invitación.

## ⚙️ Configuración Clave (`settings.py`)

- **CORS:** Configurado para permitir peticiones solo desde el dominio del frontend.
- **CSRF:** Protección activada incluso para API calls (vía headers).
- **Cloudflare R2:** Backend de almacenamiento para archivos estáticos/media.

---

## 👨‍💻 Guía Paso a Paso: Crear un Nuevo Endpoint

Para agregar una nueva funcionalidad (ej. un "Blog" interno):

1.  **Crear la App:**
    ```bash
    python manage.py startapp blog
    ```
2.  **Definir el Modelo (`blog/models.py`):**
    ```python
    from django.db import models
    class Post(models.Model):
        titulo = models.CharField(max_length=200)
        contenido = models.TextField()
    ```
3.  **Crear Serializador (`blog/serializers.py`):**
    ```python
    from rest_framework import serializers
    from .models import Post
    class PostSerializer(serializers.ModelSerializer):
        class Meta:
            model = Post
            fields = '__all__'
    ```
4.  **Crear ViewSet (`blog/views.py`):**
    ```python
    from rest_framework import viewsets
    from .models import Post
    from .serializers import PostSerializer
    class PostViewSet(viewsets.ModelViewSet):
        queryset = Post.objects.all()
        serializer_class = PostSerializer
    ```
5.  **Registrar URLs (`blog/urls.py`):**
    ```python
    from rest_framework.routers import DefaultRouter
    from .views import PostViewSet
    router = DefaultRouter()
    router.register(r'posts', PostViewSet)
    urlpatterns = router.urls
    ```
6.  **Incluir en URLs Globales:**
    En `sistema_erp/urls.py`, agregar `path('api/blog/', include('blog.urls'))`.
