import api from './api';

// --- Facturación ---
export const getFacturas = async (params) => {
    return await api.get('/contabilidad/facturas/', { params });
};

export const getFactura = async (id) => {
    return await api.get(`/contabilidad/facturas/${id}/`);
};

export const createFactura = async (data) => {
    return await api.post('/contabilidad/facturas/', data);
};

export const updateFactura = async (id, data) => {
    return await api.patch(`/contabilidad/facturas/${id}/`, data);
};

export const deleteFactura = async (id) => {
    return await api.delete(`/contabilidad/facturas/${id}/`);
};

export const exportarFacturasExcel = async (params) => {
    return await api.get('/contabilidad/facturas/exportar/', { params, responseType: 'blob' });
};

export const descargarPlantillaFacturas = async () => {
    // Note: Standard mixin usually provides generalized endpoint or explicit one.
    // Assuming mixin provides 'exportar-plantilla' action standard naming or we implemented it.
    // FacturaViewSet inherits ExcelImportMixin which has 'exportar_plantilla'.
    return await api.get('/contabilidad/facturas/exportar-plantilla/', { responseType: 'blob' });
};

export const importarFacturas = async (formData) => {
    return await api.post('/contabilidad/facturas/importar-excel/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
