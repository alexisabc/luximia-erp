# Roadmap de Refactorización - Sistema ERP Luximia

> **Versión:** 1.0  
> **Fecha:** 30 de diciembre de 2025  
> **Prioridad:** Alta

---

## 📊 Resumen Ejecutivo

### Estado Actual del Proyecto

| Categoría | Cumplimiento | Observaciones |
|-----------|--------------|---------------|
| **Estructura DDD** | 🟡 40% | Apps bien definidas, pero lógica mezclada |
| **Clean Code** | 🟡 50% | Código legible, pero fat controllers |
| **Mobile First** | 🟢 85% | Atomic Design implementado correctamente |
| **Testing** | 🔴 10% | Cobertura crítica insuficiente |
| **Seguridad** | 🟢 80% | Auth sólido, falta validación consistente |
| **Documentación** | 🟢 90% | 66 docs existentes, ahora con principios |

**Promedio General:** 🟡 **59%** de cumplimiento con los principios arquitectónicos

---

## 🚨 Deuda Técnica Detectada

### Crítica (P0 - Resolver Inmediatamente)

#### 1. **Ausencia de Tests Automatizados**

**Impacto:** 🔴 Crítico  
**Esfuerzo:** 🔴 Alto (3-4 semanas)

**Problema:**
- Backend: Solo 6 archivos de test aislados (`test_currency.py`, `test_diot.py`, etc.)
- Frontend: 0 tests de componentes o lógica de negocio
- Sin CI/CD con validación de tests

**Riesgos:**
- Regresiones no detectadas en producción
- Refactorización peligrosa sin red de seguridad
- Dificultad para onboarding de nuevos desarrolladores

**Solución Propuesta:**
```
Fase 1: Configuración (1 semana)
├── Backend: pytest + pytest-django + coverage
├── Frontend: Jest + React Testing Library
└── CI/CD: GitHub Actions con validación obligatoria

Fase 2: Tests Críticos (2 semanas)
├── Backend: Servicios de Tesorería (Egresos, Conciliación)
├── Backend: Autenticación y Permisos
├── Frontend: Formularios críticos (Egreso, Empleado)
└── Frontend: Flujos de autorización

Fase 3: Cobertura Incremental (ongoing)
└── Objetivo: 70% cobertura en 3 meses
```

**Archivos Afectados:**
- `backend/pytest.ini` (nuevo)
- `backend/conftest.py` (nuevo)
- `frontend/jest.config.js` (nuevo)
- `.github/workflows/ci.yml` (nuevo)

---

#### 2. **Fat Controllers (Lógica de Negocio en Views)**

**Impacto:** 🔴 Crítico  
**Esfuerzo:** 🟡 Medio (2-3 semanas)

**Problema:**
- ViewSets con 50-100 líneas de lógica de negocio
- Dificulta testing unitario
- Viola Single Responsibility Principle

**Ejemplo Detectado:**
```python
# backend/contabilidad/views.py (líneas 319-406)
@action(detail=False, methods=['post'], url_path='upload-xml')
def upload_xml(self, request):
    # 87 líneas de lógica de parsing, validación y creación
    # Debería estar en un servicio
```

**Solución Propuesta:**
```python
# ✅ Refactorizar a:
# backend/contabilidad/services/factura_service.py
class FacturaService:
    @staticmethod
    def procesar_xml_cfdi(archivo):
        """Lógica de negocio aislada y testeable"""
        pass

# backend/contabilidad/views.py
@action(detail=False, methods=['post'], url_path='upload-xml')
def upload_xml(self, request):
    archivos = request.FILES.getlist('xmls')
    resultados = FacturaService.procesar_xml_cfdi(archivos)
    return Response(resultados)
```

**Módulos Prioritarios:**
1. `contabilidad/views.py` → Crear `services/factura_service.py`
2. `tesoreria/views.py` → Crear `services/egreso_service.py`
3. `rrhh/views.py` → Crear `services/nomina_service.py`

