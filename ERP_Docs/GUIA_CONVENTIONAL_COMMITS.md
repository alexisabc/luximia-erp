# Guía de Conventional Commits

## 📋 Índice
- [Introducción](#introducción)
- [Formato General](#formato-general)
- [Tipos de Commit Permitidos](#tipos-de-commit-permitidos)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Scopes Recomendados](#scopes-recomendados)
- [Breaking Changes](#breaking-changes)
- [Buenas Prácticas](#buenas-prácticas)

---

## Introducción

Este proyecto utiliza **Conventional Commits** para mantener un historial de commits limpio, semántico y fácil de seguir. Los commits están validados automáticamente mediante **Husky** y **Commitlint**.

### ¿Por qué Conventional Commits?
- ✅ Historial de cambios legible y estructurado
- ✅ Generación automática de CHANGELOGs
- ✅ Versionado semántico automático
- ✅ Mejor colaboración en equipo
- ✅ Facilita el code review

---

## Formato General

```
<tipo>[scope opcional]: <descripción>

[cuerpo opcional]

[footer(s) opcional(es)]
```

### Estructura:
- **tipo**: Categoría del cambio (obligatorio)
- **scope**: Módulo o área afectada (opcional)
- **descripción**: Resumen breve del cambio (obligatorio)
- **cuerpo**: Explicación detallada (opcional)
- **footer**: Información adicional como breaking changes o referencias (opcional)

---

## Tipos de Commit Permitidos

### 🎯 `feat` - Nueva Funcionalidad
Añade una nueva característica o funcionalidad al proyecto.

**Ejemplos:**
```bash
feat: agregar módulo de reportes financieros
feat(pos): implementar sistema de descuentos
feat(auth): añadir autenticación con Google OAuth
```

---

### 🐛 `fix` - Corrección de Bugs
Corrige un error o bug en el código.

**Ejemplos:**
```bash
fix: corregir cálculo de impuestos en facturación
fix(pos): resolver error en cierre de caja
fix(backend): solucionar fuga de memoria en API
```

---

### 📚 `docs` - Documentación
Cambios únicamente en la documentación.

**Ejemplos:**
```bash
docs: actualizar README con instrucciones de instalación
docs(api): documentar endpoints de tesorería
docs: agregar guía de conventional commits
```

---

### 💄 `style` - Formato de Código
Cambios que no afectan la lógica del código (espacios, formato, punto y coma, etc.).

**Ejemplos:**
```bash
style: aplicar formato con Prettier
style(frontend): corregir indentación en componentes
style: eliminar espacios en blanco innecesarios
```

---

### ♻️ `refactor` - Refactorización
Cambios en el código que no corrigen bugs ni añaden funcionalidades.

**Ejemplos:**
```bash
refactor: simplificar lógica de validación de usuarios
refactor(pos): extraer lógica de cálculo a servicio separado
refactor: migrar componentes de clase a hooks
```

---

### ✅ `test` - Tests
Añadir o modificar tests.

**Ejemplos:**
```bash
test: agregar tests unitarios para módulo de inventario
test(api): añadir tests de integración para endpoints
test: mejorar cobertura de tests en servicios
```

---

### 🔧 `chore` - Tareas de Mantenimiento
Cambios en el proceso de build, herramientas auxiliares, dependencias, etc.

**Ejemplos:**
```bash
chore: actualizar dependencias de npm
chore(docker): optimizar configuración de contenedores
chore: configurar husky y commitlint
```

---

### ⚡ `perf` - Mejoras de Rendimiento
Cambios que mejoran el rendimiento del código.

**Ejemplos:**
```bash
perf: optimizar consultas SQL en módulo de reportes
perf(frontend): implementar lazy loading en componentes
perf: reducir tiempo de carga de imágenes
```

---

### 🚀 `ci` - Integración Continua
Cambios en archivos y scripts de CI/CD.

**Ejemplos:**
```bash
ci: configurar GitHub Actions para deploy automático
ci: agregar pipeline de testing en GitLab CI
ci(dokploy): optimizar proceso de deployment
```

---

### 🔙 `revert` - Revertir Cambios
Revierte un commit anterior.

**Ejemplos:**
```bash
revert: revertir "feat: agregar módulo de reportes"
```

---

## Ejemplos Prácticos

### Commit Simple
```bash
git commit -m "feat: agregar filtro de búsqueda en productos"
```

### Commit con Scope
```bash
git commit -m "fix(pos): corregir error en cálculo de cambio"
```

### Commit con Cuerpo
```bash
git commit -m "refactor(auth): simplificar lógica de autenticación

- Extraer validación de tokens a función separada
- Eliminar código duplicado
- Mejorar manejo de errores"
```

### Commit con Breaking Change
```bash
git commit -m "feat(api): cambiar estructura de respuesta de endpoints

BREAKING CHANGE: Los endpoints ahora retornan datos en formato envelope
con las propiedades 'data', 'message' y 'status'"
```

---

## Scopes Recomendados

Los scopes ayudan a identificar qué parte del proyecto fue modificada:

### Backend
- `api` - Endpoints y rutas
- `auth` - Autenticación y autorización
- `db` - Base de datos y migraciones
- `models` - Modelos de datos
- `services` - Servicios de negocio
- `middleware` - Middlewares
- `utils` - Utilidades

### Frontend
- `ui` - Componentes de interfaz
- `pages` - Páginas
- `hooks` - Custom hooks
- `context` - Context API
- `styles` - Estilos
- `routing` - Enrutamiento

### Módulos de Negocio
- `pos` - Punto de Venta
- `inventory` - Inventario
- `sales` - Ventas
- `treasury` - Tesorería
- `reports` - Reportes
- `users` - Usuarios
- `products` - Productos

### DevOps
- `docker` - Configuración de Docker
- `ci` - Integración continua
- `deploy` - Deployment
- `config` - Configuración general

---

## Breaking Changes

Los **Breaking Changes** son cambios que rompen la compatibilidad con versiones anteriores.

### Cómo indicarlos:

**Opción 1: En el footer**
```bash
git commit -m "feat(api): cambiar formato de respuesta

BREAKING CHANGE: La estructura de respuesta cambió de objeto plano a envelope"
```

**Opción 2: Con `!` después del tipo/scope**
```bash
git commit -m "feat(api)!: cambiar formato de respuesta"
```

---

## Buenas Prácticas

### ✅ DO (Hacer)
- Usa el imperativo presente: "agregar" no "agregado" ni "agregando"
- Sé conciso pero descriptivo
- Primera letra en minúscula
- No uses punto final en la descripción
- Usa scopes para mayor claridad
- Agrupa cambios relacionados en un solo commit
- Escribe commits en español (consistencia con el equipo)

### ❌ DON'T (No Hacer)
- No uses mensajes genéricos como "fix bug" o "update"
- No mezcles múltiples tipos de cambios en un commit
- No uses mayúsculas al inicio de la descripción
- No hagas commits demasiado grandes
- No uses puntos suspensivos (...)

---

## Ejemplos de Commits Rechazados ❌

```bash
# Muy genérico
git commit -m "actualización"

# No sigue el formato
git commit -m "Agregué una nueva función"

# Tipo incorrecto
git commit -m "update: cambiar color del botón"

# Mayúscula al inicio
git commit -m "feat: Agregar módulo de reportes"

# Punto final
git commit -m "fix: corregir bug en login."
```

---

## Ejemplos de Commits Correctos ✅

```bash
# Funcionalidad nueva
git commit -m "feat(pos): agregar sistema de descuentos por volumen"

# Corrección de bug
git commit -m "fix(inventory): corregir cálculo de stock disponible"

# Documentación
git commit -m "docs: actualizar guía de instalación con Docker"

# Refactorización
git commit -m "refactor(auth): extraer lógica de JWT a servicio separado"

# Mejora de rendimiento
git commit -m "perf(reports): optimizar consulta de ventas mensuales"

# Configuración
git commit -m "chore: actualizar dependencias de seguridad"
```

---

## Validación Automática

Este proyecto tiene configurado **Husky** para validar automáticamente tus commits:

1. Al hacer `git commit`, Husky ejecuta el hook `commit-msg`
2. Commitlint valida que el mensaje siga el formato Conventional Commits
3. Si el mensaje es válido ✅, el commit se realiza
4. Si el mensaje es inválido ❌, el commit es rechazado con un mensaje de error

### Ejemplo de rechazo:
```bash
$ git commit -m "actualización de archivos"

⧗   input: actualización de archivos
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
```

---

## Recursos Adicionales

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Semantic Versioning](https://semver.org/)

---

## Soporte

Si tienes dudas sobre cómo estructurar un commit, consulta esta guía o pregunta al equipo.

**Recuerda:** Un buen mensaje de commit es una inversión en la mantenibilidad del proyecto. 🚀
