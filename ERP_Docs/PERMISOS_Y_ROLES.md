# Instrucciones para Actualizar Permisos y Traducciones

## 📋 Resumen de Cambios

Se han implementado las siguientes mejoras al sistema de permisos:

### 1. **Permisos Traducidos al Español**
   - Todos los permisos estándar de Django ahora tienen nombres en español
   - Permisos personalizados con descripciones claras en español

### 2. **Nuevos Permisos Personalizados**

#### 👥 Usuarios (`users`)
- `view_dashboard` - Ver Dashboard
- `view_inactive_records` - Ver registros inactivos globalmente
- `hard_delete_records` - Eliminar permanentemente registros
- `view_consolidado` - Ver reportes consolidados entre empresas
- `use_ai` - Usar funciones de IA
- `view_inactive_users` - Ver usuarios inactivos
- `hard_delete_customuser` - Eliminar permanentemente usuarios

#### 💼 RRHH (`rrhh`)
- `calcular_nomina` - Calcular Nómina
- `autorizar_nomina` - Autorizar Nómina
- `timbrar_nomina` - Timbrar Recibos de Nómina (CFDI)
- `cancelar_nomina` - Cancelar Nómina
- `exportar_sua` - Exportar archivos SUA
- `exportar_idse` - Exportar archivos IDSE
- `calcular_ptu` - Calcular PTU
- `calcular_finiquito` - Calcular Finiquito/Liquidación
- `view_salary_details` - Ver detalles salariales
- `modify_salary` - Modificar salarios
- `view_imss_data` - Ver datos IMSS
- `manage_infonavit` - Gestionar créditos Infonavit

#### 💰 Contabilidad (`contabilidad`)
- `cerrar_periodo` - Cerrar Periodo Contable
- `reabrir_periodo` - Reabrir Periodo Contable
- `autorizar_poliza` - Autorizar Pólizas
- `cancelar_poliza` - Cancelar Pólizas
- `generar_xml_sat` - Generar XML para SAT
- `timbrar_factura` - Timbrar Facturas (CFDI)
- `cancelar_factura` - Cancelar Facturas
- `view_reportes_fiscales` - Ver Reportes Fiscales
- `export_contabilidad_electronica` - Exportar Contabilidad Electrónica

#### 🛒 Compras (`compras`)
- `solicitar_vobo` - Solicitar VoBo en Órdenes de Compra
- `dar_vobo` - Dar VoBo a Órdenes de Compra
- `autorizar_oc` - Autorizar Órdenes de Compra
- `rechazar_oc` - Rechazar Órdenes de Compra

#### 💵 Tesorería (`tesoreria`)
- `autorizar_egreso` - Autorizar Egresos
- `realizar_pago` - Realizar Pagos
- `conciliar_banco` - Conciliar Cuentas Bancarias
- `cerrar_caja` - Cerrar Caja Chica

#### 🏪 POS (`pos`)
- `abrir_turno` - Abrir Turno
- `cerrar_turno` - Cerrar Turno
- `realizar_corte` - Realizar Corte de Caja
- `cancelar_venta` - Cancelar Ventas
- `aplicar_descuento` - Aplicar Descuentos

---

## 🚀 Pasos para Aplicar los Cambios

### Opción A: Usando Docker (Recomendado)

```bash
# 1. Crear las migraciones
docker-compose exec backend python manage.py makemigrations users

# 2. Aplicar las migraciones
docker-compose exec backend python manage.py migrate

# 3. Ejecutar el comando de actualización de permisos
docker-compose exec backend python manage.py update_permissions
```

### Opción B: Entorno Local

```bash
# 1. Activar el entorno virtual (si aplica)
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# 2. Navegar al directorio backend
cd backend

# 3. Crear las migraciones
python manage.py makemigrations users

# 4. Aplicar las migraciones
python manage.py migrate

# 5. Ejecutar el comando de actualización de permisos
python manage.py update_permissions
```

---

## 📝 Verificación

Después de ejecutar los comandos, verifica que:

1. **Permisos Creados**: El comando `update_permissions` mostrará cuántos permisos fueron creados/actualizados
2. **Admin Panel**: En `/admin/auth/permission/` deberías ver todos los permisos con nombres en español
3. **Roles**: En la gestión de roles (`/sistemas/roles/`) los permisos aparecerán traducidos

---

## 🔧 Archivos Modificados

1. **`backend/users/models.py`**
   - Actualizado `CustomUser.Meta.permissions` con traducciones
   - Agregados `verbose_name` y `verbose_name_plural`

2. **`backend/core/management/commands/update_permissions.py`** (NUEVO)
   - Comando para actualizar traducciones de permisos
   - Mapeo completo de modelos y acciones
   - Creación de permisos personalizados

---

## 💡 Uso de Permisos en el Código

### En Views (Backend)

```python
from rest_framework.permissions import BasePermission

class CanCalculatePayroll(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('rrhh.calcular_nomina')

# En ViewSet
class NominaViewSet(viewsets.ModelViewSet):
    permission_classes = [CanCalculatePayroll]
```

### En Templates/Frontend

```python
# Verificar en el backend antes de enviar datos
if request.user.has_perm('contabilidad.timbrar_factura'):
    # Permitir timbrado
    pass
```

### Asignación a Roles

```python
from django.contrib.auth.models import Group, Permission

# Crear rol de Contador
contador_group = Group.objects.get_or_create(name='Contador')[0]

# Asignar permisos
permisos = [
    'contabilidad.view_poliza',
    'contabilidad.add_poliza',
    'contabilidad.change_poliza',
    'contabilidad.autorizar_poliza',
]

for perm_code in permisos:
    app, codename = perm_code.split('.')
    perm = Permission.objects.get(
        content_type__app_label=app,
        codename=codename
    )
    contador_group.permissions.add(perm)
```

---

## 🎯 Próximos Pasos Recomendados

1. **Definir Roles Estándar**: Crear roles predefinidos (Contador, Gerente RRHH, etc.)
2. **Documentar Permisos**: Crear una matriz de permisos por rol
3. **Auditoría**: Implementar logging de uso de permisos críticos
4. **UI de Gestión**: Mejorar la interfaz de asignación de permisos en `/sistemas/roles/`

---

## ⚠️ Notas Importantes

- Los permisos personalizados se crean automáticamente al ejecutar `update_permissions`
- Las migraciones solo actualizan los permisos del modelo `CustomUser`
- Para otros modelos, los permisos se actualizan vía el comando `update_permissions`
- Los permisos existentes en la base de datos se actualizarán, no se duplicarán

---

**Fecha de actualización**: 27 de Diciembre de 2025
**Versión del Sistema**: 2.6
