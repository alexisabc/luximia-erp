# Guion de Demostración - Sistema ERP ERP V2.0

## 🎯 Objetivo
Presentar las capacidades clave del Sistema ERP en 5 minutos, mostrando flujos completos de negocio y características diferenciadoras.

---

## ⏱️ Timing Total: 5 minutos

| Sección | Tiempo | Objetivo |
|---------|--------|----------|
| Intro + Dashboard | 1:00 | Impactar con IA y métricas |
| Flujo Operativo | 1:30 | Mostrar gestión de obras |
| Flujo Comercial | 1:00 | Demostrar POS offline |
| Flujo Fiscal | 1:00 | Destacar cumplimiento CFDI 4.0 |
| Cierre | 0:30 | Multi-tenancy y mobile |

---

## 📋 Preparación Previa

### Datos Requeridos
- ✅ Empresa: "Sistema ERP Desarrollos S.A. de C.V."
- ✅ 5 empleados con fotos
- ✅ 2 obras activas
- ✅ 20 productos en inventario
- ✅ 10 facturas (5 pagadas, 2 vencidas)

### Ejecutar Antes de la Demo
```bash
# 1. Levantar servicios
podman-compose up -d

# 2. Cargar datos de demostración
podman exec sistemaerp-backend python scripts/seed_demo_data.py

# 3. Verificar que todo funciona
curl http://localhost:8000/health/
curl http://localhost:3000/

# 4. Abrir pestañas del navegador
# - Tab 1: http://localhost:3000 (Login)
# - Tab 2: http://localhost:3000/dashboard (Dashboard)
# - Tab 3: http://localhost:3000/pos (POS)
```

---

## 🎬 SECCIÓN 1: Intro + Dashboard IA (1:00)

### Script
> "Buenos días. Les presento **Sistema ERP ERP V2.0**, un sistema integral de gestión empresarial diseñado específicamente para el sector inmobiliario y construcción en México."

### Acciones
1. **Login** (5 segundos)
   - Usuario: `admin@sistemaerp.com`
   - Contraseña: `admin123`
   - Mostrar opción de Passkey (WebAuthn)

2. **Dashboard Ejecutivo** (25 segundos)
   - Destacar **IA Morning Briefing**:
     > "El sistema me saluda con un resumen inteligente del día"
   - Mostrar cards de métricas:
     - Cuentas por Cobrar: $2.5M
     - Cuentas por Pagar: $850K
     - Obras Activas: 2
     - Empleados: 5
   - Señalar facturas vencidas en rojo

3. **Búsqueda Semántica con IA** (30 segundos)
   - Abrir buscador (Cmd/Ctrl + K)
   - Buscar: "facturas pendientes de pago"
   - Mostrar resultados filtrados por permisos
   - Destacar:
     > "La IA indexa 15 modelos del sistema y filtra automáticamente según mis permisos"

---

## 🎬 SECCIÓN 2: Flujo Operativo - Gestión de Obras (1:30)

### Script
> "Vamos a crear una nueva obra y ver cómo fluye la información en tiempo real"

### Acciones
1. **Crear Obra** (30 segundos)
   - Ir a: Contabilidad → Proyectos
   - Click en "Nueva Obra"
   - Llenar formulario:
     - Nombre: "Torre Shark Tower"
     - Ubicación: "Monterrey, N.L."
     - Presupuesto: $15,000,000
   - Guardar
   - Destacar:
     > "Atomic Design: componentes reutilizables y Mobile First"

2. **Crear Requisición** (30 segundos)
   - Ir a: Compras → Requisiciones
   - Nueva Requisición
   - Seleccionar obra: "Torre Shark Tower"
   - Agregar productos:
     - Cemento Gris 50kg x 100 unidades
     - Varilla 3/8" x 50 unidades
   - Enviar a autorización
   - Mostrar flujo de estados: Borrador → Pendiente → Autorizado

3. **Mesa de Control** (30 segundos)
   - Ir a: Dashboard → Mesa de Control
   - Mostrar vista Kanban de requisiciones
   - Arrastrar tarjeta a "Autorizado"
   - Destacar:
     > "Optimistic UI: la interfaz responde instantáneamente mientras se sincroniza en background"

---

## 🎬 SECCIÓN 3: Flujo Comercial - POS Offline (1:00)

### Script
> "Ahora vamos al Punto de Venta, que funciona incluso sin conexión a internet"

### Acciones
1. **Abrir POS** (10 segundos)
   - Ir a: POS → Terminal
   - Mostrar interfaz táctil optimizada

2. **Crear Venta** (30 segundos)
   - Buscar producto: "Martillo"
   - Agregar al carrito
   - Buscar: "Pintura"
   - Agregar 2 unidades
   - Mostrar total calculado automáticamente
   - Destacar:
     > "Interfaz diseñada para tablets y uso con touch"

