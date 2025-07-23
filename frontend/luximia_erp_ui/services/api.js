// services/api.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para añadir el token de autenticación y refrescarlo si es necesario
apiClient.interceptors.request.use(async req => {
    let authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

    if (authTokens) {
        const user = jwtDecode(authTokens.access);
        const isExpired = Date.now() >= user.exp * 1000;

        if (isExpired) {
            try {
                const response = await axios.post(`${baseURL}/token/refresh/`, {
                    refresh: authTokens.refresh
                });
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                req.headers.Authorization = `Bearer ${response.data.access}`;
            } catch (refreshError) {
                console.error("Fallo el refresh token, cerrando sesión.", refreshError);
                localStorage.removeItem('authTokens');
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        } else {
            req.headers.Authorization = `Bearer ${authTokens.access}`;
        }
    }
    return req;
});


// --- FUNCIONES DE API (CON PAGINACIÓN) ---
export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/clientes/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/upes/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/contratos/?page=${page}&page_size=${pageSize}`);


// --- FUNCIONES SIN PAGINACIÓN O POR ID ---

// ### CAMBIO ###: Apuntamos a los nuevos endpoints '/all/'
export const getUsers = () => apiClient.get('/users/all/');
export const getGroups = () => apiClient.get('/groups/all/');
export const getPermissions = () => apiClient.get('/permissions/');

// Para Dropdowns
export const getAllProyectos = () => apiClient.get('/proyectos/all/');
export const getUPEsDisponibles = () => apiClient.get('/upes/disponibles/');

// Por ID
export const getProyecto = (id) => apiClient.get(`/proyectos/${id}/`);
export const getContratoById = (id) => apiClient.get(`/contratos/${id}/`);
export const getPagosPorContrato = (contratoId) => apiClient.get(`/contratos/${contratoId}/pagos/`);

// CRUD - Proyectos
export const createProyecto = (data) => apiClient.post('/proyectos/', data);
export const updateProyecto = (id, data) => apiClient.put(`/proyectos/${id}/`, data);
export const deleteProyecto = (id) => apiClient.delete(`/proyectos/${id}/`);

// CRUD - Clientes
export const createCliente = (data) => apiClient.post('/clientes/', data);
export const updateCliente = (id, data) => apiClient.put(`/clientes/${id}/`, data);
export const deleteCliente = (id) => apiClient.delete(`/clientes/${id}/`);

// CRUD - UPEs
export const createUPE = (data) => apiClient.post('/upes/', data);
export const updateUPE = (id, data) => apiClient.put(`/upes/${id}/`, data);
export const deleteUPE = (id) => apiClient.delete(`/upes/${id}/`);

// CRUD - Contratos
export const createContrato = (data) => apiClient.post('/contratos/', data);

// CRUD - Pagos
export const createPago = (data) => apiClient.post('/pagos/', data);
export const updatePago = (pagoId, data) => apiClient.put(`/pagos/${pagoId}/`, data);
export const deletePago = (pagoId) => apiClient.delete(`/pagos/${pagoId}/`);

// CRUD - Tipo de Cambio
export const getLatestTipoDeCambio = () => apiClient.get('/tipo-de-cambio/latest/');
export const getTiposDeCambio = (page = 1, pageSize = 15) => apiClient.get(`/tipos-de-cambio/?page=${page}&page_size=${pageSize}`);
export const actualizarTipoDeCambioHoy = () => apiClient.post('/tipo-de-cambio/actualizar-hoy/');

// CRUD - Usuarios y Roles
export const createUser = (data) => apiClient.post('/users/', data);
export const updateUser = (id, data) => apiClient.put(`/users/${id}/`, data);
export const createGroup = (data) => apiClient.post('/groups/', data);
export const updateGroup = (id, data) => apiClient.put(`/groups/${id}/`, data);

// Dashboard y Gráficas
export const getDashboardStats = () => apiClient.get('/dashboard-stats/');
export const getValorPorProyectoChartData = () => apiClient.get('/charts/valor-por-proyecto/');
export const getUpeStatusChartData = () => apiClient.get('/charts/upe-status/');

// Importaciones
export const importarDatosMasivos = (formData) => apiClient.post('/importar-masivo/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarClientes = (formData) => apiClient.post('/importar-clientes/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarUPEs = (formData) => apiClient.post('/importar-upes/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarContratos = (formData) => apiClient.post('/importar-contratos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarPagosHistoricos = (formData) => {
    return apiClient.post('/importar-pagos-historicos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};


// PDF
export const descargarEstadoDeCuentaPDF = (contratoId, pagoCols) => {
    const params = new URLSearchParams();
    pagoCols.forEach(col => params.append('pago_cols', col));
    return apiClient.get(`/contratos/${contratoId}/pdf/?${params.toString()}`, { responseType: 'blob' });
};
// XLSX
export const descargarEstadoDeCuentaExcel = (contratoId, planCols, pagoCols) => {
    const params = new URLSearchParams();
    planCols.forEach(col => params.append('plan_cols', col));
    pagoCols.forEach(col => params.append('pago_cols', col));

    return apiClient.get(`/contratos/${contratoId}/excel/?${params.toString()}`, { responseType: 'blob' });
};
//OPEN IA
export const consultaInteligente = (pregunta) => apiClient.post('/consulta-inteligente/', { pregunta });

//EXPORTADORES
export const exportProyectosExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/proyectos/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportClientesExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/clientes/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportUpesExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/upes/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportContratosExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/contratos/export/?${params.toString()}`, { responseType: 'blob' });
};
