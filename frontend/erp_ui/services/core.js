import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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
apiClient.interceptors.request.use(async (req) => {
    let authTokens = (typeof window !== 'undefined') ? localStorage.getItem('authTokens') : null;
    authTokens = authTokens ? JSON.parse(authTokens) : null;

    if (authTokens?.access) {
        try {
            const payload = jwtDecode(authTokens.access);
            const isExpired = Date.now() >= payload.exp * 1000;

            if (isExpired && authTokens.refresh) {
                const { data } = await naked.post('/users/token/refresh/', { refresh: authTokens.refresh });
                localStorage.setItem('authTokens', JSON.stringify(data));
                req.headers.Authorization = `Bearer ${data.access}`;
            } else if (!isExpired) {
                req.headers.Authorization = `Bearer ${authTokens.access}`;
            }
        } catch {
            if (typeof window !== 'undefined') localStorage.removeItem('authTokens');
        }
    }

    return req;
});

// =================== Interceptor de response ===================
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status;
        if (typeof window !== 'undefined' && status) {
            if (status === 401) {
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
            } else if (status === 403) {
                console.error("Acceso prohibido (403). Podría ser un problema de permisos o CSRF.");
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
export const getEmpresas = async () => {
    return await apiClient.get('/core/empresas/');
};
