# Solución al Problema de Podman Compose

## Problema
Al ejecutar `podman compose up`, se obtenía el error:
```
ModuleNotFoundError: No module named 'distutils'
```

## Causa
- `podman compose` (sin guion) intenta usar `/usr/bin/docker-compose` como fallback
- `docker-compose` versión 1.29.2 requiere el módulo `distutils`
- Python 3.12 removió el módulo `distutils`
- Pop!_OS no tiene `python3-distutils` disponible

## Solución ✅
Usar `podman-compose` (CON GUION) en lugar de `podman compose`:

```bash
# ❌ NO FUNCIONA
podman compose up -d

# ✅ FUNCIONA
podman-compose up -d
```

## Comandos Útiles

### Desarrollo
```bash
# Iniciar todos los servicios
podman-compose up -d

# Ver logs
podman-compose logs -f

# Detener servicios
podman-compose down

# Reconstruir imágenes
podman-compose build

# Reiniciar un servicio específico
podman-compose restart backend
```

### Producción
```bash
# Usar archivo de producción
podman-compose -f docker-compose.prod.yml up -d

# Pull de imágenes
podman-compose -f docker-compose.prod.yml pull
```

## Alternativas

### Opción 1: Alias en ~/.bashrc
```bash
echo 'alias podman-compose="podman-compose"' >> ~/.bashrc
source ~/.bashrc
```

### Opción 2: Script de inicio rápido
```bash
bash scripts/podman_start.sh
```

## Notas
- `podman-compose` versión 1.0.6 funciona correctamente
- No se requiere instalar docker-compose
- Podman 4.9.3 es totalmente compatible
