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

// Interceptor para redireccionar según el código de error HTTP
apiClient.interceptors.response.use(
    response => response,
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


// --- FUNCIONES DE API (CON PAGINACIÓN) ---

export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/cxc/clientes/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/cxc/upes/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/contratos/?page=${page}&page_size=${pageSize}`);
export const getEmpleados = (page = 1, pageSize = 15) => apiClient.get(`/cxc/empleados/?page=${page}&page_size=${pageSize}`);


export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/cxc/clientes/?page=${page}&page_size=${pageSize}`);
export const getDepartamentos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/departamentos/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/cxc/upes/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/contratos/?page=${page}&page_size=${pageSize}`);


export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/cxc/clientes/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/cxc/upes/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/contratos/?page=${page}&page_size=${pageSize}`);
export const getEsquemasComision = (page = 1, pageSize = 15) => apiClient.get(`/cxc/esquemas-comision/?page=${page}&page_size=${pageSize}`);



// --- FUNCIONES SIN PAGINACIÓN O POR ID ---

// ### CAMBIO ###: Apuntamos a los nuevos endpoints '/all/'
export const getUsers = () => apiClient.get('/cxc/users/all/');
export const getGroups = () => apiClient.get('/cxc/groups/all/');
export const getPermissions = () => apiClient.get('/cxc/permissions/');

// Para Dropdowns

export const getAllProyectos = () => apiClient.get('/cxc/proyectos/all/');
export const getUPEsDisponibles = () => apiClient.get('/cxc/upes/disponibles/');
export const getDepartamentos = () => apiClient.get('/cxc/departamentos/all/');
export const getPuestos = () => apiClient.get('/cxc/puestos/all/');

export const getAllProyectos = () => apiClient.get('/cxc/proyectos/all/');
export const getAllDepartamentos = () => apiClient.get('/cxc/departamentos/all/');
export const getUPEsDisponibles = () => apiClient.get('/cxc/upes/disponibles/');


// Por ID
export const getProyecto = (id) => apiClient.get(`/cxc/proyectos/${id}/`);
export const getContratoById = (id) => apiClient.get(`/cxc/contratos/${id}/`);
export const getPagosPorContrato = (contratoId) => apiClient.get(`/cxc/contratos/${contratoId}/pagos/`);
export const getPagos = (page = 1, pageSize = 15) =>
    apiClient.get(`/cxc/pagos/?page=${page}&page_size=${pageSize}`);

// CRUD - Proyectos
export const createProyecto = (data) => apiClient.post('/cxc/proyectos/', data);
export const updateProyecto = (id, data) => apiClient.put(`/cxc/proyectos/${id}/`, data);
export const deleteProyecto = (id) => apiClient.delete(`/cxc/proyectos/${id}/`);
export const getInactiveProyectos = () => apiClient.get('/cxc/proyectos/inactive/');
export const hardDeleteProyecto = (id) => apiClient.delete(`/cxc/proyectos/${id}/hard_delete/`);

// CRUD - Clientes
export const createCliente = (data) => apiClient.post('/cxc/clientes/', data);
export const updateCliente = (id, data) => apiClient.put(`/cxc/clientes/${id}/`, data);
export const deleteCliente = (id) => apiClient.delete(`/cxc/clientes/${id}/`);
export const getInactiveClientes = () => apiClient.get('/cxc/clientes/inactive/');
export const hardDeleteCliente = (id) => apiClient.delete(`/cxc/clientes/${id}/hard_delete/`);

// CRUD - Empleados
export const createEmpleado = (data) => apiClient.post('/cxc/empleados/', data);
export const updateEmpleado = (id, data) => apiClient.put(`/cxc/empleados/${id}/`, data);
export const deleteEmpleado = (id) => apiClient.delete(`/cxc/empleados/${id}/`);
export const getInactiveEmpleados = () => apiClient.get('/cxc/empleados/inactive/');
export const hardDeleteEmpleado = (id) => apiClient.delete(`/cxc/empleados/${id}/hard_delete/`);

// CRUD - Departamentos
export const createDepartamento = (data) => apiClient.post('/cxc/departamentos/', data);
export const updateDepartamento = (id, data) => apiClient.put(`/cxc/departamentos/${id}/`, data);
export const deleteDepartamento = (id) => apiClient.delete(`/cxc/departamentos/${id}/`);
export const getInactiveDepartamentos = () => apiClient.get('/cxc/departamentos/inactive/');
export const hardDeleteDepartamento = (id) => apiClient.delete(`/cxc/departamentos/${id}/hard_delete/`);

// CRUD - UPEs
export const createUPE = (data) => apiClient.post('/cxc/upes/', data);
export const updateUPE = (id, data) => apiClient.put(`/cxc/upes/${id}/`, data);
export const deleteUPE = (id) => apiClient.delete(`/cxc/upes/${id}/`);
export const getInactiveUpes = () => apiClient.get('/cxc/upes/inactive/');
export const hardDeleteUpe = (id) => apiClient.delete(`/cxc/upes/${id}/hard_delete/`);

// CRUD - Contratos
export const createContrato = (data) => apiClient.post('/cxc/contratos/', data);
export const getInactiveContratos = () => apiClient.get('/cxc/contratos/inactive/');
export const hardDeleteContrato = (id) => apiClient.delete(`/cxc/contratos/${id}/hard_delete/`);

// CRUD - Pagos
export const createPago = (data) => apiClient.post('/cxc/pagos/', data);
export const updatePago = (pagoId, data) => apiClient.put(`/cxc/pagos/${pagoId}/`, data);

export const deletePago = (pagoId) => apiClient.delete(`/cxc/pagos/${pagoId}/`);

