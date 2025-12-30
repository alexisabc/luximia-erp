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

// --- Recepción de Mercancía
export const recibirOrden = async (ordenId, almacenId) => {
    return await api.post(`/compras/ordenes/${ordenId}/recibir/`, { almacen_id: almacenId });
};

// --- Inventarios
export const getAlmacenes = async (params) => {
    return await api.get('/compras/almacenes/', { params });
};

export const getKardex = async (filters) => {
    return await api.get('/compras/kardex/', { params: filters });
};

// --- Catalogos
export const getProveedores = async (params) => {
    return await api.get('/compras/proveedores/', { params });
};

export const createProveedor = async (data) => {
    return await api.post('/compras/proveedores/', data);
};

export const updateProveedor = async (id, data) => {
    return await api.patch(`/compras/proveedores/${id}/`, data);
};

export const deleteProveedor = async (id) => {
    return await api.delete(`/compras/proveedores/${id}/`);
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

// --- Import/Export
export const exportarProveedoresExcel = async (params) => {
    return await api.get('/compras/proveedores/exportar/', { params, responseType: 'blob' });
};

export const descargarPlantillaProveedores = async () => {
    return await api.get('/compras/proveedores/exportar-plantilla/', { responseType: 'blob' });
};

export const importarProveedores = async (formData) => {
    return await api.post('/compras/proveedores/importar-excel/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
