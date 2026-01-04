# Principios de Arquitectura - ERP Luximia

## 1. Soft Deletes
Todos los modelos de negocio heredan de `SoftDeleteModel` y `EmpresaOwnedModel`. El borrado lógico se realiza mediante el campo `is_active` o `deleted_at`.

## 2. Multi-tenant (Empresas)
La separación de datos se garantiza mediante el `MultiTenantManager` inyectado en los modelos. Cada consulta filtra automáticamente por la `Empresa` activa en el contexto.

## 3. Arquitectura de Servicios (DDD)
La lógica de negocio reside en `backend/[app]/services/`. Los ViewSets solo se encargan de la orquestación y respuesta HTTP.
- Los servicios son clases con métodos estáticos `@transaction.atomic` cuando hay múltiples escrituras.

## 4. Auditoría
Se utiliza `auditlog` para registrar cambios en modelos críticos. Cada modelo importante debe ser registrado en su respectivo `models.py` usando `register_audit(Model)`.

## 5. Mobile First & UI
El frontend utiliza Next.js con Tailwind CSS y Lucide React, siguiendo un diseño atómico y responsivo.

## 6. TDD (Test Driven Development)
Mínimo de cobertura en servicios críticos de dominio. Las pruebas se ubican en `backend/[app]/tests/`.