---

### Alta (P1 - Resolver en 1-2 Sprints)

#### 3. **Inconsistencia en Uso de Servicios**

**Impacto:** 🟡 Alto  
**Esfuerzo:** 🟢 Bajo (1 semana)

**Problema:**
- Algunos módulos tienen carpeta `services/` (`contabilidad`, `tesoreria`)
- Otros módulos tienen lógica directamente en `views.py`
- No hay estándar de cuándo usar servicios

**Módulos sin Servicios:**
- `rrhh/` (35 archivos, lógica compleja de nómina)
- `compras/` (8 archivos)
- `pos/` (14 archivos)
- `users/` (30 archivos)

**Solución:**
```
Crear estructura estándar:
<app>/
├── services/
│   ├── __init__.py
│   ├── <dominio>_service.py
│   └── ...
```

**Criterio para Usar Servicios:**
- ✅ Lógica de negocio compleja (>10 líneas)
- ✅ Operaciones que involucran múltiples modelos
- ✅ Cálculos o validaciones de dominio
- ❌ CRUD simple (puede quedarse en ViewSet)

---

#### 4. **Manejo de Errores Inconsistente en Frontend**

**Impacto:** 🟡 Alto  
**Esfuerzo:** 🟢 Bajo (3-5 días)

**Problema:**
- Algunos componentes manejan errores con `try/catch`
- Otros usan callbacks de error
- No hay interceptor centralizado en Axios

**Solución:**
```javascript
// services/api.js
import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Interceptor de respuesta
api.interceptors.response.use(
  response => response,
  error => {
    const { status, data } = error.response || {};
    
    // Manejo centralizado
    if (status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('No tienes permisos para esta acción');
    } else {
      toast.error(data?.detail || 'Error en la solicitud');
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

**Archivos a Actualizar:**
- `frontend/erp_ui/services/api.js` (modificar)
- Todos los servicios (`accounting.js`, `treasury.js`, etc.)

---

### Media (P2 - Resolver en 2-3 Sprints)

#### 5. **Falta de Capa de Repositorio (Backend)**

**Impacto:** 🟡 Medio  
**Esfuerzo:** 🟡 Medio (2 semanas)

**Problema:**
- Uso directo del ORM de Django en servicios
- Dificulta testing (necesita DB real)
- Acoplamiento a Django ORM

**Solución (Patrón Repository):**
```python
# core/repositories/base_repository.py
from abc import ABC, abstractmethod

class BaseRepository(ABC):
    @abstractmethod
    def get_by_id(self, id):
        pass
    
    @abstractmethod
    def save(self, entity):
        pass

# tesoreria/repositories/egreso_repository.py
class EgresoRepository(BaseRepository):
    def get_by_id(self, id):
        return Egreso.objects.get(pk=id)
    
    def save(self, egreso):
        egreso.save()
        return egreso
```

**Beneficios:**
- ✅ Testing con mocks (sin DB)
- ✅ Abstracción de persistencia
- ✅ Facilita migración a otro ORM si fuera necesario

---

#### 6. **Gestión de Estado Global en Frontend**

**Impacto:** 🟡 Medio  
**Esfuerzo:** 🟡 Medio (1-2 semanas)

**Problema:**
- Context API básico (`AuthContext`, `CompanyContext`)
- No hay patrón claro para estado compartido
- Re-renders innecesarios

**Solución:**
Evaluar e implementar **Zustand** (más ligero que Redux)

```javascript
// stores/authStore.js
import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

**Ventajas:**
- ✅ Menos boilerplate que Redux
- ✅ TypeScript friendly
- ✅ DevTools integrado

---

### Baja (P3 - Mejora Continua)

#### 7. **Documentación de APIs (OpenAPI/Swagger)**

**Impacto:** 🟢 Bajo  
**Esfuerzo:** 🟢 Bajo (2-3 días)

