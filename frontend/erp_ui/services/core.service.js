import apiClient from './core';

export const getDashboardResumen = async () => {
    return await apiClient.get('/core/dashboard/resumen/');
};
