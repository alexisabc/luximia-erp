import apiClient from './core';
import { db, saveOfflineSale, getPendingSales, markSaleSynced } from './db';

// ===================== POS / Productos =====================
/**
 * Obtiene productos. Si hay red, actualiza caché local. Si no, usa caché.
 */
export const getProductosPOS = async (search = '') => {
    try {
        const response = await apiClient.get('/pos/productos/', { params: { search } });
        // Actualizar caché local (bulkPut es más eficiente)
        if (response.data && Array.isArray(response.data)) {
            await db.products.bulkPut(response.data);
        } else if (response.data.results) {
            // Django Pagination support
            await db.products.bulkPut(response.data.results);
        }
        return response;
    } catch (error) {
        console.warn('Network error, fetching from local DB', error);
        // Fallback a Dexie
        let collection = db.products.orderBy('nombre');
        if (search) {
            const searchLower = search.toLowerCase();
            collection = db.products.filter(p => p.nombre.toLowerCase().includes(searchLower) || p.codigo_barras.includes(search));
        }
        const offlineData = await collection.toArray();
        return { data: offlineData, isOffline: true };
    }
};

// ===================== POS / Turnos (Caja) =====================
export const getTurnoActivo = async () => {
    try {
        const response = await apiClient.get('/pos/turnos/', { params: { cerrado: false, limit: 1 } });
        const turno = response.data.results?.[0] || null;
        if (turno) {
            await db.turnos.put({ id: 'active_turn', ...turno });
        }
        return turno;
    } catch (error) {
        console.warn('Network error, fetching active turn from local DB', error);
        return await db.turnos.get('active_turn');
    }
};

export const abrirTurno = async (cajaId, saldoInicial) => {
    const response = await apiClient.post('/pos/turnos/abrir/', { caja: cajaId, saldo_inicial: saldoInicial });
    if (response.data) await db.turnos.put({ id: 'active_turn', ...response.data });
    return response;
};

export const cerrarTurno = async (turnoId, saldoDeclarado) => {
    const response = await apiClient.post(`/pos/turnos/${turnoId}/cerrar/`, { saldo_declarado: saldoDeclarado });
    await db.turnos.delete('active_turn');
    return response;
};

export const getCajas = () => apiClient.get('/pos/cajas/');

// ===================== POS / Ventas & Sincronización =====================

/**
 * Intenta enviar venta al API. Si falla, guarda en cola offline.
 */
export const createVenta = async (data) => {
    if (navigator.onLine) {
        try {
            const response = await apiClient.post('/pos/ventas/', data);
            // Si funciona, intentamos sincronizar cola pendiente en segundo plano
            syncPendingSales();
            return response;
        } catch (error) {
            console.warn('Online sale failed, saving to offline queue', error);
            await saveOfflineSale(data);
            return { data: { id: 'offline-' + Date.now(), offline: true }, isOffline: true }; // Mock response
        }
    } else {
        console.log('Offline mode detected, saving to queue');
        await saveOfflineSale(data);
        return { data: { id: 'offline-' + Date.now(), offline: true }, isOffline: true };
    }
};

/**
 * Sincroniza ventas pendientes una por una
 */
export const syncPendingSales = async () => {
    if (!navigator.onLine) return;

    const pending = await getPendingSales();
    if (pending.length === 0) return;

    console.log(`Syncing ${pending.length} pending sales...`);

    for (const sale of pending) {
        try {
            await apiClient.post('/pos/ventas/', sale.payload);
            await markSaleSynced(sale.id);
            // Opcional: Eliminar de DB local para no llenarla
            await db.ventas.delete(sale.id);
            console.log(`Sale ${sale.id} synced successfully`);
        } catch (error) {
            console.error(`Failed to sync sale ${sale.id}`, error);
            // No borramos, se reintentará luego
        }
    }
};


export const cancelarVenta = (ventaId, authData) => apiClient.post(`/pos/ventas/${ventaId}/cancelar/`, authData);
export const getVentas = (page = 1, pageSize = 20, filters = {}) => apiClient.get('/pos/ventas/', { params: { page, page_size: pageSize, ...filters } });

// ===================== POS / Clientes (Cuentas) =====================
export const getCuentaCliente = (clienteId) => apiClient.get('/pos/cuentas/', { params: { cliente: clienteId } });
export const getCuentasClientes = (page = 1, pageSize = 20, search = '') => apiClient.get('/pos/cuentas/', { params: { page, page_size: pageSize, search } });
export const abonarCuenta = (data) => apiClient.post('/pos/cuentas/abonar/', data);

// ===================== POS / CRUD Generico (Admin) =====================
export const createProducto = (data) => apiClient.post('/pos/productos/', data);
export const updateProducto = (id, data) => apiClient.put(`/pos/productos/${id}/`, data);
export const deleteProducto = (id) => apiClient.delete(`/pos/productos/${id}/`);

export const createCaja = (data) => apiClient.post('/pos/cajas/', data);
export const updateCaja = (id, data) => apiClient.put(`/pos/cajas/${id}/`, data);
export const deleteCaja = (id) => apiClient.delete(`/pos/cajas/${id}/`);

export const getTurnos = (page = 1, pageSize = 20, filters = {}) => apiClient.get('/pos/turnos/', { params: { page, page_size: pageSize, ...filters } });
export const getTurnoDetalle = (id) => apiClient.get(`/pos/turnos/${id}/`);

