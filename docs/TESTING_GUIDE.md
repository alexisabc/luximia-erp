# Guía de Testing - Sistema Sistema ERP

> **Versión:** 1.0  
> **Fecha:** 30 de diciembre de 2025  
> **Sprint:** 1 - Infraestructura de Testing

---

## 📋 Resumen

Este documento describe la infraestructura de testing configurada para el proyecto Sistema ERP, incluyendo herramientas, configuración y ejemplos de uso.

---

## 🎯 Objetivos de Testing

- ✅ **Prevenir regresiones** en producción
- ✅ **Facilitar refactorización** segura
- ✅ **Documentar comportamiento** esperado
- ✅ **Mejorar calidad** del código
- ✅ **Acelerar desarrollo** con confianza

---

## 🔧 Stack de Testing

### Backend (Django)

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| **pytest** | 8.3.4 | Framework de testing |
| **pytest-django** | 4.9.0 | Integración con Django |
| **pytest-cov** | 6.0.0 | Cobertura de código |

### Frontend (Next.js)

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| **Jest** | 29.7.0 | Framework de testing |
| **jest-environment-jsdom** | 29.7.0 | Entorno DOM para tests |
| **@testing-library/react** | 16.1.0 | Testing de componentes React |
| **@testing-library/jest-dom** | 6.6.3 | Matchers personalizados |
| **@testing-library/user-event** | 14.5.2 | Simulación de interacciones |

---

## 🚀 Configuración

### Backend

#### Archivos Creados

1. **`backend/pytest.ini`**
   - Configuración de pytest
   - Apunta a `config.settings` de Django
   - Cobertura habilitada por defecto

2. **`backend/requirements.txt`**
   - Agregadas dependencias de testing

3. **`backend/core/tests/test_sanity.py`**
   - Smoke tests básicos
   - Verifica conexión a DB de prueba

#### Ejecutar Tests Backend

```bash
# Desde la raíz del proyecto (con Docker)
docker-compose exec backend pytest

# Con cobertura
docker-compose exec backend pytest --cov

# Tests específicos
docker-compose exec backend pytest core/tests/test_sanity.py

# Con verbose
docker-compose exec backend pytest -v
```

#### Estructura de Tests Backend

```
backend/
├── pytest.ini                    # Configuración pytest
├── requirements.txt              # Dependencias (incluye pytest)
└── <app>/
    └── tests/
        ├── __init__.py
        ├── test_models.py       # Tests de modelos
        ├── test_views.py        # Tests de views/endpoints
        ├── test_services.py     # Tests de servicios
        └── test_serializers.py  # Tests de serializers
```

---

### Frontend

#### Archivos Creados

1. **`frontend/erp_ui/jest.config.js`**
   - Configuración de Jest con Next.js
   - Cobertura configurada (30% inicial)

2. **`frontend/erp_ui/jest.setup.js`**
   - Setup de @testing-library/jest-dom
   - Mocks de Next.js (router, navigation)

3. **`frontend/erp_ui/package.json`**
   - Scripts de testing agregados
   - Dependencias de testing

4. **`frontend/erp_ui/components/atoms/__tests__/Button.test.jsx`**
   - Test completo del componente Button
   - 50+ assertions

#### Ejecutar Tests Frontend

```bash
# Desde frontend/erp_ui (con Docker)
docker-compose exec frontend npm test

# Modo watch (desarrollo)
docker-compose exec frontend npm run test:watch

# Con cobertura
docker-compose exec frontend npm run test:coverage

# Sin Docker (local)
cd frontend/erp_ui
npm test
```

#### Estructura de Tests Frontend

```
frontend/erp_ui/
├── jest.config.js               # Configuración Jest
├── jest.setup.js                # Setup global
├── components/
│   ├── atoms/
│   │   ├── Button.jsx
│   │   └── __tests__/
│   │       └── Button.test.jsx
│   ├── molecules/
│   │   └── __tests__/
│   └── organisms/
│       └── __tests__/
└── services/
    └── __tests__/
```

---

## 📝 Ejemplos de Tests

### Backend: Test de Modelo

```python
# backend/tesoreria/tests/test_models.py
import pytest
from decimal import Decimal
from tesoreria.models import Egreso

@pytest.mark.django_db
class TestEgresoModel:
    def test_crear_egreso_valido(self):
        """Verifica que se puede crear un egreso válido."""
        egreso = Egreso.objects.create(
            concepto="Pago a proveedor",
            monto=Decimal("1000.00"),
            estado="BORRADOR"
        )
        
        assert egreso.concepto == "Pago a proveedor"
        assert egreso.monto == Decimal("1000.00")
        assert egreso.estado == "BORRADOR"
        assert egreso.is_active is True
    
    def test_soft_delete(self):
        """Verifica que el soft delete funciona."""
        egreso = Egreso.objects.create(
            concepto="Test",
            monto=Decimal("100.00")
        )
        
        # Soft delete
        egreso.is_active = False
        egreso.save()
        
        # No debe aparecer en queryset por defecto
        assert Egreso.objects.count() == 0
        
        # Pero sí en all_objects
        assert Egreso.all_objects.count() == 1
```

