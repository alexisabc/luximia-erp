# Principios de Arquitectura - Sistema ERP

> **Versión:** 1.0  
> **Fecha:** 30 de diciembre de 2025  
> **Estado:** Documento Base (En Construcción)

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
3. [Clean Code y Mejores Prácticas](#clean-code-y-mejores-prácticas)
4. [Mobile First y Atomic Design](#mobile-first-y-atomic-design)
5. [Estrategia de Branching y Commits](#estrategia-de-branching-y-commits)
6. [Soft Deletes y Auditoría](#soft-deletes-y-auditoría)
7. [Seguridad Zero Trust](#seguridad-zero-trust)
8. [Testing y Calidad](#testing-y-calidad)

---

## Visión General

Este documento establece los **principios arquitectónicos fundamentales** que guiarán el desarrollo y mantenimiento del Sistema ERP. Todos los desarrolladores deben familiarizarse con estos principios antes de contribuir al proyecto.

### Objetivos Clave

- ✅ **Mantenibilidad**: Código fácil de entender, modificar y extender
- ✅ **Escalabilidad**: Arquitectura que crece con el negocio
- ✅ **Seguridad**: Zero Trust por defecto en todas las capas
- ✅ **Calidad**: Testing automatizado y revisión de código obligatoria
- ✅ **Consistencia**: Estándares uniformes en todo el proyecto

---

## Domain-Driven Design (DDD)

### 1. Contextos Delimitados (Bounded Contexts)

El sistema está organizado en **módulos de negocio independientes** que representan contextos delimitados:

#### Backend (Django Apps)

```
backend/
├── contabilidad/      # Contexto: Finanzas y Proyectos
├── tesoreria/         # Contexto: Gestión de Tesorería
├── rrhh/              # Contexto: Recursos Humanos
├── users/             # Contexto: Autenticación e Identidad
├── compras/           # Contexto: Adquisiciones
├── pos/               # Contexto: Punto de Venta
├── juridico/          # Contexto: Legal
├── auditoria/         # Contexto: Trazabilidad
├── ia/                # Contexto: Inteligencia Artificial
├── notifications/     # Contexto: Notificaciones
└── core/              # Infraestructura Compartida
```

**Reglas:**
- ✅ Cada app representa un **bounded context** del dominio
- ✅ Las dependencias entre contextos deben ser **explícitas y mínimas**
- ✅ Usar eventos de dominio para comunicación entre contextos
- ❌ **NO** crear dependencias circulares entre apps

### 2. Capas de la Arquitectura

#### Backend (Django)

```
<app>/
├── models.py              # Entidades y Agregados del Dominio
├── serializers.py         # DTOs (Data Transfer Objects)
├── views.py               # Controladores (Capa de Aplicación)
├── services/              # Lógica de Negocio (Capa de Dominio)
│   ├── __init__.py
│   ├── <dominio>_service.py
│   └── ...
├── repositories/          # [FUTURO] Abstracción de Acceso a Datos
├── urls.py                # Rutas API
├── admin.py               # Interfaz Admin
└── migrations/            # Esquema de Base de Datos
```

**Estado Actual vs. Objetivo:**

| Aspecto | Estado Actual | Objetivo DDD |
|---------|---------------|--------------|
| **Modelos** | ✅ Bien definidos en `models.py` | ✅ Mantener |
| **Lógica de Negocio** | ⚠️ Mezclada en `views.py` (Fat Controllers) | 🎯 Mover a `services/` |
| **Servicios** | ✅ Existen en algunos módulos (`contabilidad/services/`) | 🎯 Estandarizar en todos |
| **Repositorios** | ❌ No existen (uso directo de ORM) | 🎯 Crear capa de abstracción |

#### Frontend (Next.js)

```
frontend/erp_ui/
├── app/                   # Páginas (App Router)
├── components/            # UI Atomic Design
│   ├── atoms/            # Componentes básicos
│   ├── molecules/        # Componentes compuestos
│   ├── organisms/        # Secciones complejas
│   └── templates/        # Layouts de página
├── services/              # Capa de API (Comunicación con Backend)
├── hooks/                 # Lógica Reutilizable (Custom Hooks)
├── context/               # Estado Global
└── lib/                   # Utilidades
```

**Estado Actual vs. Objetivo:**

| Aspecto | Estado Actual | Objetivo |
|---------|---------------|----------|
| **Atomic Design** | ✅ 41 componentes organizados | ✅ Mantener y expandir |
| **Servicios API** | ✅ 15 archivos modulares | ✅ Mantener |
| **Hooks Personalizados** | ⚠️ Algunos hooks (`useResource`) | 🎯 Estandarizar patrones |
| **Gestión de Estado** | ⚠️ Context API básico | 🎯 Evaluar Zustand/Redux |

### 3. Lenguaje Ubicuo (Ubiquitous Language)

**Regla de Oro:** El código debe usar el **mismo lenguaje que el negocio**.

#### Ejemplos de Términos del Dominio

| Término Negocio | Modelo Backend | Componente Frontend |
|-----------------|----------------|---------------------|
| Unidad Privativa | `UPE` | `UPECard`, `UPEForm` |
| Contra Recibo | `ContraRecibo` | `ContraReciboTable` |
| Egreso | `Egreso` | `EgresoWorkflow` |
| Empleado | `Empleado` | `EmpleadoProfile` |

**Prohibido:**
- ❌ Nombres genéricos: `Item`, `Data`, `Info`, `Manager`
- ❌ Abreviaciones no estándar: `Emp`, `Cli`, `Proy`
- ✅ Usar nombres completos y descriptivos del dominio

---

## Clean Code y Mejores Prácticas

### 1. Principios SOLID

#### Backend (Python/Django)

**Single Responsibility Principle (SRP)**
```python
# ❌ MAL: ViewSet con lógica de negocio
class EgresoViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # 50 líneas de lógica de negocio aquí...
        pass

# ✅ BIEN: ViewSet delgado, lógica en servicio
class EgresoViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        egreso = EgresoService.crear_egreso(serializer.validated_data)
        return Response(EgresoSerializer(egreso).data)
```

**Dependency Inversion Principle (DIP)**
```python
# 🎯 FUTURO: Usar repositorios abstractos
class EgresoService:
    def __init__(self, egreso_repository: EgresoRepository):
        self.repository = egreso_repository
    
    def crear_egreso(self, data):
        # Lógica de negocio
        return self.repository.save(egreso)
```

#### Frontend (JavaScript/React)

**Component Composition**
```jsx
// ❌ MAL: Componente monolítico
function EmployeePage() {
  // 200 líneas de JSX...
}

// ✅ BIEN: Composición de componentes
function EmployeePage() {
  return (
    <PageTemplate>
      <EmployeeHeader />
      <EmployeeTable />
      <EmployeeActions />
    </PageTemplate>
  );
}
```

### 2. Manejo de Errores Centralizado

#### Backend

**Estado Actual:** ✅ Implementado en `core/exceptions.py`

```python
# core/exceptions.py
def custom_exception_handler(exc, context):
    """
    Respuesta estandarizada:
    {
        "status": "error",
        "code": 400,
        "detail": "Mensaje legible",
        "errors": { ...detalles... }
    }
    """
```

**Uso en Servicios:**
```python
from rest_framework.exceptions import ValidationError

class TesoreriaService:
    @staticmethod
    def autorizar_egreso(egreso_id, user):
        egreso = Egreso.objects.get(pk=egreso_id)
        
        if egreso.estado != 'BORRADOR':
            raise ValidationError({
                'estado': 'Solo se pueden autorizar egresos en borrador'
            })
        
        # Lógica de autorización...
```

#### Frontend

**Estado Actual:** ⚠️ Manejo inconsistente

**Objetivo:** Centralizar en interceptores de Axios

```javascript
// services/api.js
axios.interceptors.response.use(
  response => response,
  error => {
    const { status, data } = error.response;
    
    // Mostrar toast con mensaje de error
    toast.error(data.detail || 'Error en la solicitud');
    
    return Promise.reject(error);
  }
);
```

---

## Mobile First y Atomic Design

### 1. Mobile First (Frontend)

**Principio:** Diseñar primero para móviles, luego escalar a desktop.

#### Breakpoints Estándar (Tailwind CSS)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Tablet pequeña
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Desktop grande
      '2xl': '1536px', // Ultra wide
    }
  }
}
```

#### Ejemplo de Componente Mobile First

```jsx
// ✅ BIEN: Mobile primero, desktop después
<div className="
  flex flex-col gap-2          /* Mobile: columna */
  md:flex-row md:gap-4         /* Desktop: fila */
  p-4 md:p-6                   /* Padding responsive */
">
  <Button className="w-full md:w-auto">Acción</Button>
</div>
```

### 2. Atomic Design

**Estado Actual:** ✅ 41 componentes implementados

#### Jerarquía de Componentes

```
Átomos (8)
├── Button, Input, Label, Icon
├── Heading, Text, Badge
└── Checkbox, Select, Textarea

Moléculas (14)
├── FormField (Label + Input + Error)
├── SearchBar (Input + Icon + Button)
├── Card (Container + Heading + Content)
└── ...

Organismos (6)
├── DataTable (Header + Rows + Pagination)
├── Navbar (Logo + Menu + UserMenu)
└── ...

Templates (6)
├── PageTemplate (Navbar + Sidebar + Content)
├── FormTemplate (Header + Form + Actions)
└── ...
```

**Reglas de Composición:**

1. **Átomos:** NO pueden importar otros átomos
2. **Moléculas:** Componen átomos
3. **Organismos:** Componen moléculas y átomos
4. **Templates:** Definen layouts con slots
5. **Páginas:** Usan templates con datos reales

---

## Estrategia de Branching y Commits

### 1. Git Flow Simplificado

```
main (producción)
  ↑
  └── develop (integración)
        ↑
        ├── feat/nueva-funcionalidad
        ├── fix/correccion-bug
        ├── docs/actualizar-readme
        └── refactor/mejorar-servicio
```

#### Tipos de Ramas

| Prefijo | Propósito | Ejemplo |
|---------|-----------|---------|
| `feat/` | Nueva funcionalidad | `feat/tesoreria-conciliacion` |
| `fix/` | Corrección de bug | `fix/login-redirect` |
| `refactor/` | Refactorización | `refactor/contabilidad-services` |
| `docs/` | Documentación | `docs/architecture-principles` |
| `test/` | Tests | `test/egreso-workflow` |
| `chore/` | Mantenimiento | `chore/update-dependencies` |

### 2. Conventional Commits (Obligatorio)

**Estado Actual:** ✅ Husky + Commitlint configurado

#### Formato

```
<tipo>[scope opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

#### Tipos Permitidos

```bash
feat:      Nueva funcionalidad
fix:       Corrección de bugs
docs:      Documentación
style:     Formato de código (sin cambios lógicos)
refactor:  Refactorización (sin cambios funcionales)
test:      Tests
chore:     Tareas de mantenimiento
perf:      Mejoras de rendimiento
ci:        Integración continua
```

#### Ejemplos

```bash
# Feature
git commit -m "feat(tesoreria): agregar conciliación bancaria automática"

# Fix
git commit -m "fix(auth): corregir redirección después de login"

# Refactor
git commit -m "refactor(contabilidad): mover lógica de negocio a services"

# Breaking Change
git commit -m "feat(api)!: cambiar estructura de respuesta de errores

BREAKING CHANGE: La estructura de errores ahora usa 'detail' en lugar de 'message'"
```

### 3. Pull Requests

**Checklist Obligatorio:**

- [ ] ✅ Commits siguen Conventional Commits
- [ ] ✅ Tests pasan (cuando existan)
- [ ] ✅ Código revisado por al menos 1 persona
- [ ] ✅ Documentación actualizada (si aplica)
- [ ] ✅ Sin conflictos con `develop`

---

## Soft Deletes y Auditoría

### 1. Soft Delete Estándar

**Modelo Base:** `core/models.py`

```python
class SoftDeleteModel(models.Model):
    """
    Modelo base para soft deletes.
    Todos los modelos de negocio DEBEN heredar de esta clase.
    """
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = SoftDeleteManager()  # Solo registros activos
    all_objects = models.Manager()  # Todos los registros
    
    class Meta:
        abstract = True
```

**Reglas:**

1. ✅ **TODOS** los modelos de negocio heredan de `SoftDeleteModel`
2. ✅ Usar `is_active=False` en lugar de `.delete()`
3. ✅ El manager por defecto (`objects`) filtra `is_active=True`
4. ✅ Usar `all_objects` para ver registros inactivos

**Ejemplo de Uso:**

```python
# Soft delete
egreso.is_active = False
egreso.save()

# Consultar solo activos (por defecto)
egresos = Egreso.objects.all()

# Consultar todos (incluyendo inactivos)
todos_egresos = Egreso.all_objects.all()
```

### 2. Auditoría Automática

**Estado Actual:** ✅ Implementado con `register_audit()`

```python
# En models.py
from core.models import register_audit

class Egreso(SoftDeleteModel):
    # ... campos ...
    pass

# Registrar para auditoría
register_audit(Egreso)
```

**Qué se Audita:**

- ✅ Creación de registros
- ✅ Modificaciones (campos cambiados)
- ✅ Soft deletes
- ✅ Usuario que realizó la acción
- ✅ Timestamp de la acción

---

## Seguridad Zero Trust

### 1. Autenticación

**Estado Actual:** ✅ Implementado

- ✅ JWT (Simple JWT)
- ✅ Passkeys (WebAuthn)
- ✅ 2FA/TOTP

### 2. Autorización Granular

**Sistema de Permisos:** 401 permisos gestionados

```python
# Permisos por acción en ViewSets
class EgresoViewSet(BaseViewSet):
    permission_classes = [HasPermissionForAction]
    
    # Mapeo automático:
    # list -> view_egreso
    # create -> add_egreso
    # update -> change_egreso
    # destroy -> delete_egreso
    # autorizar (custom) -> autorizar_egreso
```

**Regla de Oro:**
- ✅ **NUNCA** confiar en el cliente
- ✅ **SIEMPRE** validar permisos en el backend
- ✅ Usar permisos granulares, no roles genéricos

### 3. Validación de Datos

**Backend:**
```python
# Usar serializers de DRF para validación
class EgresoSerializer(serializers.ModelSerializer):
    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value
```

**Frontend:**
```javascript
// Usar react-hook-form con validación
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(egresoSchema)
});
```

---

## Testing y Calidad

### Estado Actual: ⚠️ CRÍTICO

**Backend:**
- ❌ Solo 6 archivos de test aislados
- ❌ Sin cobertura de tests unitarios
- ❌ Sin tests de integración

**Frontend:**
- ❌ 0 tests (solo tests de node_modules)
- ❌ Sin configuración de testing

### Objetivo: Cobertura Mínima 70%

#### Backend (pytest + Django TestCase)

```python
# tests/test_egreso_service.py
import pytest
from tesoreria.services import EgresoService

@pytest.mark.django_db
class TestEgresoService:
    def test_crear_egreso_valido(self):
        data = {...}
        egreso = EgresoService.crear_egreso(data)
        assert egreso.estado == 'BORRADOR'
    
    def test_autorizar_egreso_sin_permiso(self):
        with pytest.raises(PermissionDenied):
            EgresoService.autorizar_egreso(egreso_id, user_sin_permiso)
```

#### Frontend (Jest + React Testing Library)

```javascript
// __tests__/EgresoForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import EgresoForm from '@/components/organisms/EgresoForm';

describe('EgresoForm', () => {
  it('muestra error si monto es negativo', async () => {
    render(<EgresoForm />);
    
    const montoInput = screen.getByLabelText('Monto');
    fireEvent.change(montoInput, { target: { value: '-100' } });
    
    expect(await screen.findByText('El monto debe ser mayor a 0')).toBeInTheDocument();
  });
});
```

---

## Próximos Pasos

Ver [`docs/ROADMAP_REFACTOR.md`](./ROADMAP_REFACTOR.md) para el plan de refactorización detallado.

---

**Última actualización:** 30 de diciembre de 2025  
**Responsable:** Equipo de Arquitectura
