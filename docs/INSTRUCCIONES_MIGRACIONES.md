# 🚀 Instrucciones de Despliegue - V1.0.0

## Migraciones Pendientes

El módulo `juridico` ha sido implementado pero las migraciones de base de datos **requieren permisos de Docker**.

### Opción 1: Ejecutar con sudo (Recomendado)

```bash
# 1. Generar migraciones
sudo docker-compose exec backend python manage.py makemigrations juridico

# 2. Aplicar migraciones
sudo docker-compose exec backend python manage.py migrate

# 3. Verificar que no hubo errores
sudo docker-compose exec backend python manage.py showmigrations juridico
```

### Opción 2: Configurar permisos de Docker (Permanente)

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión para aplicar cambios
# Luego ejecutar sin sudo:
docker-compose exec backend python manage.py makemigrations juridico
docker-compose exec backend python manage.py migrate
```

### Opción 3: Ejecutar desde dentro del contenedor

```bash
# 1. Entrar al contenedor
sudo docker-compose exec backend bash

# 2. Dentro del contenedor:
python manage.py makemigrations juridico
python manage.py migrate
exit
```

## Verificación Post-Migración

```bash
# Verificar tablas creadas
sudo docker-compose exec backend python manage.py dbshell
# Dentro de psql:
\dt juridico_*
\q

# O con Django shell:
sudo docker-compose exec backend python manage.py shell
>>> from juridico.models import PlantillaLegal, DocumentoFirmado
>>> PlantillaLegal.objects.count()
0
>>> exit()
```

## Dependencias Adicionales (Opcional)

Para generar PDFs, instalar weasyprint:

```bash
# Agregar a backend/requirements.txt:
weasyprint>=60.0

# Reconstruir imagen:
sudo docker-compose build backend
sudo docker-compose up -d
```

## Rollback (Si es necesario)

```bash
# Revertir migraciones de juridico
sudo docker-compose exec backend python manage.py migrate juridico zero

# Eliminar archivos de migración
rm backend/juridico/migrations/0001_initial.py
```

---

**Nota:** Estas instrucciones son temporales hasta que se configuren los permisos de Docker correctamente.
