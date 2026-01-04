# 🧹 Checklist de Saneamiento del Sistema ERP

## 🚨 Conflictos y Seguridad (Acción Inmediata)
*Archivos que representan riesgo de seguridad o estructura inválida.*
- [ ] `backend/key.pem` (Certificado SSL en raíz de código. Mover a `certs/` fuera del build context o usar secrets)
- [ ] `backend/cert.pem`
- [ ] `Postgre Local.session.sql` (Archivo temporal de base de datos)
- [ ] `backend/celerybeat-schedule*` (Archivos de estado de Celery. Añadir a .gitignore y eliminar de repo)

## 🏗️ Limpieza de Backend (Estructura)
*Archivos fuera de lugar o redundantes.*
- [ ] `backend/backend/` (Carpeta anidada vacía/basura. Eliminar).
- [ ] `backend/test_flujo_oc.py`, `test_requisicion.py`, etc. (Tests sueltos en raíz. Mover a carpetas `tests/` de cada app).
- [ ] `backend/seed_audit_data.py`, `seed_rrhh_data.py`. (Scripts sueltos. Mover a `backend/core/management/commands/` o `scripts/`).

## 🐳 Infraestructura y Configuración
*Archivos de configuración redundantes.*
- [ ] `backend/Dockerfile` y `Dockerfile.prod` (Validar duplicidad con arquitectura Podman, aunque pueden ser útiles para referencia).

## 🗑️ Archivos Temporales y Documentación Obsoleta
- [ ] `docs/PROGRESO_*.md` (Más de 10 archivos de progreso parcial. Archivar en `docs/archive/` o consolidar).
- [ ] `docs/SESION_*.md` (Logs de sesiones antiguas).

## ✅ Módulos Verificados (Estado Saludable)
*Lista de módulos que parecen tener la estructura correcta.*
- [x] **RRHH**: Modularizado (`views/` package). Correcto.
- [x] **Users**: Modularizado (`views/` package). Correcto.
- [x] **Frontend**: Limpio. No se detectaron conflictos `.tsx/.jsx`.
- [x] **Contabilidad**: Estructura estándar django (`views.py`). 
