import apiClient from './core';

// ============================================================================
// CUENTAS BANCARIAS
// ============================================================================

export const getCuentasBancarias = (params = {}) => {
    return apiClient.get('/tesoreria/cuentas-bancarias/', { params });
};

export const getCuentaBancaria = (id) => {
    return apiClient.get(`/tesoreria/cuentas-bancarias/${id}/`);
};

export const createCuentaBancaria = (data) => {
    return apiClient.post('/tesoreria/cuentas-bancarias/', data);
};

export const updateCuentaBancaria = (id, data) => {
    return apiClient.patch(`/tesoreria/cuentas-bancarias/${id}/`, data);
};

export const deleteCuentaBancaria = (id) => {
    return apiClient.delete(`/tesoreria/cuentas-bancarias/${id}/`);
};

export const conciliarCuenta = (id, saldoBancario) => {
    return apiClient.post(`/tesoreria/cuentas-bancarias/${id}/conciliar/`, {
        saldo_bancario: saldoBancario
    });
};

// ============================================================================
// EGRESOS
// ============================================================================

export const getEgresos = (params = {}) => {
    return apiClient.get('/tesoreria/egresos/', { params });
};

export const getEgreso = (id) => {
    return apiClient.get(`/tesoreria/egresos/${id}/`);
};

export const createEgreso = (data) => {
    return apiClient.post('/tesoreria/egresos/', data);
};

export const updateEgreso = (id, data) => {
    return apiClient.patch(`/tesoreria/egresos/${id}/`, data);
};

export const deleteEgreso = (id) => {
    return apiClient.delete(`/tesoreria/egresos/${id}/`);
};

export const autorizarEgreso = (id) => {
    return apiClient.post(`/tesoreria/egresos/${id}/autorizar/`);
};

export const pagarEgreso = (id) => {
    return apiClient.post(`/tesoreria/egresos/${id}/pagar/`);
};

export const cancelarEgreso = (id) => {
    return apiClient.post(`/tesoreria/egresos/${id}/cancelar/`);
};

// ============================================================================
// CAJAS CHICAS
// ============================================================================

export const getCajasChicas = (params = {}) => {
    return apiClient.get('/tesoreria/cajas-chicas/', { params });
};

export const getCajaChica = (id) => {
    return apiClient.get(`/tesoreria/cajas-chicas/${id}/`);
};

export const createCajaChica = (data) => {
    return apiClient.post('/tesoreria/cajas-chicas/', data);
};

export const updateCajaChica = (id, data) => {
    return apiClient.patch(`/tesoreria/cajas-chicas/${id}/`, data);
};

export const deleteCajaChica = (id) => {
    return apiClient.delete(`/tesoreria/cajas-chicas/${id}/`);
};

export const cerrarCaja = (id) => {
    return apiClient.post(`/tesoreria/cajas-chicas/${id}/cerrar/`);
};

export const reembolsarCaja = (id) => {
    return apiClient.post(`/tesoreria/cajas-chicas/${id}/reembolsar/`);
};

// ============================================================================
// MOVIMIENTOS DE CAJA
// ============================================================================

export const getMovimientosCaja = (params = {}) => {
    return apiClient.get('/tesoreria/movimientos-caja/', { params });
};

export const createMovimientoCaja = (data) => {
    return apiClient.post('/tesoreria/movimientos-caja/', data);
};

// ============================================================================
// CONTRARECIBOS
// ============================================================================

export const getContraRecibos = (params = {}) => {
    return apiClient.get('/tesoreria/contrarecibos/', { params });
};

export const getContraRecibo = (id) => {
    return apiClient.get(`/tesoreria/contrarecibos/${id}/`);
};

export const createContraRecibo = (data) => {
    return apiClient.post('/tesoreria/contrarecibos/', data);
};

export const validarContraRecibo = (id) => {
    return apiClient.post(`/tesoreria/contrarecibos/${id}/validar/`);
};

// ============================================================================
// PROGRAMACIONES DE PAGO
// ============================================================================

export const getProgramacionesPago = (params = {}) => {
    return apiClient.get('/tesoreria/programaciones-pago/', { params });
};

export const createProgramacionPago = (data) => {
    return apiClient.post('/tesoreria/programaciones-pago/', data);
};

export const autorizarProgramacion = (id) => {
    return apiClient.post(`/tesoreria/programaciones-pago/${id}/autorizar/`);
};

export const generarLayoutPago = (id) => {
    return apiClient.post(`/tesoreria/programaciones-pago/${id}/generar_layout/`);
};
