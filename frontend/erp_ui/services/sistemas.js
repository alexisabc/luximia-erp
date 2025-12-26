import apiClient from './core';

// ===================== SISTEMAS / INVENTARIO =====================

// Activos (Laptops, Monitores)
export const getActivosIT = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/sistemas/activos/', { params: { page, page_size: pageSize, ...filters } });
export const getActivoIT = (id) => apiClient.get(`/sistemas/activos/${id}/`);
export const createActivoIT = (data) => apiClient.post('/sistemas/activos/', data);
export const updateActivoIT = (id, data) => apiClient.patch(`/sistemas/activos/${id}/`, data);
export const deleteActivoIT = (id) => apiClient.delete(`/sistemas/activos/${id}/`);
export const getActivosDisponibles = (modeloId) => apiClient.get('/sistemas/activos/disponibles/', { params: { modelo: modeloId } });
export const getInactiveActivosIT = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/sistemas/activos/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const hardDeleteActivoIT = (id) => apiClient.delete(`/sistemas/activos/${id}/hard/`);
export const exportActivosITExcel = (columns, filters = {}) => apiClient.post('/sistemas/activos/exportar-excel/', { columns }, { params: filters, responseType: 'blob' });
export const importarActivosIT = (formData) => apiClient.post('/sistemas/activos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Modelos y Categorías
export const getModelosEquipo = (search = '') => apiClient.get('/sistemas/modelos/', { params: { search } });
export const createModeloEquipo = (data) => apiClient.post('/sistemas/modelos/', data);
export const getCategoriasEquipo = () => apiClient.get('/sistemas/categorias/');

// Asignaciones (Responsivas)
export const getAsignaciones = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/sistemas/asignaciones/', { params: { page, page_size: pageSize, ...filters } });
export const getAsignacion = (id) => apiClient.get(`/sistemas/asignaciones/${id}/`);
export const getInactiveAsignaciones = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/sistemas/asignaciones/inactivos/', { params: { page, page_size: pageSize, ...filters } });
export const createAsignacion = (data) => apiClient.post('/sistemas/asignaciones/', data);
export const importarAsignaciones = (formData) => apiClient.post('/sistemas/asignaciones/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAsignacionPdfUrl = (id) => `${apiClient.defaults.baseURL}/sistemas/asignaciones/${id}/pdf/`;

// Movimientos (Entradas/Salidas Manuales)
export const createMovimientoInventario = (data) => apiClient.post('/sistemas/movimientos/', data);
