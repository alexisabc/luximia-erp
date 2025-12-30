import apiClient from './core';

// ===================== Usuarios =====================
export const getPermissions = () => apiClient.get('/users/permisos/');
export const createUser = (data) => apiClient.post('/users/usuarios/invite/', data);
export const updateUser = (id, data) => apiClient.patch(`/users/usuarios/${id}/`, data);
export const deleteUser = (id) => apiClient.delete(`/users/usuarios/${id}/`);
export const hardDeleteUser = (id) => apiClient.delete(`/users/usuarios/${id}/hard/`);
export const resendInvite = (userId) => apiClient.post(`/users/usuarios/${userId}/resend-invite/`);
export const resetUserSession = (userId) => apiClient.post(`/users/usuarios/${userId}/reset-session/`);
export const getUser = (id) => apiClient.get(`/users/usuarios/${id}/`);
export const getUsers = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/usuarios/', { params: { page, page_size: pageSize, ...filters } });
export const getInactiveUsers = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/usuarios/', {
        params: { page, page_size: pageSize, include_inactive: true, ...filters },
    });

// ===================== Roles =====================
export const getRoles = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/users/roles/', { params: { page, page_size: pageSize, ...filters } });
export const createRole = (data) => apiClient.post('/users/roles/', data);
export const updateRole = (id, data) => apiClient.patch(`/users/roles/${id}/`, data);
export const deleteRole = (id) => apiClient.delete(`/users/roles/${id}/`);
