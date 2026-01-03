# 🔧 Solución Rápida - Error de Build Docker

**Problema:** Build de Docker falla por falta de `react-hot-toast`

**Error:**
```
Module not found: Can't resolve 'react-hot-toast'
```

**Solución:**

```bash
cd frontend/erp_ui

# Instalar react-hot-toast
npm install react-hot-toast

# Reconstruir Docker
cd ../..
dcb
dcup -d
```

**Archivos afectados:**
- app/tesoreria/page.jsx
- app/compras/inventario/page.jsx
- app/compras/ordenes/[id]/page.jsx
- app/page.jsx
- app/sistemas/roles/page.jsx
- app/sistemas/usuarios/page.jsx
- app/pos/page.jsx

**Alternativa (Recomendada para el futuro):**
Migrar de `react-hot-toast` a `sonner` (ya instalado):

```javascript
// Antes
import toast from 'react-hot-toast';
toast.success('Mensaje');

// Después
import { toast } from 'sonner';
toast.success('Mensaje');
```