// CRUD - Tipo Cambio
export const getTiposCambio = (page = 1, pageSize = 15) =>
    apiClient.get(`/cxc/tipos-cambio/?page=${page}&page_size=${pageSize}`);
export const createTipoCambio = (data) => apiClient.post('/cxc/tipos-cambio/', data);
export const updateTipoCambio = (id, data) => apiClient.put(`/cxc/tipos-cambio/${id}/`, data);
export const deleteTipoCambio = (id) => apiClient.delete(`/cxc/tipos-cambio/${id}/`);

// CRUD - Tipo de Cambio
export const getLatestTipoDeCambio = () => apiClient.get('/cxc/tipo-de-cambio/latest/');
export const getTiposDeCambio = (page = 1, pageSize = 15) => apiClient.get(`/cxc/tipos-de-cambio/?page=${page}&page_size=${pageSize}`);
export const actualizarTipoDeCambioHoy = () => apiClient.post('/cxc/tipo-de-cambio/actualizar-hoy/');

export const deletePago = (pagoId) => apiClient.delete(`/cxc/pagos/${pagoId}/`);

// CRUD - Esquemas de Comisión
export const createEsquemaComision = (data) => apiClient.post('/cxc/esquemas-comision/', data);
export const updateEsquemaComision = (id, data) => apiClient.put(`/cxc/esquemas-comision/${id}/`, data);
export const deleteEsquemaComision = (id) => apiClient.delete(`/cxc/esquemas-comision/${id}/`);
export const getInactiveEsquemasComision = () => apiClient.get('/cxc/esquemas-comision/inactive/');
export const hardDeleteEsquemaComision = (id) => apiClient.delete(`/cxc/esquemas-comision/${id}/hard_delete/`);

// CRUD - Tipo de Cambio
export const getLatestTipoDeCambio = () => apiClient.get('/cxc/tipo-de-cambio/latest/');
export const getTiposDeCambio = (page = 1, pageSize = 15) => apiClient.get(`/cxc/tipos-de-cambio/?page=${page}&page_size=${pageSize}`);
export const actualizarTipoDeCambioHoy = () => apiClient.post('/cxc/tipo-de-cambio/actualizar-hoy/');


// CRUD - Usuarios y Roles
export const createUser = (data) => apiClient.post('/cxc/users/', data);
export const getUser = (id) => apiClient.get(`/cxc/users/${id}/`);
export const updateUser = (id, data) => apiClient.put(`/cxc/users/${id}/`, data);
export const deleteUser = (id) => apiClient.delete(`/cxc/users/${id}/`);
export const getInactiveUsers = () => apiClient.get('/cxc/users/inactive/');
export const hardDeleteUser = (id) => apiClient.delete(`/cxc/users/${id}/hard_delete/`);
export const createGroup = (data) => apiClient.post('/cxc/groups/', data);
export const updateGroup = (id, data) => apiClient.put(`/cxc/groups/${id}/`, data);
export const deleteGroup = (id) => apiClient.delete(`/cxc/groups/${id}/`);

// --- Dashboard Estratégico ---
export const getUpeStatusChartData = () => apiClient.get('/cxc/charts/upe-status/');

export const getStrategicDashboardData = (timeframe, projectIds, morosidadRange, porCobrarRange) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (projectIds && projectIds !== 'all') {
        if (Array.isArray(projectIds)) {
            params.append('project_ids', projectIds.join(','));
        } else {
            params.append('project_ids', projectIds);
        }
    }
    if (morosidadRange) params.append('morosidad_range', morosidadRange);
    if (porCobrarRange) params.append('por_cobrar_range', porCobrarRange);
    return apiClient.get(`cxc/dashboard/strategic/?${params.toString()}`);
};


// Importaciones
export const importarDatosMasivos = (formData) => apiClient.post('/cxc/importar-masivo/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarClientes = (formData) => apiClient.post('/cxc/importar-clientes/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarUPEs = (formData) => apiClient.post('/cxc/importar-upes/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarContratos = (formData) => apiClient.post('/cxc/importar-contratos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importarPagosHistoricos = (formData) => {
    return apiClient.post('/cxc/importar-pagos-historicos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};


// PDF
export const descargarEstadoDeCuentaPDF = (contratoId, pagoCols) => {
    const params = new URLSearchParams();
    pagoCols.forEach(col => params.append('pago_cols', col));
    return apiClient.get(`/cxc/contratos/${contratoId}/pdf/?${params.toString()}`, { responseType: 'blob' });
};
// XLSX
export const descargarEstadoDeCuentaExcel = (contratoId, planCols, pagoCols) => {
    const params = new URLSearchParams();
    planCols.forEach(col => params.append('plan_cols', col));
    pagoCols.forEach(col => params.append('pago_cols', col));

    return apiClient.get(`/cxc/contratos/${contratoId}/excel/?${params.toString()}`, { responseType: 'blob' });
};
//OPEN IA
export const consultaInteligente = (pregunta) => apiClient.post('/cxc/consulta-inteligente/', { pregunta });

//EXPORTADORES
export const exportProyectosExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/cxc/proyectos/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportClientesExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/cxc/clientes/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportUpesExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/cxc/upes/export/?${params.toString()}`, { responseType: 'blob' });
};

export const exportContratosExcel = (columns) => {
    const params = new URLSearchParams();
    columns.forEach(col => params.append('cols', col));
    return apiClient.get(`/cxc/contratos/export/?${params.toString()}`, { responseType: 'blob' });
};

export const getAuditLogs = () => apiClient.get('/cxc/auditlog/');
export const downloadAuditLogExcel = () => apiClient.get('/cxc/auditlog/excel/', { responseType: 'blob' });