**Solución:**
```python
# backend/config/settings.py
INSTALLED_APPS += ['drf_spectacular']

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# backend/config/urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

---

## 🎯 Módulos Prioritarios para Refactorización

### Top 3 Módulos Críticos

#### 1. **Tesorería (`backend/tesoreria/`)**

**Razón:** Lógica financiera crítica, alto riesgo de errores

**Estado Actual:**
- ✅ Tiene carpeta `services/` (pero incompleta)
- ⚠️ ViewSets con lógica mezclada
- ❌ Sin tests

**Plan de Refactorización:**
```
Semana 1: Tests
├── Crear tests para EgresoService
├── Crear tests para ConciliacionService
└── Cobertura mínima: 60%

Semana 2: Refactorización
├── Mover lógica de views.py a services/
├── Implementar validaciones de dominio
└── Documentar flujos de autorización

Semana 3: Repositorios (opcional)
└── Crear EgresoRepository para abstracción
```

**Archivos Clave:**
- [`backend/tesoreria/views.py`](file:///home/alexisabc/projects/sistema-erp/backend/tesoreria/views.py) (13,799 bytes)
- [`backend/tesoreria/models.py`](file:///home/alexisabc/projects/sistema-erp/backend/tesoreria/models.py) (12,685 bytes)

---

#### 2. **Contabilidad (`backend/contabilidad/`)**

**Razón:** Módulo más grande, múltiples responsabilidades

**Estado Actual:**
- ✅ Tiene carpeta `services/` con 8 archivos
- ⚠️ Modelo `models.py` muy grande (535 líneas)
- ❌ ViewSets con lógica de parsing XML (87 líneas)

**Plan de Refactorización:**
```
Semana 1: Separar Modelos
├── Dividir models.py en módulos:
│   ├── models/catalogo.py (Moneda, Banco, MetodoPago)
│   ├── models/proyectos.py (Proyecto, UPE, Cliente)
│   ├── models/contabilidad.py (CuentaContable, Poliza)
│   └── models/fiscal.py (Factura, CertificadoDigital)

Semana 2: Refactorizar Views
├── Mover upload_xml a FacturaService
├── Mover generación DIOT a DIOTService
└── Crear tests para servicios críticos
```

**Archivos Clave:**
- [`backend/contabilidad/models.py`](file:///home/alexisabc/projects/sistema-erp/backend/contabilidad/models.py) (24,351 bytes) 🔴
- [`backend/contabilidad/views.py`](file:///home/alexisabc/projects/sistema-erp/backend/contabilidad/views.py) (26,329 bytes) 🔴

---

#### 3. **RRHH (`backend/rrhh/`)**

**Razón:** Lógica compleja de nómina, sin servicios

**Estado Actual:**
- ❌ Sin carpeta `services/`
- ⚠️ 35 archivos (segundo módulo más grande)
- ❌ Lógica de cálculo de nómina probablemente en views

**Plan de Refactorización:**
```
Semana 1: Crear Servicios
├── services/nomina_service.py (cálculos IMSS, ISR)
├── services/empleado_service.py (gestión de expedientes)
└── services/comision_service.py (cálculo de comisiones)

