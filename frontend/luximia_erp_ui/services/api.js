// services/api.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- Util ---
const isServer = typeof window === 'undefined';

// Base URL con /api al final
const rawBase = isServer
  ? process.env.API_URL || 'http://backend:8000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Asegura un solo slash y agrega /api
const baseURL = `${rawBase.replace(/\/+$/, '')}/api`;

// Helper: lee cookie por nombre
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// --- Cliente Axios principal ---
const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Inyecto CSRF y Authorization en cada request
apiClient.interceptors.request.use(async (req) => {
  // 1) CSRF (solo métodos no seguros)
  const method = (req.method || 'get').toLowerCase();
  const needsCSRF = !['get', 'head', 'options'].includes(method);
  if (needsCSRF) {
    const csrftoken =
      getCookie(apiClient.defaults.xsrfCookieName) || getCookie('csrftoken');
    if (csrftoken) {
      req.headers[apiClient.defaults.xsrfHeaderName] = csrftoken;
    }
  }

  // 2) JWT
  let authTokens = typeof window !== 'undefined' ? localStorage.getItem('authTokens') : null;
  authTokens = authTokens ? JSON.parse(authTokens) : null;

  if (authTokens?.access) {
    try {
      const payload = jwtDecode(authTokens.access);
      const isExpired = Date.now() >= payload.exp * 1000;

      if (isExpired && authTokens.refresh) {
        const { data } = await apiClient.post('/users/token/refresh/', { refresh: authTokens.refresh });
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

// Manejo de respuestas/errores
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
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

// ===================== CXC (paginados) =====================
export const getProyectos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/proyectos/?page=${page}&page_size=${pageSize}`);
export const getClientes = (page = 1, pageSize = 15) => apiClient.get(`/cxc/clientes/?page=${page}&page_size=${pageSize}`);
export const getUPEs = (page = 1, pageSize = 15) => apiClient.get(`/cxc/upes/?page=${page}&page_size=${pageSize}`);
export const getBancos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/bancos/?page=${page}&page_size=${pageSize}`);
export const getMonedas = (page = 1, pageSize = 15) => apiClient.get(`/cxc/monedas/?page=${page}&page_size=${pageSize}`);
export const getDepartamentos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/departamentos/?page=${page}&page_size=${pageSize}`);
export const getPuestos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/puestos/?page=${page}&page_size=${pageSize}`);
export const getEmpleados = (page = 1, pageSize = 15) => apiClient.get(`/cxc/empleados/?page=${page}&page_size=${pageSize}`);
export const getVendedores = (page = 1, pageSize = 15) => apiClient.get(`/cxc/vendedores/?page=${page}&page_size=${pageSize}`);
export const getPresupuestos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/presupuestos/?page=${page}&page_size=${pageSize}`);
export const getContratos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/contratos/?page=${page}&page_size=${pageSize}`);
export const getPagos = (page = 1, pageSize = 15) => apiClient.get(`/cxc/pagos/?page=${page}&page_size=${pageSize}`);

// ===================== Bancos =====================
export const createBanco = (data) => apiClient.post('/cxc/bancos/', data);
export const updateBanco = (id, data) => apiClient.patch(`/cxc/bancos/${id}/`, data);
export const deleteBanco = (id) => apiClient.delete(`/cxc/bancos/${id}/`);
export const getInactiveBancos = () => apiClient.get('/cxc/bancos/inactivos/');
export const hardDeleteBanco = (id) => apiClient.delete(`/cxc/bancos/${id}/hard/`);
export const exportBancosExcel = (columns) => apiClient.post('/cxc/bancos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarBancos = (formData) => apiClient.post('/cxc/bancos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Monedas =====================
export const createMoneda = (data) => apiClient.post('/cxc/monedas/', data);
export const updateMoneda = (id, data) => apiClient.patch(`/cxc/monedas/${id}/`, data);
export const deleteMoneda = (id) => apiClient.delete(`/cxc/monedas/${id}/`);
export const getInactiveMonedas = () => apiClient.get('/cxc/monedas/inactivos/');
export const hardDeleteMoneda = (id) => apiClient.delete(`/cxc/monedas/${id}/hard/`);
export const exportMonedasExcel = (columns) => apiClient.post('/cxc/monedas/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarMonedas = (formData) => apiClient.post('/cxc/monedas/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Clientes =====================
export const createCliente = (data) => apiClient.post('/cxc/clientes/', data);
export const updateCliente = (id, data) => apiClient.patch(`/cxc/clientes/${id}/`, data);
export const deleteCliente = (id) => apiClient.delete(`/cxc/clientes/${id}/`);
export const getInactiveClientes = () => apiClient.get('/cxc/clientes/inactivos/');
export const hardDeleteCliente = (id) => apiClient.delete(`/cxc/clientes/${id}/hard/`);
export const exportClientesExcel = (columns) => apiClient.post('/cxc/clientes/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarClientes = (formData) => apiClient.post('/cxc/clientes/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Departamentos =====================
export const createDepartamento = (data) => apiClient.post('/cxc/departamentos/', data);
export const updateDepartamento = (id, data) => apiClient.patch(`/cxc/departamentos/${id}/`, data);
export const deleteDepartamento = (id) => apiClient.delete(`/cxc/departamentos/${id}/`);
export const getInactiveDepartamentos = () => apiClient.get('/cxc/departamentos/inactivos/');
export const hardDeleteDepartamento = (id) => apiClient.delete(`/cxc/departamentos/${id}/hard/`);
export const exportDepartamentosExcel = (columns) => apiClient.post('/cxc/departamentos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarDepartamentos = (formData) => apiClient.post('/cxc/departamentos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Puestos =====================
export const createPuesto = (data) => apiClient.post('/cxc/puestos/', data);
export const updatePuesto = (id, data) => apiClient.patch(`/cxc/puestos/${id}/`, data);
export const deletePuesto = (id) => apiClient.delete(`/cxc/puestos/${id}/`);
export const getInactivePuestos = () => apiClient.get('/cxc/puestos/inactivos/');
export const hardDeletePuesto = (id) => apiClient.delete(`/cxc/puestos/${id}/hard/`);
export const getAllDepartamentos = () => apiClient.get('/cxc/departamentos/');
export const exportPuestosExcel = (columns) => apiClient.post('/cxc/puestos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarPuestos = (formData) => apiClient.post('/cxc/puestos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Empleados =====================
export const createEmpleado = (data) => apiClient.post('/cxc/empleados/', data);
export const updateEmpleado = (id, data) => apiClient.patch(`/cxc/empleados/${id}/`, data);
export const deleteEmpleado = (id) => apiClient.delete(`/cxc/empleados/${id}/`);
export const getInactiveEmpleados = () => apiClient.get('/cxc/empleados/inactivos/');
export const hardDeleteEmpleado = (id) => apiClient.delete(`/cxc/empleados/${id}/hard/`);
export const exportEmpleadosExcel = (columns) => apiClient.post('/cxc/empleados/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarEmpleados = (formData) => apiClient.post('/cxc/empleados/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getUsers = () => apiClient.get('/users/');

// ===================== Vendedores =====================
export const createVendedor = (data) => apiClient.post('/cxc/vendedores/', data);
export const updateVendedor = (id, data) => apiClient.patch(`/cxc/vendedores/${id}/`, data);
export const deleteVendedor = (id) => apiClient.delete(`/cxc/vendedores/${id}/`);
export const getInactiveVendedores = () => apiClient.get('/cxc/vendedores/inactivos/');
export const hardDeleteVendedor = (id) => apiClient.delete(`/cxc/vendedores/${id}/hard/`);
export const exportVendedoresExcel = (columns) => apiClient.post('/cxc/vendedores/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarVendedores = (formData) => apiClient.post('/cxc/vendedores/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Proyectos =====================
export const createProyecto = (data) => apiClient.post('/cxc/proyectos/', data);
export const updateProyecto = (id, data) => apiClient.patch(`/cxc/proyectos/${id}/`, data);
export const deleteProyecto = (id) => apiClient.delete(`/cxc/proyectos/${id}/`);
export const getInactiveProyectos = () => apiClient.get('/cxc/proyectos/inactivos/');
export const hardDeleteProyecto = (id) => apiClient.delete(`/cxc/proyectos/${id}/hard/`);
export const exportProyectosExcel = (columns) => apiClient.post('/cxc/proyectos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarProyectos = (formData) => apiClient.post('/cxc/proyectos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAllProyectos = () => apiClient.get('/cxc/proyectos/?page_size=1000');

// ===================== UPEs =====================
export const createUPE = (data) => apiClient.post('/cxc/upes/', data);
export const updateUPE = (id, data) => apiClient.patch(`/cxc/upes/${id}/`, data);
export const deleteUPE = (id) => apiClient.delete(`/cxc/upes/${id}/`);
export const getInactiveUpes = () => apiClient.get('/cxc/upes/inactivos/');
export const hardDeleteUpe = (id) => apiClient.delete(`/cxc/upes/${id}/hard/`);
export const exportUpesExcel = (columns) => apiClient.post('/cxc/upes/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarUPEs = (formData) => apiClient.post('/cxc/upes/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Clientes-Proyectos-Presupuestos =====================
export const createPresupuesto = (data) => apiClient.post('/cxc/presupuestos/', data);
export const updatePresupuesto = (id, data) => apiClient.patch(`/cxc/presupuestos/${id}/`, data);
export const getPresupuesto = (id) => apiClient.get(`/cxc/presupuestos/${id}/`);
export const exportPresupuestosExcel = (columns) => apiClient.post('/cxc/presupuestos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarPresupuestos = (formData) => apiClient.post('/cxc/presupuestos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Planes de Pago =====================
export const createPlanPago = (data) => apiClient.post('/cxc/planes-pago/', data);
export const exportPlanesPagoExcel = (columns) => apiClient.post('/cxc/planes-pago/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarPlanesPago = (formData) => apiClient.post('/cxc/planes-pago/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Esquemas de Comisión =====================
export const getEsquemasComision = (page = 1, pageSize = 15) =>
  apiClient.get(`/cxc/esquemas-comision/?page=${page}&page_size=${pageSize}`);
export const createEsquemaComision = (data) => apiClient.post('/cxc/esquemas-comision/', data);
export const updateEsquemaComision = (id, data) => apiClient.patch(`/cxc/esquemas-comision/${id}/`, data);
export const deleteEsquemaComision = (id) => apiClient.delete(`/cxc/esquemas-comision/${id}/`);
export const getInactiveEsquemasComision = () => apiClient.get('/cxc/esquemas-comision/inactivos/');
export const hardDeleteEsquemaComision = (id) => apiClient.delete(`/cxc/esquemas-comision/${id}/hard/`);
export const exportEsquemasComisionExcel = (columns) => apiClient.post('/cxc/esquemas-comision/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarEsquemasComision = (formData) => apiClient.post('/cxc/esquemas-comision/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Tipos de Cambio =====================
export const createTipoCambio = (data) => apiClient.post('/cxc/tipos-cambio/', data);
export const updateTipoCambio = (id, data) => apiClient.patch(`/cxc/tipos-cambio/${id}/`, data);
export const deleteTipoCambio = (id) => apiClient.delete(`/cxc/tipos-cambio/${id}/`);
export const exportTiposCambioExcel = (columns) => apiClient.post('/cxc/tipos-cambio/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarTiposCambio = (formData) => apiClient.post('/cxc/tipos-cambio/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Tipos de Cambio SAT =====================
export const getTiposDeCambio = () => apiClient.get('/cxc/tipos-de-cambio/');
export const actualizarTipoDeCambioHoy = () => apiClient.post('/cxc/tipos-de-cambio/actualizar/');

// ===================== Contratos & Pagos =====================
export const exportContratosExcel = (columns) => apiClient.post('/cxc/contratos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarContratos = (formData) => apiClient.post('/cxc/contratos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const createPago = (data) => apiClient.post('/cxc/pagos/', data);
export const importarPagosHistoricos = (formData) => apiClient.post('/cxc/pagos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Métodos de Pago vs Formas de Pago =====================
// Métodos de pago (catálogo "MetodoPago")
export const getMetodosPago = () => apiClient.get('/cxc/metodos-pago/');
// Formas de pago (catálogo "FormaPago")
export const getFormasPago = () => apiClient.get('/cxc/formas-pago/');
export const createFormaPago = (data) => apiClient.post('/cxc/formas-pago/', data);
export const updateFormaPago = (id, data) => apiClient.patch(`/cxc/formas-pago/${id}/`, data);
export const deleteFormaPago = (id) => apiClient.delete(`/cxc/formas-pago/${id}/`);
export const getInactiveFormasPago = () => apiClient.get('/cxc/formas-pago/inactivos/');
export const hardDeleteFormaPago = (id) => apiClient.delete(`/cxc/formas-pago/${id}/hard/`);
export const exportFormasPagoExcel = (columns) => apiClient.post('/cxc/formas-pago/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarFormasPago = (formData) => apiClient.post('/cxc/formas-pago/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== Varios =====================
export const importarDatosMasivos = (formData) => apiClient.post('/cxc/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getUser = () => apiClient.get('/cxc/usuarios/me/');
export const updateUser = (data) => apiClient.patch('/cxc/usuarios/me/', data);
export const getAuditLogs = () => apiClient.get('/cxc/auditoria/');
export const downloadAuditLogExcel = () => apiClient.get('/cxc/auditoria/exportar/', { responseType: 'blob' });

// ===================== Dashboard =====================
export const getStrategicDashboardData = (timeframe, selectedProjects, morosidadRange, porCobrarRange) => {
  const projects =
    selectedProjects === 'all'
      ? 'all'
      : Array.isArray(selectedProjects) ? selectedProjects.join(',') : String(selectedProjects);

  // Si vas a quedarte con /dashboard/strategic/
  return apiClient.get('/cxc/dashboard/strategic/', {
    params: { timeframe, projects, morosidad: morosidadRange, por_cobrar: porCobrarRange },
  });
};

// ===================== Chat Inteligente =====================
export const consultaInteligente = (consulta, extra = {}) =>
  apiClient.post('/cxc/consulta-inteligente/', { consulta, ...extra });
