# Implementación Multi-Empresa - Sistema ERP

## Objetivo
Implementar lógica multi-empresa para manejar 5 razones sociales diferentes, permitiendo:
- Segregación de datos por empresa
- Usuarios con acceso a una o múltiples empresas
- Reportes consolidados o por empresa
- Facturación con diferentes RFC/razones sociales

## Arquitectura Propuesta

### 1. Modelo Core: Empresa
```python
# core/models.py
class Empresa(SoftDeleteModel):
    """
    Representa cada razón social del grupo.
    """
    codigo = models.CharField(max_length=10, unique=True)  # LUX01, LUX02, etc.
    razon_social = models.CharField(max_length=200)
    nombre_comercial = models.CharField(max_length=100)
    rfc = models.CharField(max_length=13, unique=True)
    
    # Datos fiscales
    regimen_fiscal = models.CharField(max_length=10)
    codigo_postal = models.CharField(max_length=5)
    
    # Dirección
    calle = models.CharField(max_length=200)
    numero_exterior = models.CharField(max_length=20)
    numero_interior = models.CharField(max_length=20, blank=True)
    colonia = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    estado = models.CharField(max_length=100)
    
    # Configuración
    logo = models.ImageField(upload_to='empresas/logos/', blank=True, null=True)
    activa = models.BooleanField(default=True)
    
    # Contacto
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    class Meta:
        ordering = ['codigo']
        verbose_name_plural = 'Empresas'
```

### 2. Relación Usuario-Empresa
```python
# users/models.py - Agregar a User
class User(AbstractUser):
    # ... campos existentes ...
    
    # Multi-empresa
    empresa_principal = models.ForeignKey(
        'core.Empresa', 
        on_delete=models.PROTECT,
        related_name='usuarios_principales',
        null=True,
        help_text="Empresa por defecto al iniciar sesión"
    )
    empresas_acceso = models.ManyToManyField(
        'core.Empresa',
        related_name='usuarios_con_acceso',
        blank=True,
        help_text="Empresas a las que tiene acceso"
    )
    
    # Empresa activa en sesión (se guarda en sesión, no en DB)
    @property
    def empresa_actual(self):
        # Se obtiene de request.session['empresa_id']
        pass
```

### 3. Middleware para Empresa Activa
```python
# core/middleware.py
class EmpresaMiddleware:
    """
    Middleware que asegura que cada request tenga una empresa activa.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Si no hay empresa en sesión, usar la principal
            if 'empresa_id' not in request.session:
                if request.user.empresa_principal:
                    request.session['empresa_id'] = request.user.empresa_principal.id
                else:
                    # Asignar primera empresa con acceso
                    primera = request.user.empresas_acceso.first()
                    if primera:
                        request.session['empresa_id'] = primera.id
            
            # Cargar empresa actual en request
            if 'empresa_id' in request.session:
                try:
                    request.empresa = Empresa.objects.get(
                        id=request.session['empresa_id'],
                        activa=True
                    )
                except Empresa.DoesNotExist:
                    request.empresa = None
            else:
                request.empresa = None
        
        response = self.get_response(request)
        return response
```

### 4. Modificar Modelos Existentes

Agregar campo `empresa` a todos los modelos transaccionales:

#### Contabilidad
```python
# contabilidad/models.py
class Proyecto(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...

class Cliente(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...

class Contrato(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...
```

#### POS
```python
# pos/models.py
class Caja(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...

class Turno(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...

class Venta(SoftDeleteModel):
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT)
    # ... resto de campos ...
```

### 5. Filtrado Automático en Vistas

#### Opción A: Mixin para ViewSets
```python
# core/mixins.py
class EmpresaFilterMixin:
    """
    Filtra automáticamente por empresa actual del usuario.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request, 'empresa') and self.request.empresa:
            queryset = queryset.filter(empresa=self.request.empresa)
        return queryset
    
    def perform_create(self, serializer):
        # Asignar empresa automáticamente al crear
        serializer.save(empresa=self.request.empresa)

# Uso en ViewSets
class ProyectoViewSet(EmpresaFilterMixin, viewsets.ModelViewSet):
    queryset = Proyecto.objects.all()
    serializer_class = ProyectoSerializer
```

