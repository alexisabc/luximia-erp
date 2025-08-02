// services/api.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(async req => {
  let authTokens = typeof window !== 'undefined' ? localStorage.getItem('authTokens') : null;
  authTokens = authTokens ? JSON.parse(authTokens) : null;
  if (authTokens) {
    const user = jwtDecode(authTokens.access);
    const isExpired = Date.now() >= user.exp * 1000;
    if (isExpired) {
      try {
        const response = await axios.post(`${baseURL}/token/refresh/`, { refresh: authTokens.refresh });
        localStorage.setItem('authTokens', JSON.stringify(response.data));
        req.headers.Authorization = `Bearer ${response.data.access}`;
      } catch (err) {
        localStorage.removeItem('authTokens');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(err);
      }
    } else {
      req.headers.Authorization = `Bearer ${authTokens.access}`;
    }
  }
  return req;
});

apiClient.interceptors.response.use(
  res => res,
  error => {
    const status = error.response?.status;
    if (typeof window !== 'undefined' && status) {
      if (status === 401) {
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
      } else if (status === 403) {
        window.location.href = '/unauthorized';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// ---- API helpers (paginated) ----
export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/cxc/clientes/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/cxc/upes/?page=${page}&page_size=${pageSize}`);
export const getBancos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/bancos/?page=${page}&page_size=${pageSize}`);
export const getDepartamentos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/departamentos/?page=${page}&page_size=${pageSize}`);
export const getPuestos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/puestos/?page=${page}&page_size=${pageSize}`);
export const getEmpleados = (page = 1, pageSize = 15) => apiClient.get(`/cxc/empleados/?page=${page}&page_size=${pageSize}`);
export const getVendedores = (page = 1, pageSize = 15) => apiClient.get(`/cxc/vendedores/?page=${page}&page_size=${pageSize}`);
export const getFormasPago = (page = 1, pageSize = 15) => apiClient.get(`/cxc/formas-pago/?page=${page}&page_size=${pageSize}`);
export const getPlanesPago = (page = 1, pageSize = 15) => apiClient.get(`/cxc/planes-pago/?page=${page}&page_size=${pageSize}`);
export const getEsquemasComision = (page = 1, pageSize = 15) => apiClient.get(`/cxc/esquemas-comision/?page=${page}&page_size=${pageSize}`);
export const getTiposCambio = (page = 1, pageSize = 15) => apiClient.get(`/cxc/tipos-cambio/?page=${page}&page_size=${pageSize}`);
export const getMetodosPago = () => apiClient.get('/cxc/metodos-pago/');
export const getPresupuestos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/presupuestos/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/contratos/?page=${page}&page_size=${pageSize}`);
export const getPagos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/pagos/?page=${page}&page_size=${pageSize}`);

// ---- Bancos CRUD & utilities ----
export const createBanco = (data) => apiClient.post('/cxc/bancos/', data);
export const updateBanco = (id, data) => apiClient.patch(`/cxc/bancos/${id}/`, data);
export const deleteBanco = (id) => apiClient.delete(`/cxc/bancos/${id}/`);
export const getInactiveBancos = () => apiClient.get('/cxc/bancos/inactivos/');
export const hardDeleteBanco = (id) => apiClient.delete(`/cxc/bancos/${id}/hard/`);
export const exportBancosExcel = (columns) =>
  apiClient.post('/cxc/bancos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarBancos = (formData) =>
  apiClient.post('/cxc/bancos/importar-excel/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
