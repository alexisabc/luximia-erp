# Migración a Podman - Estado Actual

## ✅ Completado

1. **Podman Instalado**: Versión 4.9.3
2. **Herramientas**: podman-compose 1.0.6, buildah 1.33.7
3. **Socket Habilitado**: `podman.socket` activo y escuchando
4. **Variables de Entorno**: `DOCKER_HOST` configurado en `~/.bashrc`
5. **Registros**: Configurado `unqualified-search-registries` para docker.io
6. **docker-compose.yml**: Actualizado con flags `:Z` para SELinux
7. **Frontend**: Imagen construida exitosamente

## ❌ Bloqueado

### Problema: Permisos en backend/key.pem

**Error:**
```
open /backend/key.pem: permission denied
```

**Causa:**
El archivo `backend/key.pem` es propiedad de `root:root` con permisos `600`:
```bash
-rw------- 1 root root 1704 ene  3 14:09 backend/key.pem
```

**Soluciones Posibles:**

### Opción 1: Cambiar Propietario (Recomendado)
```bash
sudo chown $USER:$USER backend/key.pem
```

### Opción 2: Eliminar el Archivo (Si no es necesario para desarrollo)
```bash
sudo rm backend/key.pem
```

### Opción 3: Mover a Ubicación Segura
```bash
sudo mv backend/key.pem ~/backups/
```

## Próximos Pasos

Una vez resuelto el problema de permisos:

1. Reconstruir imagen backend:
   ```bash
   podman-compose build backend
   ```

2. Levantar todos los servicios:
   ```bash
   podman-compose up -d
   ```

3. Verificar contenedores:
   ```bash
   podman ps
   ```

4. Ver logs:
   ```bash
   podman logs -f luximia-backend
   ```

## Comandos Útiles Post-Migración

```bash
# Ver contenedores
podman ps

# Ver logs
podman logs -f <container-name>

# Reiniciar servicio
podman-compose restart backend

# Detener todo
podman-compose down

# Reconstruir
podman-compose build

# Limpiar todo
podman system prune -a
```
