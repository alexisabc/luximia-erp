import apiClient from './core';

const obrasService = {
    // Obras
    getObras: async () => {
        const response = await apiClient.get('/obras/obras/');
        return response.data;
    },

    getObra: async (id) => {
        const response = await apiClient.get(`/obras/obras/${id}/`);
        return response.data;
    },

    createObra: async (data) => {
        const response = await apiClient.post('/obras/obras/', data);
        return response.data;
    },

    // Centros de Costos
    getCentrosCostos: async (obraId) => {
        const response = await apiClient.get(`/obras/centros-costos/?obra=${obraId}`);
        return response.data;
    },
};

export default obrasService;
