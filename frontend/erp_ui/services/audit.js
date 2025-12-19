import apiClient from './core';

export const getAuditLogs = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/auditoria/registros/', { params: { page, page_size: pageSize, ...filters } });

export const downloadAuditLogExcel = () => apiClient.get('/auditoria/registros/exportar/', { responseType: 'blob' });
