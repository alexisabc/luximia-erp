import apiClient from './core';

/**
 * Servicio de Administración de Usuarios y RBAC (Sprint 11)
 * Centraliza la gestión de usuarios, roles (grupos) y permisos.
 */
const adminService = {
    // --- Gestión de Usuarios ---

    getUsuarios: (page = 1, pageSize = 15, filters = {}) =>
        apiClient.get('/users/usuarios/', {
            params: { page, page_size: pageSize, ...filters }
        }),

    getUsuario: (id) =>
        apiClient.get(`/users/usuarios/${id}/`),

    updateUsuario: (id, data) =>
        apiClient.patch(`/users/usuarios/${id}/`, data),

    inviteUsuario: (data) =>
        apiClient.post('/users/usuarios/invite/', data),

    resetUserSession: (userId) =>
        apiClient.post(`/users/usuarios/${userId}/reset-session/`),


    // --- Gestión de Roles (RBAC) ---

    getRoles: () =>
        apiClient.get('/users/roles/'),

    createRole: (data) =>
        apiClient.post('/users/roles/', data),

    updateRole: (id, data) =>
        apiClient.patch(`/users/roles/${id}/`, data),

    deleteRole: (id) =>
        apiClient.delete(`/users/roles/${id}/`),


    // --- Gestión de Permisos ---

    /**
     * Obtiene todos los permisos y los agrupa por módulo (app_label)
     * para facilitar su visualización en una matriz de roles.
     */
    getPermisosAgrupados: async () => {
        const response = await apiClient.get('/users/permisos/');
        const permisos = response.data; // Se espera un array plano

        return permisos.reduce((acc, p) => {
            const module = p.app_label || 'Otros';
            if (!acc[module]) acc[module] = [];
            acc[module].push(p);
            return acc;
        }, {});
    }
};

export default adminService;
