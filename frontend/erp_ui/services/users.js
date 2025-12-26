import apiClient from './core';

// ===================== Usuarios =====================
export const getPermissions = () => apiClient.get('/users/permissions/');
export const createUser = (data) => apiClient.post('/users/invite/', data);
export const updateUser = (id, data) => apiClient.patch(`/users/${id}/`, data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}/`);
export const hardDeleteUser = (id) => apiClient.delete(`/users/${id}/hard/`);
export const resendInvite = (userId) => apiClient.post(`/users/${userId}/resend-invite/`);
export const resetUserSession = (userId) => apiClient.post(`/users/${userId}/reset-session/`);
export const getUser = (id) => apiClient.get(`/users/${id}/`);
export const getUsers = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/', { params: { page, page_size: pageSize, ...filters } });
export const getInactiveUsers = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/', {
        params: { page, page_size: pageSize, is_active: false, ...filters },
    });
export const listPasskeyCredentials = () => apiClient.get('/users/passkey/credentials/');
export const resetPasskeys = () => apiClient.post('/users/passkey/reset/');
export const startTotpReset = () => apiClient.post('/users/totp/reset/');
export const verifyTotpReset = (code) =>
    apiClient.post('/users/totp/reset/verify/', { code });
export const exportUsuariosExcel = (columns) =>
    apiClient.post('/users/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarUsuarios = (formData) =>
    apiClient.post('/users/importar-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

// ===================== Grupos/Roles =====================
export const getGroups = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/groups/', { params: { page, page_size: pageSize, ...filters } });
export const createGroup = (data) => apiClient.post('/users/groups/', data);
export const updateGroup = (id, data) => apiClient.patch(`/users/groups/${id}/`, data);
export const deleteGroup = (id) => apiClient.delete(`/users/groups/${id}/`);
export const getInactiveGroups = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/groups/', {
        params: { page, page_size: pageSize, is_active: false, ...filters },
    });
export const exportRolesExcel = (columns) =>
    apiClient.post('/users/groups/exportar-excel/', { columns }, {
        responseType: 'blob',
    });
export const importarRoles = (formData) =>
    apiClient.post('/users/groups/importar-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
