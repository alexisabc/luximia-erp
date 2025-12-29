# 🔐 SISTEMA DE CANCELACIONES CON AUTORIZACIÓN POS

## 📋 RESUMEN DEL REQUERIMIENTO

El usuario necesita un sistema de cancelaciones de tickets del POS que:

1. ✅ Solo usuarios supervisores/con permiso puedan autorizar cancelaciones
2. ✅ Autorización mediante código de seguridad (NO el mismo TOTP de login)
3. ✅ Registro completo de auditoría:
   - Quién autorizó la cancelación
   - Quién solicitó la cancelación (cajero)
   - Motivo de la cancelación
   - Fecha y hora

---

## 🔐 ANÁLISIS DE SEGURIDAD: TOTP vs PIN Separado

### Opción 1: Usar el mismo TOTP de login

**Pros:**
- Más fácil para el usuario
- Ya está implementado

**Contras:**
- ⚠️ **Riesgo de exposición**: Si un cajero ve el código, podría usarlo para otras cosas
- ⚠️ **No hay separación de privilegios**: Comprometer TOTP = acceso total
- ⚠️ **Trazabilidad limitada**: No distingue entre uso para login vs autorización

### Opción 2: PIN de Autorización Separado (RECOMENDADO)

**Pros:**
- ✅ **Más seguro**: PIN solo sirve para autorizaciones
- ✅ **Separación de privilegios**: Comprometer PIN ≠ acceso a cuenta
- ✅ **Más práctico en POS**: 4-6 dígitos más rápido que TOTP cambiante
- ✅ **Auditoría clara**: PIN registrado como método de autorización

**Contras:**
- Requiere configuración adicional
- PIN estático (menos seguro que TOTP dinámico)

### Opción 3: PIN Dinámico Temporal (TOTP dedicado para autorizaciones)

**Pros:**
- ✅ **Máxima seguridad**: Código cambia cada 30 segundos
- ✅ **Separación total**: TOTP de autorización ≠ TOTP de login
- ✅ **Mejor auditoría**: Dos secretos diferentes

**Contras:**
- Requiere QR adicional para configurar
- Más complejo para el usuario

---

## 🎯 RECOMENDACIÓN: Opción 3 (TOTP Dedicado para Autorizaciones)

**Razón**: Combina la seguridad del código dinámico con la separación de privilegios.

### Implementación Propuesta:

1. **Nuevo campo en Usuario**: `totp_authorization_secret`
2. **Permiso específico**: `pos.authorize_cancellation`
3. **Endpoint de verificación**: `/api/pos/verify-authorization/`
4. **Modelo de Solicitud de Cancelación**: Para flujo de aprobación

---

## 📊 DISEÑO DEL SISTEMA

### 1. Modelo de Datos (Backend)

```python
# pos/models.py

class SolicitudCancelacion(BaseModel):
    """
    Solicitud de cancelación de ticket que requiere autorización.
    """
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('EXPIRADA', 'Expirada'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='solicitudes_cancelacion')
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='cancelaciones_solicitadas')
    motivo = models.TextField(help_text="Motivo de la cancelación")
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    
    # Autorización
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='cancelaciones_autorizadas'
    )
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)
    comentarios_autorizacion = models.TextField(blank=True, null=True)
    
    # Auditoría
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    ip_solicitante = models.GenericIPAddressField(null=True, blank=True)
    ip_autorizador = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_solicitud']
        permissions = [
            ("authorize_cancellation", "Puede autorizar cancelaciones de ventas"),
        ]
```

### 2. Modificación al Usuario

```python
# users/models.py

class CustomUser(AbstractUser, BaseModel):
    # ... campos existentes ...
    
    # TOTP para autorizaciones (separado del de login)
    totp_authorization_secret = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Secreto TOTP para autorización de operaciones sensibles (separado del login)"
    )
    
    # PIN de autorización rápida (alternativa)
    authorization_pin_hash = models.CharField(
        max_length=128, 
        blank=True, 
        null=True,
        help_text="PIN hasheado para autorizaciones rápidas"
    )
```

### 3. Flujo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CANCELACIÓN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CAJERO solicita cancelación                                 │
│     └── Ingresa motivo                                          │
│     └── Se crea SolicitudCancelacion (PENDIENTE)                │
│                                                                  │
│  2. SUPERVISOR recibe notificación                              │
│     └── Revisa solicitud en panel                               │
│     └── Ingresa código TOTP de autorización                     │
│                                                                  │
│  3. SISTEMA verifica código                                     │
│     └── Si válido: Aprueba y ejecuta cancelación                │
│     └── Si inválido: Rechaza y registra intento                 │
│                                                                  │
│  4. AUDITORÍA                                                   │
│     └── Se registra quién solicitó                              │
│     └── Se registra quién autorizó                              │
│     └── Se registra fecha/hora                                  │
│     └── Se registra motivo                                      │
│     └── Se registra IP                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Endpoints API

```python
# pos/urls.py

urlpatterns = [
    # Cancelaciones
    path('cancelaciones/solicitar/', views.SolicitarCancelacionView.as_view()),
    path('cancelaciones/pendientes/', views.CancelacionesPendientesView.as_view()),
    path('cancelaciones/<int:pk>/autorizar/', views.AutorizarCancelacionView.as_view()),
    path('cancelaciones/<int:pk>/rechazar/', views.RechazarCancelacionView.as_view()),
    
    # Verificación de autorización
    path('verify-authorization/', views.VerifyAuthorizationView.as_view()),
]
```

