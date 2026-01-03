# Migración de Docker a Podman en Pop!_OS

## Guía Completa de Migración Local

Esta guía te ayudará a migrar de Docker a Podman en tu entorno de desarrollo local en Pop!_OS.

---

## Tarea 1: Desinstalación Completa de Docker

### Paso 1.1: Detener todos los contenedores
```bash
# Detener todos los contenedores corriendo
docker stop $(docker ps -aq) 2>/dev/null || true

# Verificar que no hay contenedores corriendo
docker ps -a
```

### Paso 1.2: Eliminar Docker completamente
```bash
# Remover paquetes de Docker
sudo apt-get purge -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin \
    docker-ce-rootless-extras \
    docker-desktop

# Remover configuraciones y datos
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo rm -rf ~/.docker

# Limpiar dependencias huérfanas
sudo apt-get autoremove -y
sudo apt-get autoclean

# Verificar que Docker fue removido
which docker  # No debería retornar nada
```

### Paso 1.3: Remover grupo docker (opcional)
```bash
# Remover grupo docker si existe
sudo groupdel docker 2>/dev/null || true

# Verificar
groups | grep docker  # No debería aparecer
```

---

## Tarea 2: Instalación de Podman

### Paso 2.1: Actualizar repositorios
```bash
sudo apt-get update
```

### Paso 2.2: Instalar Podman y herramientas
```bash
# Instalar Podman
sudo apt-get install -y podman

# Instalar podman-compose
sudo apt-get install -y podman-compose

# CRUCIAL: Instalar podman-docker (crea alias docker -> podman)
sudo apt-get install -y podman-docker

# Instalar buildah (opcional pero recomendado)
sudo apt-get install -y buildah
```

### Paso 2.3: Verificar instalación
```bash
# Verificar versiones
podman --version
podman-compose --version

# Verificar que 'docker' apunta a podman
which docker
# Debería mostrar: /usr/bin/docker (que es un symlink a podman)

docker --version
# Debería mostrar: podman version ...
```

---

## Tarea 3: Configuración del Entorno

### Paso 3.1: Habilitar socket de Podman
```bash
# Habilitar socket de usuario (para VS Code, extensiones, etc.)
systemctl --user enable --now podman.socket

# Verificar que está corriendo
systemctl --user status podman.socket
```

### Paso 3.2: Configurar variables de entorno

**Para Bash** (edita `~/.bashrc`):
```bash
# Agregar al final de ~/.bashrc
export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock
```

**Para Zsh** (edita `~/.zshrc`):
```bash
# Agregar al final de ~/.zshrc
export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock
```

**Aplicar cambios**:
```bash
# Para Bash
source ~/.bashrc

# Para Zsh
source ~/.zshrc

# Verificar
echo $DOCKER_HOST
# Debería mostrar: unix:///run/user/1000/podman/podman.sock (o tu UID)
```

### Paso 3.3: Configurar subuid/subgid (si no existe)
```bash
# Verificar configuración actual
cat /etc/subuid | grep $USER
cat /etc/subgid | grep $USER

# Si no existe, agregar (reemplaza 'tu_usuario' con tu nombre de usuario)
echo "$USER:100000:65536" | sudo tee -a /etc/subuid
echo "$USER:100000:65536" | sudo tee -a /etc/subgid
```

---

## Tarea 4: Migración del docker-compose.yml

### Cambios Necesarios

El archivo `docker-compose.yml` actual necesita las siguientes modificaciones para Podman rootless:

1. **Agregar `:Z` a todos los bind mounts** (para SELinux/AppArmor)
2. **Definir red explícita** (opcional pero recomendado)

### Ejemplo de Cambios

**ANTES:**
```yaml
volumes:
  - ./pg_data:/var/lib/postgresql/data
  - ./backend:/app
```

**DESPUÉS:**
```yaml
volumes:
  - ./pg_data:/var/lib/postgresql/data:Z
  - ./backend:/app:Z
```

### Script de Migración Automática

Ejecuta este script para actualizar automáticamente tu `docker-compose.yml`:

```bash
#!/bin/bash
# Script: migrate_compose_to_podman.sh

COMPOSE_FILE="docker-compose.yml"
BACKUP_FILE="docker-compose.yml.docker-backup"

# Crear backup
cp "$COMPOSE_FILE" "$BACKUP_FILE"
echo "✓ Backup creado: $BACKUP_FILE"

# Agregar :Z a bind mounts (rutas que empiezan con ./ o /)
sed -i 's|\(\s*-\s*\.\./\?[^:]*:[^:]*\)$|\1:Z|g' "$COMPOSE_FILE"
sed -i 's|\(\s*-\s*/[^:]*:[^:]*\)$|\1:Z|g' "$COMPOSE_FILE"

echo "✓ Etiquetas :Z agregadas a bind mounts"
echo "✓ Migración completada"
echo ""
echo "Revisa los cambios con: diff $BACKUP_FILE $COMPOSE_FILE"
```

