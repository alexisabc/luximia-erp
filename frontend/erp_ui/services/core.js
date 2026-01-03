import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

// =================== Base URL ===================
const isServer = typeof window === 'undefined';

const rawBase = isServer
    ? (process.env.API_URL || 'http://backend:8000')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const baseURL = rawBase.replace(/\/+$/, '');

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// =================== Cliente Axios ===================
export const apiClient = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

const naked = axios.create({ baseURL });

// =================== Interceptor de request ===================
// =================== Interceptor de request ===================
apiClient.interceptors.request.use(async (req) => {
    let authTokens = (typeof window !== 'undefined') ? localStorage.getItem('authTokens') : null;
    authTokens = authTokens ? JSON.parse(authTokens) : null;

    if (authTokens?.access) {
        try {
            const payload = jwtDecode(authTokens.access);
            const isExpired = Date.now() >= payload.exp * 1000;

            if (isExpired && authTokens.refresh) {
                try {
                    const { data } = await naked.post('/users/token/refresh/', { refresh: authTokens.refresh });
                    localStorage.setItem('authTokens', JSON.stringify(data));
                    req.headers.Authorization = `Bearer ${data.access}`;
                } catch (refreshError) {
                    // Si el refresh falla (token inválido o expirado también), cerramos sesión.
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('authTokens');
                        window.dispatchEvent(new Event('auth:logout'));
                    }
                    return Promise.reject(refreshError);
                }
            } else if (!isExpired) {
                req.headers.Authorization = `Bearer ${authTokens.access}`;
            }
        } catch (err) {
            // Error decodificando o procesando
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authTokens');
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
    }

    // --- MULTI-COMPANY & SANDBOX HEADERS ---
    if (typeof window !== 'undefined') {
        // Sandbox environment
        const env = localStorage.getItem('sandboxMode') === 'true' ? 'sandbox' : 'prod';
        req.headers['X-Environment'] = env;

        // Active Company
        const activeCompanyId = localStorage.getItem('activeCompanyId');
        if (activeCompanyId) {
            req.headers['X-Company-ID'] = activeCompanyId;
        }
    }

    return req;
});

// =================== Interceptor de response ===================
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        const data = error?.response?.data;

        if (typeof window !== 'undefined') {
            // Manejo de Auth
            if (status === 401) {
                localStorage.removeItem('authTokens');
                window.dispatchEvent(new Event('auth:logout'));
            }

            // Estandarización de Errores con Backend
            // Si el backend envía nuestro formato estándar { detail: "..." }
            if (data?.detail) {
                // Evitamos toast automáticos en 404 para no spammear si es lógica interna
                if (status !== 404) {
                    toast.error(data.detail);
                }
            } else if (status === 403) {
                toast.error("No tienes permisos para realizar esta acción.");
            } else if (status >= 500) {
                toast.error("Error del servidor. Por favor intenta más tarde.");
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

// =================== Empresa APIs ===================

/**
 * Obtiene las empresas del usuario actual y la empresa activa
 */
export const getMisEmpresas = async () => {
    return await apiClient.get('/core/empresas/mis_empresas/');
};

/**
 * Cambia la empresa activa del usuario
 * @param {number} empresaId - ID de la empresa a activar
 */
export const cambiarEmpresa = async (empresaId) => {
    return await apiClient.post(`/core/empresas/${empresaId}/cambiar/`);
};

/**
 * Obtiene todas las empresas (admin)
 */
/**
 * Obtiene todas las empresas (admin). Soporta paginación y filtrado
 */
export const getEmpresas = async (page = 1, pageSize = 15, filters = {}) => {
    return await apiClient.get('/core/empresas/', { params: { page, page_size: pageSize, ...filters } });
};

export const getInactiveEmpresas = async (page = 1, pageSize = 15, filters = {}) => {
    return await apiClient.get('/core/empresas/', {
        params: { page, page_size: pageSize, activo: false, ...filters }
    });
};

export const createEmpresa = (data) => apiClient.post('/core/empresas/', data);
export const updateEmpresa = (id, data) => apiClient.patch(`/core/empresas/${id}/`, data);
export const deleteEmpresa = (id) => apiClient.delete(`/core/empresas/${id}/`);
export const hardDeleteEmpresa = (id) => apiClient.delete(`/core/empresas/${id}/hard_delete/`); // Assuming backend supports this or generic delete with flag

export const exportEmpresasExcel = (columns) =>
    apiClient.post('/core/empresas/exportar-excel/', { columns }, { responseType: 'blob' });

export const importarEmpresas = (formData) =>
    apiClient.post('/core/empresas/importar-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
