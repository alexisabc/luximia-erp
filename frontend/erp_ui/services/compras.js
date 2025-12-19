import api from './api';

export const getOrdenesCompra = async (params) => {
    return await api.get('/compras/ordenes/', { params });
};

export const getOrdenCompra = async (id) => {
    return await api.get(`/compras/ordenes/${id}/`);
};

export const createOrdenCompra = async (data) => {
    return await api.post('/compras/ordenes/', data);
};

export const updateOrdenCompra = async (id, data) => {
    return await api.patch(`/compras/ordenes/${id}/`, data);
};

export const deleteOrdenCompra = async (id) => {
    return await api.delete(`/compras/ordenes/${id}/`);
};

// --- Actions for 2-step Auth
export const solicitarVobo = async (id) => {
    return await api.post(`/compras/ordenes/${id}/solicitar-vobo/`);
};

export const darVobo = async (id) => {
    return await api.post(`/compras/ordenes/${id}/dar-vobo/`);
};

export const autorizarOrden = async (id) => {
    return await api.post(`/compras/ordenes/${id}/autorizar/`);
};

export const rechazarOrden = async (id, motivo) => {
    return await api.post(`/compras/ordenes/${id}/rechazar/`, { motivo });
};

// --- Catalogos
export const getProveedores = async (params) => {
    return await api.get('/compras/proveedores/', { params });
};

export const getInsumos = async (params) => {
    return await api.get('/compras/insumos/', { params });
};

// --- Detalles
export const createDetalleOrden = async (data) => {
    return await api.post('/compras/detalles-orden/', data);
};

export const deleteDetalleOrden = async (id) => {
    return await api.delete(`/compras/detalles-orden/${id}/`);
};