**Uso**:
```bash
chmod +x migrate_compose_to_podman.sh
./migrate_compose_to_podman.sh
```

---

## Tarea 5: Verificación y Smoke Test

### Script de Verificación Completo

```bash
#!/bin/bash
# Script: podman_smoke_test.sh

echo "=== PODMAN SMOKE TEST ==="
echo ""

# Test 1: Verificar versión
echo "1. Verificando versión de Podman..."
podman version
echo ""

# Test 2: Verificar alias docker
echo "2. Verificando alias docker -> podman..."
docker --version
echo ""

# Test 3: Hello World
echo "3. Ejecutando Hello World..."
podman run --rm hello-world
echo ""

# Test 4: Verificar socket
echo "4. Verificando socket de Podman..."
systemctl --user status podman.socket | grep Active
echo ""

# Test 5: Verificar DOCKER_HOST
echo "5. Verificando DOCKER_HOST..."
echo "DOCKER_HOST=$DOCKER_HOST"
echo ""

# Test 6: Levantar proyecto
echo "6. Levantando proyecto con podman-compose..."
cd ~/proyectos/sistema-erp
podman-compose up -d

echo ""
echo "7. Verificando contenedores..."
podman ps

echo ""
echo "=== SMOKE TEST COMPLETADO ==="
```

**Uso**:
```bash
chmod +x podman_smoke_test.sh
./podman_smoke_test.sh
```

### Comandos de Verificación Manual

```bash
# 1. Verificar versión
podman version

# 2. Hello World
podman run --rm hello-world

# 3. Verificar socket
systemctl --user status podman.socket

# 4. Verificar DOCKER_HOST
echo $DOCKER_HOST

# 5. Levantar proyecto
cd ~/proyectos/sistema-erp
podman-compose up -d

# 6. Ver contenedores
podman ps

# 7. Ver logs
podman-compose logs -f backend

# 8. Detener proyecto
podman-compose down
```

---

## Comandos Equivalentes Docker → Podman

| Docker | Podman |
|--------|--------|
| `docker ps` | `podman ps` |
| `docker-compose up -d` | `podman-compose up -d` |
| `docker exec -it container bash` | `podman exec -it container bash` |
| `docker logs -f container` | `podman logs -f container` |
| `docker build -t name .` | `podman build -t name .` |
| `docker images` | `podman images` |
| `docker volume ls` | `podman volume ls` |

**Nota**: Con `podman-docker` instalado, puedes seguir usando `docker` y funcionará.

---

## Integración con VS Code

### Extensión Docker
La extensión oficial de Docker en VS Code funciona con Podman si:

1. Tienes `podman-docker` instalado ✓
2. Tienes `DOCKER_HOST` configurado ✓
3. El socket de Podman está corriendo ✓

### Configuración Adicional (opcional)

Agrega a tu `settings.json` de VS Code:

```json
{
  "docker.host": "unix:///run/user/1000/podman/podman.sock",
  "docker.dockerPath": "podman"
}
```

---

## Troubleshooting

### Problema: "permission denied" al correr contenedores
**Solución**: Verifica subuid/subgid
```bash
cat /etc/subuid | grep $USER
cat /etc/subgid | grep $USER
```

### Problema: VS Code no detecta contenedores
**Solución**: Verifica socket y DOCKER_HOST
```bash
systemctl --user status podman.socket
echo $DOCKER_HOST
```

### Problema: "network not found"
**Solución**: Podman crea redes automáticamente, pero puedes crearlas manualmente:
```bash
podman network create sistema-erp-network
```

### Problema: Volúmenes no persisten
**Solución**: Verifica permisos y etiquetas :Z
```bash
# Ver volúmenes
podman volume ls

# Inspeccionar volumen
podman volume inspect nombre_volumen
```

### Problema: "Error: short-name resolution"
**Solución**: Usa nombres completos de imágenes o configura registries
```bash
# Editar /etc/containers/registries.conf
sudo nano /etc/containers/registries.conf

# Agregar:
unqualified-search-registries = ["docker.io"]
```

---

## Diferencias Clave Docker vs Podman

| Característica | Docker | Podman |
|----------------|--------|--------|
| Demonio | Requiere daemon root | Sin daemon |
| Privilegios | Requiere root | Rootless por defecto |
| Systemd | No nativo | Integración nativa |
| Pods | No soporta | Soporta pods (Kubernetes) |
| Seguridad | Menor | Mayor (rootless) |

---

## Próximos Pasos

1. ✅ Desinstalar Docker
2. ✅ Instalar Podman
3. ✅ Configurar entorno
4. ✅ Migrar docker-compose.yml
5. ✅ Ejecutar smoke test
6. 🔄 Actualizar scripts del proyecto (si usan `docker` hardcoded)
7. 🔄 Configurar VS Code
8. 🔄 Probar flujo de desarrollo completo

---

## Recursos Adicionales

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/) - GUI alternativa
- [Migrating from Docker to Podman](https://podman.io/getting-started/migration)
