import apiClient from './core';

const requisicionesService = {
    // Requisiciones
    createRequisicion: async (data) => {
        const response = await apiClient.post('/compras/requisiciones/', data);
        return response.data;
    },

    aprobarRequisicion: async (id) => {
        const response = await apiClient.post(`/compras/requisiciones/${id}/aprobar/`);
        return response.data;
    },

    convertirToOC: async (id, data) => {
        const response = await apiClient.post(`/compras/requisiciones/${id}/convertir/`, data);
        return response.data;
    },

    getRequisiciones: async (params) => {
        const response = await apiClient.get('/compras/requisiciones/', { params });
        return response.data;
    }
};

export default requisicionesService;
