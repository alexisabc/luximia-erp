import apiClient from './api';

const configService = {
    /**
     * Obtiene la configuración pública (Branding) para el login.
     * No requiere token.
     */
    getPublicConfig: async () => {
        return await apiClient.get('/configuracion/publica/');
    },

    /**
     * Obtiene la configuración completa para la administración.
     * Requiere permisos de administrador.
     */
    getAdminConfig: async () => {
        return await apiClient.get('/configuracion/admin/');
    },

    /**
     * Actualiza la configuración global.
     * Soporta subida de archivos (Multipart/Form-Data).
     * @param {FormData} formData 
     */
    updateConfig: async (formData) => {
        return await apiClient.patch('/configuracion/admin/1/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};

export default configService;
