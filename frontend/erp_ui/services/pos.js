import apiClient from './core';

// ===================== POS / Productos =====================
export const getProductosPOS = (search = '') => apiClient.get('/pos/productos/', { params: { search } });

// ===================== POS / Turnos (Caja) =====================
/**
 * Obtiene el turno activo del usuario actual (si existe)
 * Filtra por cerrado=False
 */
export const getTurnoActivo = async () => {
    const response = await apiClient.get('/pos/turnos/', { params: { cerrado: false, limit: 1 } });
    // Asumimos que el backend ordena por fecha desc, el primero debería ser el activo
    return response.data.results?.[0] || null;
};

export const abrirTurno = (cajaId, saldoInicial) => apiClient.post('/pos/turnos/abrir/', { caja: cajaId, saldo_inicial: saldoInicial });
export const cerrarTurno = (turnoId, saldoDeclarado) => apiClient.post(`/pos/turnos/${turnoId}/cerrar/`, { saldo_declarado: saldoDeclarado });

export const getCajas = () => apiClient.get('/pos/cajas/');

// ===================== POS / Ventas =====================
export const createVenta = (data) => apiClient.post('/pos/ventas/', data);
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
