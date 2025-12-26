import apiClient from './core';

// ===================== Proyectos y Clientes (CxC) =====================
export const getProyectos = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/proyectos/', { params: { page, page_size: pageSize, ...filters } });
export const createProyecto = (data) => apiClient.post('/contabilidad/proyectos/', data);
export const updateProyecto = (id, data) => apiClient.patch(`/contabilidad/proyectos/${id}/`, data);
export const deleteProyecto = (id) => apiClient.delete(`/contabilidad/proyectos/${id}/`);
export const getInactiveProyectos = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/proyectos/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const hardDeleteProyecto = (id) => apiClient.delete(`/contabilidad/proyectos/${id}/hard/`);
export const exportProyectosExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/proyectos/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarProyectos = (formData) => apiClient.post('/contabilidad/proyectos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAllProyectos = () => apiClient.get('/contabilidad/proyectos/?page_size=1000');

export const getClientes = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/clientes/', { params: { page, page_size: pageSize, ...filters } });
export const createCliente = (data) => apiClient.post('/contabilidad/clientes/', data);
export const updateCliente = (id, data) => apiClient.patch(`/contabilidad/clientes/${id}/`, data);
export const deleteCliente = (id) => apiClient.delete(`/contabilidad/clientes/${id}/`);
export const getInactiveClientes = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/clientes/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const hardDeleteCliente = (id) => apiClient.delete(`/contabilidad/clientes/${id}/hard/`);
export const exportClientesExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/clientes/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarClientes = (formData) => apiClient.post('/contabilidad/clientes/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== UPEs =====================
export const getUPEs = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/upes/', { params: { page, page_size: pageSize, ...filters } });
export const createUPE = (data) => apiClient.post('/contabilidad/upes/', data);
export const updateUPE = (id, data) => apiClient.patch(`/contabilidad/upes/${id}/`, data);
export const deleteUPE = (id) => apiClient.delete(`/contabilidad/upes/${id}/`);
export const getInactiveUpes = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/upes/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const hardDeleteUpe = (id) => apiClient.delete(`/contabilidad/upes/${id}/hard/`);
export const exportUpesExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/upes/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarUPEs = (formData) => apiClient.post('/contabilidad/upes/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Presupuestos & Contratos =====================
export const getPresupuestos = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/presupuestos/', { params: { page, page_size: pageSize, ...filters } });
export const createPresupuesto = (data) => apiClient.post('/contabilidad/presupuestos/', data);
export const updatePresupuesto = (id, data) => apiClient.patch(`/contabilidad/presupuestos/${id}/`, data);
export const getPresupuesto = (id) => apiClient.get(`/contabilidad/presupuestos/${id}/`);
export const exportPresupuestosExcel = (columns) => apiClient.post('/contabilidad/presupuestos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarPresupuestos = (formData) => apiClient.post('/contabilidad/presupuestos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getContratos = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/contratos/', { params: { page, page_size: pageSize, ...filters } });
export const getContratoById = (id) => apiClient.get(`/contabilidad/contratos/${id}/`);
export const descargarEstadoDeCuentaPDF = (contratoId, columns) =>
    apiClient.post(`/contabilidad/contratos/${contratoId}/descargar-pdf/`, { columns }, { responseType: 'blob' });
export const descargarEstadoDeCuentaExcel = (contratoId, planCols, pagoCols) =>
    apiClient.post(`/contabilidad/contratos/${contratoId}/descargar-excel/`, { plan_cols: planCols, pago_cols: pagoCols }, { responseType: 'blob' });
export const exportContratosExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/contratos/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarContratos = (formData) =>
    apiClient.post('/contabilidad/contratos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Bancos, Monedas, Pagos =====================
export const getBancos = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/bancos/', { params: { page, page_size: pageSize, ...filters } });
export const createBanco = (data) => apiClient.post('/contabilidad/bancos/', data);
export const updateBanco = (id, data) => apiClient.patch(`/contabilidad/bancos/${id}/`, data);
export const deleteBanco = (id) => apiClient.delete(`/contabilidad/bancos/${id}/`);
export const getInactiveBancos = (page = 1, pageSize = 15) => apiClient.get('/contabilidad/bancos/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteBanco = (id) => apiClient.delete(`/contabilidad/bancos/${id}/hard/`);
export const exportBancosExcel = (columns) => apiClient.post('/contabilidad/bancos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarBancos = (formData) => apiClient.post('/contabilidad/bancos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getMonedas = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/monedas/', { params: { page, page_size: pageSize, ...filters } });
export const createMoneda = (data) => apiClient.post('/contabilidad/monedas/', data);
export const updateMoneda = (id, data) => apiClient.patch(`/contabilidad/monedas/${id}/`, data);
export const deleteMoneda = (id) => apiClient.delete(`/contabilidad/monedas/${id}/`);
export const getInactiveMonedas = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/monedas/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const hardDeleteMoneda = (id) => apiClient.delete(`/contabilidad/monedas/${id}/hard/`);
export const exportMonedasExcel = (columns) => apiClient.post('/contabilidad/monedas/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarMonedas = (formData) => apiClient.post('/contabilidad/monedas/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getPagos = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/pagos/', { params: { page, page_size: pageSize, ...filters } });
export const createPago = (data) => apiClient.post('/contabilidad/pagos/', data);
export const updatePago = (id, data) => apiClient.patch(`/contabilidad/pagos/${id}/`, data);
export const deletePago = (id) => apiClient.delete(`/contabilidad/pagos/${id}/`);
export const exportPagosExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/pagos/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarPagosHistoricos = (formData) =>
    apiClient.post('/contabilidad/pagos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getPlanesPago = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/planes-pago/', { params: { page, page_size: pageSize, ...filters } });
export const createPlanPago = (data) => apiClient.post('/contabilidad/planes-pago/', data);
export const exportPlanesPagoExcel = (columns, filters = {}) =>
    apiClient.post('/contabilidad/planes-pago/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarPlanesPago = (formData) =>
    apiClient.post('/contabilidad/planes-pago/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getMetodosPago = () => apiClient.get('/contabilidad/metodos-pago/');

export const getFormasPago = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/formas-pago/', { params: { page, page_size: pageSize, ...filters } });
export const createFormaPago = (data) => apiClient.post('/contabilidad/formas-pago/', data);
export const updateFormaPago = (id, data) => apiClient.patch(`/contabilidad/formas-pago/${id}/`, data);
export const deleteFormaPago = (id) => apiClient.delete(`/contabilidad/formas-pago/${id}/`);
export const getInactiveFormasPago = (page = 1, pageSize = 15) => apiClient.get('/contabilidad/formas-pago/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteFormaPago = (id) => apiClient.delete(`/contabilidad/formas-pago/${id}/hard/`);
export const exportFormasPagoExcel = (columns) => apiClient.post('/contabilidad/formas-pago/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarFormasPago = (formData) => apiClient.post('/contabilidad/formas-pago/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Tipos de Cambio =====================
export const getTiposCambio = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/tipos-cambio-manual/', { params: { page, page_size: pageSize, ...filters } });
export const createTipoCambio = (data) => apiClient.post('/contabilidad/tipos-cambio-manual/', data);
export const updateTipoCambio = (id, data) => apiClient.patch(`/contabilidad/tipos-cambio-manual/${id}/`, data);
export const deleteTipoCambio = (id) => apiClient.delete(`/contabilidad/tipos-cambio-manual/${id}/`);
export const exportTiposCambioExcel = (columns) => apiClient.post('/contabilidad/tipos-cambio-manual/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarTiposCambio = (formData) => apiClient.post('/contabilidad/tipos-cambio-manual/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getTiposDeCambio = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/tipos-cambio-banxico/', { params: { page, page_size: pageSize, ...filters } });
export const actualizarTipoDeCambioHoy = () => apiClient.post('/contabilidad/tipos-cambio-banxico/actualizar/');

// ===================== Dashboard y Varios =====================
export const importarDatosMasivos = (formData) => apiClient.post('/contabilidad/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getStrategicDashboardData = (timeframe, selectedProjects, morosidadRange, porCobrarRange) => {
    const projects = selectedProjects === 'all' ? 'all' : Array.isArray(selectedProjects) ? selectedProjects.join(',') : String(selectedProjects);
    return apiClient.get('/contabilidad/dashboard/strategic/', { params: { timeframe, projects, morosidad: morosidadRange, por_cobrar: porCobrarRange } });
};

export const consultaInteligente = (consulta, extra = {}) =>
    apiClient.post('/ia/chat/', { consulta, ...extra });
