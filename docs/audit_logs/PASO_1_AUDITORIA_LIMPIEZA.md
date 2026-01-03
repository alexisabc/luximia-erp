# 🔍 PASO 1: Archivos Candidatos a Eliminar

## Resumen Ejecutivo
Tras el análisis profundo del proyecto, he identificado **archivos de utilidad temporal** que pueden ser eliminados de forma segura. El código base está **sorprendentemente limpio** sin archivos legacy, old, backup o deprecated.

---

## 📋 Categorización de Archivos

### 🟡 CATEGORÍA A: Scripts de Depuración Temporal (ELIMINAR)
Estos archivos fueron creados para resolver problemas puntuales y ya no son necesarios en el ciclo de desarrollo normal:

| Archivo | Propósito | Justificación de Eliminación |
|---------|-----------|------------------------------|
| `backend/debug_excel.py` | Script para debuggear archivos Excel de workflows | Herramienta one-time. No forma parte del core del sistema. |
| `backend/debug_users.py` | Script para listar empleados de RRHH | Debugging puntual. Puede replicarse con Django shell. |
| `backend/fix_passwords.py` | Corrección de passwords NULL | Tarea de migración completada. Ya no aplica. |
| `backend/fix_sandbox_vector.py` | Habilitar extensión pgvector en sandbox | Tarea de setup. Debería estar en migrations o entrypoint. |

**Acción Recomendada:** ✅ Eliminar todos (4 archivos)

---

### 🟢 CATEGORÍA B: Tests Standalone (MOVER A TESTS/)
Estos son tests válidos pero están en la raíz del backend en lugar de estar en las carpetas `tests/` de cada app:

| Archivo | Propósito | Acción Recomendada |
|---------|-----------|-------------------|
| `backend/test_currency.py` | Test de provisioning multi-moneda | Mover a `contabilidad/tests/test_currency.py` |
| `backend/test_diot.py` | Test de generación DIOT | Mover a `contabilidad/tests/test_diot.py` |
| `backend/test_provisioning.py` | Test de provisioning automático | Mover a `contabilidad/tests/test_provisioning.py` |
| `backend/test_sat_xml.py` | Test de parseo XML SAT | Mover a `contabilidad/tests/test_sat_xml.py` |
| `backend/test_xml_upload.py` | Test de carga de XML | Mover a `contabilidad/tests/test_xml_upload.py` |

**Acción Recomendada:** 🔄 Mover a `contabilidad/tests/` (5 archivos)

---

### 🔵 CATEGORÍA C: Carpeta Facturas (EVALUAR)
| Directorio | Contenido | Estado |
|------------|-----------|--------|
| `backend/facturas/` | Carpeta con XMLs de facturas organizados por año | Contiene solo `xml/2025/` con 4 archivos |

**Pregunta Crítica:** ¿Esta carpeta es para almacenamiento permanente de XMLs o es temporal?
- Si es **temporal/testing**: Eliminar y usar un volumen Docker o storage externo.
- Si es **permanente**: Mantener pero documentar en `.gitignore` para evitar que XMLs reales se suban al repo.

**Acción Recomendada:** ⚠️ **REQUIERE TU DECISIÓN** - ¿Eliminar o mantener?

---

### ✅ CATEGORÍA D: Código Limpio (NO TOCAR)
El resto del proyecto está **impecable**:
- ✅ No hay archivos `*_old.py`, `*_legacy.py`, `*_backup.py`
- ✅ No hay comentarios `DEPRECATED` o `FIXME` en el código
- ✅ Las apps refactorizadas (`pos`, `compras`, `rrhh`, `tesoreria`, `juridico`, `ia`, `core`, `users`) tienen estructura modular correcta
- ✅ Todos los módulos están registrados en `INSTALLED_APPS`
- ✅ No hay importaciones circulares detectadas

---

## 📊 Resumen de Acciones Propuestas

| Acción | Cantidad | Archivos |
|--------|----------|----------|
| 🗑️ **ELIMINAR** | 4 | Scripts de debug y fix |
| 🔄 **MOVER** | 5 | Tests standalone a `contabilidad/tests/` |
| ⚠️ **EVALUAR** | 1 | Carpeta `facturas/xml/` |
| ✅ **MANTENER** | Todo lo demás | Código limpio y modular |

---

## 🎯 Próximos Pasos

**Esperando tu confirmación para:**
1. ¿Procedo a eliminar los 4 scripts de debug/fix?
2. ¿Muevo los 5 tests a `contabilidad/tests/`?
3. ¿Qué hacemos con `backend/facturas/xml/`?

Una vez confirmes, procederé con el **PASO 2: Verificación de Principios (Clean Architecture)**.
