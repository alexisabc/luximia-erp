# Estructura de Assets - Luximia ERP

## 📁 Ubicaciones de Assets

### Producción / Docker
```
luximia-erp/
├── assets/                    ← PRINCIPAL (logos, imágenes compartidas)
│   ├── icon-luximia-ia.png
│   ├── icon-luximia.png
│   ├── login-bg.png
│   ├── login.jpg
│   ├── logo-luximia.jpg
│   └── logo-luximia.png
├── backend/
│   └── staticfiles/           ← Generado por collectstatic
└── frontend/
    └── luximia_erp_ui/
        └── public/            ← Assets del frontend (Next.js)
```

## ⚙️ Configuración Híbrida

El `settings.py` ahora busca assets en este orden:

1. **Variable de entorno** `ASSETS_PATH` (si está definida)
2. **Raíz del proyecto** `luximia-erp/assets/` (Docker/desarrollo)
3. **Backend** `backend/assets/` (fallback local)

### Ventajas:
- ✅ Funciona en Docker sin cambios
- ✅ Funciona en desarrollo local
- ✅ Permite override con variable de entorno
- ✅ No requiere cambios entre entornos

## 🗑️ Directorios Eliminados

Los siguientes directorios vacíos fueron eliminados:
- ❌ `backend/assets/` (vacío, sin propósito)
- ❌ `frontend/luximia_erp_ui/public/assets/` (vacío, Next.js usa `public/` directamente)

## 📝 Uso en Frontend (Next.js)

Para usar assets en el frontend:

```jsx
// Opción 1: Assets en public/ (recomendado para Next.js)
<Image src="/logo-luximia.png" alt="Logo" />

// Opción 2: Copiar assets necesarios a public/
// cp ../../../assets/logo-luximia.png public/
```

## 🔧 Comandos Útiles

```bash
# Ver qué assets está usando Django
docker compose exec backend python manage.py findstatic logo-luximia.png

# Recolectar archivos estáticos para producción
docker compose exec backend python manage.py collectstatic --noinput

# Verificar configuración
docker compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.ASSETS_PATH)
>>> print(settings.STATICFILES_DIRS)
```

## 📦 Agregar Nuevos Assets

1. **Para Backend (Django):**
   - Agregar a `luximia-erp/assets/`
   - Ejecutar `collectstatic` en producción

2. **Para Frontend (Next.js):**
   - Agregar a `frontend/luximia_erp_ui/public/`
   - Referenciar como `/nombre-archivo.ext`

## 🚀 Producción

En producción, asegúrate de:
1. Ejecutar `collectstatic` para copiar assets a `staticfiles/`
2. Configurar servidor web (nginx) para servir `/static/` desde `staticfiles/`
3. Usar CDN para assets pesados si es necesario
