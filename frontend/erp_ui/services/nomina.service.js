import apiClient from './core';

const ENDPOINT_NOMINAS = '/rrhh/nominas/';
const ENDPOINT_RECIBOS = '/rrhh/recibos-nomina/';

const nominaService = {
    // --- Gestión de Nóminas (Cabeceras) ---

    getAll: (page = 1, pageSize = 15, filters = {}) => {
        return apiClient.get(ENDPOINT_NOMINAS, {
            params: { page, page_size: pageSize, ...filters }
        });
    },

    getById: (id) => apiClient.get(`${ENDPOINT_NOMINAS}${id}/`),

    create: (data) => apiClient.post(ENDPOINT_NOMINAS, data),

    update: (id, data) => apiClient.patch(`${ENDPOINT_NOMINAS}${id}/`, data),

    delete: (id) => apiClient.delete(`${ENDPOINT_NOMINAS}${id}/`),

    // --- Acciones de Proceso ---

    calcular: async (id) => {
        try {
            // POST /api/rrhh/nominas/{id}/calcular/
            const response = await apiClient.post(`${ENDPOINT_NOMINAS}${id}/calcular/`);
            return response.data;
        } catch (error) {
            console.error("Error al calcular nómina:", error);
            throw error;
        }
    },

    cerrar: async (id) => {
        const response = await apiClient.post(`${ENDPOINT_NOMINAS}${id}/cerrar/`);
        return response.data;
    },

    // --- Recibos y Documentos ---

    getRecibos: (nominaId) => {
        return apiClient.get(ENDPOINT_RECIBOS, { params: { nomina: nominaId } });
    },

    downloadReciboPdf: async (reciboId) => {
        try {
            const response = await apiClient.get(`${ENDPOINT_RECIBOS}${reciboId}/download_pdf/`, {
                responseType: 'blob' // Importante para archivos binarios
            });
            return response; // Retornamos la respuesta completa para acceder a headers si es necesario, o data.
        } catch (error) {
            console.error("Error descargando PDF:", error);
            throw error;
        }
    }
};

export default nominaService;