### Backend: Test de Servicio

```python
# backend/tesoreria/tests/test_services.py
import pytest
from tesoreria.services.egreso_service import EgresoService
from rest_framework.exceptions import ValidationError

@pytest.mark.django_db
class TestEgresoService:
    def test_autorizar_egreso_valido(self, user_with_permission):
        """Verifica que se puede autorizar un egreso válido."""
        egreso = EgresoService.crear_egreso({
            'concepto': 'Test',
            'monto': 1000
        })
        
        egreso_autorizado = EgresoService.autorizar_egreso(
            egreso.id, 
            user_with_permission
        )
        
        assert egreso_autorizado.estado == 'AUTORIZADO'
    
    def test_autorizar_egreso_sin_permiso(self, user_without_permission):
        """Verifica que falla si el usuario no tiene permiso."""
        egreso = EgresoService.crear_egreso({
            'concepto': 'Test',
            'monto': 1000
        })
        
        with pytest.raises(ValidationError):
            EgresoService.autorizar_egreso(egreso.id, user_without_permission)
```

### Frontend: Test de Componente

```javascript
// frontend/erp_ui/components/atoms/__tests__/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Frontend: Test de Hook

```javascript
// frontend/erp_ui/hooks/__tests__/useResource.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useResource } from '../useResource';

describe('useResource Hook', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useResource('/api/empleados'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
```

---

## 🎯 Mejores Prácticas

### General

1. **Nombrar tests descriptivamente**
   ```python
   # ✅ BIEN
   def test_crear_egreso_con_monto_negativo_falla(self):
   
   # ❌ MAL
   def test_egreso(self):
   ```

2. **Seguir patrón AAA (Arrange, Act, Assert)**
   ```python
   def test_example(self):
       # Arrange: Preparar datos
       user = create_user()
       
       # Act: Ejecutar acción
       result = service.do_something(user)
       
       # Assert: Verificar resultado
       assert result.success is True
   ```

3. **Un concepto por test**
   - Cada test debe verificar UNA cosa
   - Tests pequeños y enfocados

4. **Tests independientes**
   - No depender del orden de ejecución
   - Limpiar estado después de cada test

### Backend (pytest)

1. **Usar fixtures para datos comunes**
   ```python
   # conftest.py
   @pytest.fixture
   def user_admin():
       return User.objects.create_user(
           username='admin',
           is_staff=True
       )
   ```

2. **Marcar tests lentos**
   ```python
   @pytest.mark.slow
   def test_proceso_largo(self):
       # ...
   ```

3. **Usar `@pytest.mark.django_db` para tests con DB**

### Frontend (Jest + RTL)

1. **Preferir queries por rol/texto**
   ```javascript
   // ✅ BIEN
   screen.getByRole('button', { name: /submit/i })
   
   // ❌ MAL
   screen.getByTestId('submit-button')
   ```

2. **Simular interacciones de usuario**
   ```javascript
   import userEvent from '@testing-library/user-event';
   
   const user = userEvent.setup();
   await user.click(screen.getByRole('button'));
   ```

3. **No testear detalles de implementación**
   - Testear comportamiento, no estructura interna

---

## 📊 Cobertura de Código

### Objetivos

| Fase | Backend | Frontend |
|------|---------|----------|
| **Actual** | 5% | 0% |
| **Sprint 1-2** | 30% | 20% |
| **Sprint 3-4** | 50% | 40% |
| **Sprint 5-6** | 70% | 60% |

### Ver Cobertura

```bash
# Backend
docker-compose exec backend pytest --cov --cov-report=html
# Abrir: backend/htmlcov/index.html

# Frontend
docker-compose exec frontend npm run test:coverage
# Abrir: frontend/erp_ui/coverage/lcov-report/index.html
```

---

## 🔄 Integración Continua (CI)

### GitHub Actions (Futuro)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: |
          docker-compose up -d db
          docker-compose run backend pytest --cov
  
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Frontend Tests
        run: |
          cd frontend/erp_ui
          npm ci
          npm test -- --coverage
```

---

## 📚 Recursos

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django](https://pytest-django.readthedocs.io/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist de Sprint 1

- [x] Instalar pytest, pytest-django, pytest-cov
- [x] Crear pytest.ini
- [x] Crear smoke tests (test_sanity.py)
- [x] Instalar Jest, @testing-library/react
- [x] Crear jest.config.js
- [x] Crear jest.setup.js
- [x] Crear test de componente Button
- [x] Documentar infraestructura de testing

---

**Última actualización:** 30 de diciembre de 2025  
**Próximo paso:** Ejecutar tests y commit