3. **Procesar Pago** (20 segundos)
   - Seleccionar método: Efectivo
   - Ingresar monto recibido: $500
   - Calcular cambio automáticamente
   - Finalizar venta
   - Mostrar ticket generado
   - Destacar:
     > "El sistema funciona offline y sincroniza cuando recupera conexión"

---

## 🎬 SECCIÓN 4: Flujo Fiscal - CFDI 4.0 (1:00)

### Script
> "México tiene uno de los sistemas fiscales más complejos del mundo. Nuestro ERP lo hace simple."

### Acciones
1. **Generar Factura** (30 segundos)
   - Ir a: Contabilidad → Facturación
   - Seleccionar venta del POS
   - Click en "Generar CFDI"
   - Mostrar formulario pre-llenado:
     - RFC del cliente
     - Uso de CFDI: G03 (Gastos en general)
     - Método de pago: PUE (Pago en una sola exhibición)
   - Generar factura

2. **Visualizar CFDI** (20 segundos)
   - Mostrar PDF generado con:
     - QR Code del SAT
     - Sello digital
     - Cadena original
   - Destacar:
     > "Cumplimiento total con CFDI 4.0 y generación de complementos de pago (REP)"

3. **Timbrado** (10 segundos)
   - Mostrar estado: "Timbrado exitosamente"
   - UUID visible
   - Destacar:
     > "Integración con PAC certificado para timbrado automático"

---

## 🎬 SECCIÓN 5: Cierre - Multi-tenant + Mobile (0:30)

### Script
> "Finalmente, dos características clave para empresas en crecimiento"

### Acciones
1. **Multi-tenancy** (15 segundos)
   - Click en selector de empresa (esquina superior)
   - Mostrar lista de empresas disponibles
   - Cambiar a otra empresa
   - Destacar:
     > "Una sola instalación, múltiples empresas completamente aisladas"

2. **Vista Móvil** (15 segundos)
   - Abrir DevTools (F12)
   - Cambiar a vista móvil (iPhone 14 Pro)
   - Navegar por dashboard
   - Destacar:
     > "Mobile First: diseñado primero para móviles, optimizado para todos los dispositivos"

---

## 🎯 Mensaje de Cierre

> "**Sistema ERP ERP V2.0** combina lo mejor de la tecnología moderna:
> - 🤖 Inteligencia Artificial integrada
> - 🛡️ Seguridad con Podman Rootless
> - 📱 Mobile First con Atomic Design
> - 🇲🇽 Cumplimiento fiscal CFDI 4.0
> - ☁️ Cloud-native y escalable
> 
> Todo en un sistema diseñado específicamente para empresas mexicanas."

---

## 📊 Puntos Clave a Destacar

### Técnicos
- ✅ Arquitectura Podman Rootless (sin daemon privilegiado)
- ✅ HTTPS automático con Caddy
- ✅ CI/CD con GitHub Actions
- ✅ Atomic Design + Mobile First
- ✅ Optimistic UI para mejor UX

### Funcionales
- ✅ Multi-tenancy (múltiples empresas)
- ✅ IA con búsqueda semántica
- ✅ POS offline-first
- ✅ CFDI 4.0 compliant
- ✅ Flujos de autorización multinivel

### Seguridad
- ✅ Passkeys (WebAuthn)
- ✅ 2FA/TOTP
- ✅ Audit trail completo
- ✅ Permisos granulares (401 permisos)

---

## 🎥 Tips para la Grabación

### Preparación
1. Cerrar todas las aplicaciones innecesarias
2. Desactivar notificaciones
3. Usar modo "No molestar"
4. Verificar que el audio funciona
5. Tener agua cerca (hablarás 5 minutos seguidos)

### Durante la Grabación
1. Hablar con energía pero sin apresurarse
2. Pausar 2 segundos entre secciones
3. Usar el mouse/cursor para señalar elementos importantes
4. Si te equivocas, pausar y reiniciar esa sección

### Post-Producción
1. Agregar música de fondo suave
2. Agregar títulos en cada sección
3. Destacar con zoom los elementos clave
4. Agregar transiciones suaves entre secciones

---

## 📝 Checklist Pre-Demo

- [ ] Servicios levantados (`podman-compose up -d`)
- [ ] Datos de demo cargados (`seed_demo_data.py`)
- [ ] Navegador en pantalla completa
- [ ] DevTools cerrado (abrir solo en sección mobile)
- [ ] Pestañas preparadas
- [ ] Audio funcionando
- [ ] Notificaciones desactivadas
- [ ] Script impreso o en segunda pantalla

---

## 🎬 ¡Acción!

**Duración objetivo**: 5:00 minutos
**Tono**: Profesional pero entusiasta
**Objetivo**: Impresionar con tecnología + resolver problemas reales

¡Éxito en tu demostración! 🚀