#### Opción B: Manager Personalizado
```python
# core/managers.py
class EmpresaManager(models.Manager):
    def get_queryset(self):
        # Esto requiere thread-local storage para request
        return super().get_queryset()
    
    def para_empresa(self, empresa):
        return self.get_queryset().filter(empresa=empresa)
```

### 6. Frontend - Selector de Empresa

```javascript
// components/layout/EmpresaSelector.jsx
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { cambiarEmpresa, getEmpresasUsuario } from '@/services/core';
import { toast } from 'sonner';

export default function EmpresaSelector() {
    const [empresas, setEmpresas] = useState([]);
    const [empresaActual, setEmpresaActual] = useState(null);

    useEffect(() => {
        loadEmpresas();
    }, []);

    const loadEmpresas = async () => {
        try {
            const { data } = await getEmpresasUsuario();
            setEmpresas(data.empresas);
            setEmpresaActual(data.empresa_actual);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = async (empresaId) => {
        try {
            await cambiarEmpresa(empresaId);
            toast.success('Empresa cambiada');
            window.location.reload(); // Recargar para aplicar filtros
        } catch (error) {
            toast.error('Error al cambiar empresa');
        }
    };

    if (empresas.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-500" />
            <Select value={empresaActual?.id?.toString()} onValueChange={handleChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                    {empresas.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.nombre_comercial}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
```

### 7. Migraciones

```bash
# Crear modelo Empresa
python manage.py makemigrations core

# Crear datos iniciales (5 empresas)
python manage.py shell
>>> from core.models import Empresa
>>> Empresa.objects.create(
...     codigo='LUX01',
...     razon_social='LUXIMIA SA DE CV',
...     nombre_comercial='Sistema ERP',
...     rfc='LUX010101XXX'
... )
# ... crear las otras 4

# Agregar campo empresa a modelos existentes
python manage.py makemigrations

# Migrar datos existentes a empresa por defecto
python manage.py shell
>>> from core.models import Empresa
>>> from contabilidad.models import Proyecto
>>> empresa_default = Empresa.objects.first()
>>> Proyecto.objects.update(empresa=empresa_default)

# Aplicar migraciones
python manage.py migrate
```

## Consideraciones Importantes

### 1. Datos Compartidos vs Segregados

**Compartidos entre empresas:**
- Usuarios
- Catálogos base (países, estados, etc.)
- Configuraciones del sistema

**Segregados por empresa:**
- Clientes
- Proyectos
- Ventas
- Facturas
- Inventarios
- Cuentas bancarias

### 2. Reportes Consolidados

Para reportes que abarquen múltiples empresas:
```python
# Permitir filtro opcional
def get_queryset(self):
    qs = super().get_queryset()
    
    # Si usuario tiene permiso de consolidado
    if self.request.user.has_perm('core.view_consolidado'):
        empresas_ids = self.request.GET.getlist('empresas')
        if empresas_ids:
            qs = qs.filter(empresa_id__in=empresas_ids)
    else:
        # Filtrar solo empresa actual
        qs = qs.filter(empresa=self.request.empresa)
    
    return qs
```

### 3. Permisos por Empresa

Considerar permisos granulares:
```python
# users/models.py
class PermisoEmpresa(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    empresa = models.ForeignKey('core.Empresa', on_delete=models.CASCADE)
    rol = models.CharField(max_length=50)  # admin, vendedor, contador, etc.
    
    class Meta:
        unique_together = ['usuario', 'empresa']
```

## Orden de Implementación

1. ✅ Crear modelo Empresa
2. ✅ Agregar relaciones en User
3. ✅ Crear middleware
4. ✅ Modificar modelos existentes (agregar campo empresa)
5. ✅ Crear migraciones de datos
6. ✅ Implementar mixin de filtrado
7. ✅ Actualizar serializers
8. ✅ Crear selector de empresa en frontend
9. ✅ Agregar a Sidebar
10. ✅ Probar flujos completos

## Próximos Pasos

¿Quieres que comience con la implementación? Sugiero empezar por:
1. Crear el modelo Empresa
2. Configurar las 5 razones sociales
3. Agregar el middleware
4. Modificar un módulo como prueba (ej: POS)
