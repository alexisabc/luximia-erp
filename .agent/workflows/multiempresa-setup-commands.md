# Comandos para Implementar Multi-Empresa

## 1. Crear Migraciones
```bash
docker compose exec backend python manage.py makemigrations core
docker compose exec backend python manage.py makemigrations users
```

## 2. Aplicar Migraciones
```bash
docker compose exec backend python manage.py migrate
```

## 3. Crear las 5 Empresas de Ejemplo
```bash
docker compose exec backend python manage.py seed_empresas
```

## 4. Verificar Empresas Creadas
```bash
docker compose exec backend python manage.py shell
>>> from core.models import Empresa
>>> Empresa.objects.all()
>>> exit()
```

## Empresas Creadas

Las siguientes 5 empresas serán creadas:

1. **LUX01 - Luximia Desarrollos**
   - RFC: LDE010101XXX
   - Enfoque: Desarrollo inmobiliario
   - Color: Azul (#3B82F6)

2. **LUX02 - Luximia Materiales**
   - RFC: MPL020202XXX
   - Enfoque: Venta de materiales pétreos (POS)
   - Color: Verde (#10B981)

3. **LUX03 - Luximia Constructora**
   - RFC: CLU030303XXX
   - Enfoque: Construcción de proyectos
   - Color: Naranja (#F59E0B)

4. **LUX04 - Luximia Inmobiliaria**
   - RFC: ILU040404XXX
   - Enfoque: Venta de lotes y departamentos
   - Color: Morado (#8B5CF6)

5. **LUX05 - Luximia Servicios**
   - RFC: SAL050505XXX
   - Enfoque: Servicios administrativos
   - Color: Rojo (#EF4444)

## Configuración Automática

El comando `seed_empresas` automáticamente:
- ✅ Crea las 5 empresas con datos completos
- ✅ Asigna LUX01 como empresa principal a todos los usuarios
- ✅ Da acceso a todas las empresas a usuarios activos
- ✅ Evita duplicados (puedes ejecutarlo múltiples veces)

## Próximos Pasos

Después de ejecutar estos comandos, podrás:
1. Cambiar entre empresas en el frontend
2. Filtrar datos automáticamente por empresa
3. Generar reportes por empresa o consolidados
4. Facturar con diferentes RFC según la empresa

## Notas Importantes

- Los usuarios existentes tendrán acceso a todas las empresas
- La empresa principal (LUX01) se usará por defecto al iniciar sesión
- Puedes cambiar estos datos después editando las empresas en el admin
- Los RFC son de ejemplo (XXX), deberás actualizarlos con los reales