### 5. Permisos

```python
# Nuevo permiso en Meta de Venta o SolicitudCancelacion
class Meta:
    permissions = [
        ("authorize_cancellation", "Puede autorizar cancelaciones de ventas"),
        ("request_cancellation", "Puede solicitar cancelaciones de ventas"),
    ]
```

---

## 📱 INTERFAZ DE USUARIO (Frontend)

### 1. Modal de Solicitud de Cancelación (Cajero)

```jsx
// Modal que aparece cuando el cajero quiere cancelar
<ReusableModal
    isOpen={showCancelModal}
    onClose={() => setShowCancelModal(false)}
    title="Solicitar Cancelación"
>
    <div className="space-y-4">
        <div>
            <Label>Ticket</Label>
            <p className="font-mono font-bold">{venta.folio} - ${venta.total}</p>
        </div>
        
        <div>
            <Label>Motivo de Cancelación *</Label>
            <Textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Explica por qué se debe cancelar este ticket..."
                required
            />
        </div>
        
        <Button onClick={solicitarCancelacion} disabled={!motivoCancelacion}>
            Solicitar Cancelación
        </Button>
    </div>
</ReusableModal>
```

### 2. Modal de Autorización (Supervisor)

```jsx
// Modal donde el supervisor autoriza con su código
<ReusableModal
    isOpen={showAuthModal}
    onClose={() => setShowAuthModal(false)}
    title="Autorizar Cancelación"
>
    <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm">
                <strong>Ticket:</strong> {solicitud.venta_folio}
            </p>
            <p className="text-sm">
                <strong>Total:</strong> ${solicitud.venta_total}
            </p>
            <p className="text-sm">
                <strong>Solicitante:</strong> {solicitud.solicitante_nombre}
            </p>
            <p className="text-sm">
                <strong>Motivo:</strong> {solicitud.motivo}
            </p>
        </div>
        
        <div>
            <Label>Código de Autorización *</Label>
            <Input
                type="password"
                maxLength={6}
                value={codigoAutorizacion}
                onChange={(e) => setCodigoAutorizacion(e.target.value)}
                placeholder="Ingresa tu código TOTP"
                className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-1">
                Ingresa el código de tu app autenticadora
            </p>
        </div>
        
        <div className="flex gap-2">
            <Button 
                variant="destructive" 
                onClick={() => rechazarCancelacion(solicitud.id)}
            >
                Rechazar
            </Button>
            <Button 
                onClick={() => autorizarCancelacion(solicitud.id, codigoAutorizacion)}
                disabled={codigoAutorizacion.length !== 6}
            >
                Autorizar Cancelación
            </Button>
        </div>
    </div>
</ReusableModal>
```

### 3. Panel de Cancelaciones Pendientes (Supervisor)

```jsx
// Vista para supervisores
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <AlertTriangle className="text-orange-500" />
        Cancelaciones Pendientes
        <Badge variant="destructive">{pendientes.length}</Badge>
    </h2>
    
    <ReusableTable
        data={pendientes}
        columns={[
            { header: 'Ticket', accessorKey: 'venta_folio' },
            { header: 'Total', accessorKey: 'venta_total' },
            { header: 'Solicitante', accessorKey: 'solicitante_nombre' },
            { header: 'Motivo', accessorKey: 'motivo' },
            { header: 'Hace', accessorKey: 'tiempo_transcurrido' },
        ]}
        actions={{
            custom: [
                {
                    icon: CheckCircle,
                    label: 'Autorizar',
                    onClick: (row) => abrirModalAutorizacion(row),
                },
                {
                    icon: XCircle,
                    label: 'Rechazar',
                    onClick: (row) => rechazarCancelacion(row.id),
                }
            ]
        }}
    />
</div>
```

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Agregar modelo SolicitudCancelacion (Backend)
### Paso 2: Agregar campo totp_authorization_secret a Usuario (Backend)
### Paso 3: Crear endpoints de cancelación (Backend)
### Paso 4: Agregar permiso authorize_cancellation (Backend)
### Paso 5: Crear interfaz de solicitud (Frontend)
### Paso 6: Crear panel de autorizaciones (Frontend)
### Paso 7: Implementar verificación TOTP (Backend)
### Paso 8: Configurar notificaciones (opcional)

---

## 📊 AUDITORÍA Y TRAZABILIDAD

### Datos que se registran:

| Campo | Descripción |
|-------|-------------|
| `venta` | Ticket que se cancela |
| `solicitante` | Usuario que pidió la cancelación |
| `motivo` | Razón de la cancelación |
| `fecha_solicitud` | Cuándo se solicitó |
| `autorizado_por` | Supervisor que aprobó |
| `fecha_autorizacion` | Cuándo se aprobó |
| `ip_solicitante` | IP del cajero |
| `ip_autorizador` | IP del supervisor |
| `estado` | Pendiente/Aprobada/Rechazada |

---

## ✅ SIGUIENTE PASO

¿Deseas que proceda con la implementación completa?

1. **Backend**: Modelo + Endpoints + Permisos
2. **Frontend**: Modales + Panel de autorización
3. **Configuración de TOTP de autorización**

---

**Documento**: Diseño Sistema de Cancelaciones POS  
**Fecha**: 27 de Diciembre 2025  
**Versión**: 1.0  
**Estado**: Diseño Aprobado - Listo para Implementar  

---

*Documento de diseño - Sistema de Cancelaciones con Autorización*