Semana 2: Tests
├── Tests para cálculos de nómina (crítico)
├── Tests para validaciones de empleados
└── Cobertura mínima: 70%
```

---

## 📅 Cronograma Propuesto

### Sprint 1 (2 semanas) - Fundamentos

**Objetivo:** Establecer infraestructura de testing

- [ ] Configurar pytest + coverage (Backend)
- [ ] Configurar Jest + RTL (Frontend)
- [ ] Configurar CI/CD con GitHub Actions
- [ ] Crear primeros 10 tests críticos (Tesorería)

**Entregables:**
- `backend/pytest.ini`
- `frontend/jest.config.js`
- `.github/workflows/ci.yml`
- `backend/tesoreria/tests/test_egreso_service.py`

---

### Sprint 2 (2 semanas) - Refactorización Tesorería

**Objetivo:** Aplicar DDD en módulo crítico

- [ ] Mover lógica de `tesoreria/views.py` a servicios
- [ ] Crear `EgresoService`, `ConciliacionService`
- [ ] Tests con cobertura 60%+
- [ ] Documentar flujos de autorización

**Entregables:**
- `backend/tesoreria/services/egreso_service.py`
- `backend/tesoreria/tests/` (10+ archivos)
- `docs/TESORERIA_FLOWS.md`

---

### Sprint 3 (2 semanas) - Refactorización Contabilidad

**Objetivo:** Modularizar módulo más grande

- [ ] Dividir `contabilidad/models.py` en submódulos
- [ ] Refactorizar `upload_xml` a `FacturaService`
- [ ] Crear interceptor de errores en Frontend
- [ ] Tests para servicios de facturación

**Entregables:**
- `backend/contabilidad/models/` (4 archivos)
- `backend/contabilidad/services/factura_service.py`
- `frontend/erp_ui/services/api.js` (actualizado)

---

### Sprint 4 (2 semanas) - RRHH y Servicios Faltantes

**Objetivo:** Estandarizar servicios en todos los módulos

- [ ] Crear servicios en `rrhh/`, `compras/`, `pos/`
- [ ] Implementar patrón Repository (opcional)
- [ ] Tests para nómina (crítico)
- [ ] Documentar estándares de servicios

**Entregables:**
- `backend/rrhh/services/` (3+ archivos)
- `docs/SERVICE_PATTERNS.md`
- Cobertura global: 40%+

---

### Sprint 5-6 (4 semanas) - Testing Masivo

**Objetivo:** Alcanzar 70% de cobertura

- [ ] Tests unitarios para todos los servicios
- [ ] Tests de integración para flujos críticos
- [ ] Tests de componentes en Frontend
- [ ] E2E tests para flujos principales (opcional)

**Entregables:**
- Cobertura Backend: 70%+
- Cobertura Frontend: 60%+
- `docs/TESTING_GUIDE.md`

---

## 🎓 Capacitación Requerida

### Para el Equipo de Desarrollo

1. **Domain-Driven Design (DDD)**
   - Workshop: 4 horas
   - Temas: Bounded Contexts, Servicios, Repositorios

2. **Testing en Python/Django**
   - Workshop: 4 horas
   - Temas: pytest, fixtures, mocking

3. **Testing en React**
   - Workshop: 4 horas
   - Temas: Jest, RTL, testing de hooks

4. **Git Flow + Conventional Commits**
   - Workshop: 2 horas
   - Temas: Branching, PRs, Husky

---

## 📈 Métricas de Éxito

### Indicadores Clave (KPIs)

| Métrica | Estado Actual | Objetivo 3 Meses | Objetivo 6 Meses |
|---------|---------------|------------------|------------------|
| **Cobertura Tests Backend** | 5% | 50% | 70% |
| **Cobertura Tests Frontend** | 0% | 40% | 60% |
| **Servicios Implementados** | 40% | 80% | 100% |
| **Fat Controllers** | 60% | 30% | 10% |
| **Tiempo Promedio PR** | N/A | <2 días | <1 día |
| **Bugs en Producción** | N/A | -30% | -50% |

---

## 🚀 Inicio Rápido

### Paso 1: Configurar Testing (Esta Semana)

```bash
# Backend
cd backend
pip install pytest pytest-django pytest-cov
pytest --cov=. --cov-report=html

# Frontend
cd frontend/erp_ui
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm test
```

### Paso 2: Primer Refactor (Próxima Semana)

Elegir **1 ViewSet** del módulo de Tesorería y:
1. Crear servicio correspondiente
2. Mover lógica de negocio
3. Escribir 3-5 tests
4. Crear PR con revisión

---

## 📚 Referencias

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Última actualización:** 30 de diciembre de 2025  
**Próxima revisión:** 15 de enero de 2026
