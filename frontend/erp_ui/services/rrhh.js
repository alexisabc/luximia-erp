import apiClient from './core';

// ===================== RRHH / Departamentos / Empleados / Vendedores =====================

export const getDepartamentos = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/rrhh/departamentos/', { params: { page, page_size: pageSize, ...filters } });
export const createDepartamento = (data) => apiClient.post('/rrhh/departamentos/', data);
export const updateDepartamento = (id, data) => apiClient.patch(`/rrhh/departamentos/${id}/`, data);
export const deleteDepartamento = (id) => apiClient.delete(`/rrhh/departamentos/${id}/`);
export const getInactiveDepartamentos = (page = 1, pageSize = 15) => apiClient.get('/rrhh/departamentos/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteDepartamento = (id) => apiClient.delete(`/rrhh/departamentos/${id}/hard/`);
export const exportDepartamentosExcel = (columns) => apiClient.post('/rrhh/departamentos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarDepartamentos = (formData) => apiClient.post('/rrhh/departamentos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAllDepartamentos = () => apiClient.get('/rrhh/departamentos/');

export const getPuestos = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/rrhh/puestos/', { params: { page, page_size: pageSize, ...filters } });
export const createPuesto = (data) => apiClient.post('/rrhh/puestos/', data);
export const updatePuesto = (id, data) => apiClient.patch(`/rrhh/puestos/${id}/`, data);
export const deletePuesto = (id) => apiClient.delete(`/rrhh/puestos/${id}/`);
export const getInactivePuestos = (page = 1, pageSize = 15) => apiClient.get('/rrhh/puestos/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeletePuesto = (id) => apiClient.delete(`/rrhh/puestos/${id}/hard/`);
export const exportPuestosExcel = (columns) => apiClient.post('/rrhh/puestos/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarPuestos = (formData) => apiClient.post('/rrhh/puestos/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getEmpleados = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/rrhh/empleados/', { params: { page, page_size: pageSize, ...filters } });
export const createEmpleado = (data) => apiClient.post('/rrhh/empleados/', data);
export const updateEmpleado = (id, data) => apiClient.patch(`/rrhh/empleados/${id}/`, data);
export const deleteEmpleado = (id) => apiClient.delete(`/rrhh/empleados/${id}/`);
export const getInactiveEmpleados = (page = 1, pageSize = 15) => apiClient.get('/rrhh/empleados/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteEmpleado = (id) => apiClient.delete(`/rrhh/empleados/${id}/hard/`);
export const exportEmpleadosExcel = (columns) => apiClient.post('/rrhh/empleados/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarEmpleados = (formData) => apiClient.post('/rrhh/empleados/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getOrganigrama = () => apiClient.get('/rrhh/empleados/organigrama/');

export const getVendedores = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/contabilidad/vendedores/', { params: { page, page_size: pageSize, ...filters } });
export const createVendedor = (data) => apiClient.post('/contabilidad/vendedores/', data);
export const updateVendedor = (id, data) => apiClient.patch(`/contabilidad/vendedores/${id}/`, data);
export const deleteVendedor = (id) => apiClient.delete(`/contabilidad/vendedores/${id}/`);
export const getInactiveVendedores = (page = 1, pageSize = 15) => apiClient.get('/contabilidad/vendedores/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteVendedor = (id) => apiClient.delete(`/contabilidad/vendedores/${id}/hard/`);
export const exportVendedoresExcel = (columns) => apiClient.post('/contabilidad/vendedores/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarVendedores = (formData) => apiClient.post('/contabilidad/vendedores/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getEsquemasComision = (page = 1, pageSize = 15, filters = {}) =>
    apiClient.get('/contabilidad/esquemas-comision/', { params: { page, page_size: pageSize, ...filters } });
export const createEsquemaComision = (data) => apiClient.post('/contabilidad/esquemas-comision/', data);
export const updateEsquemaComision = (id, data) => apiClient.patch(`/contabilidad/esquemas-comision/${id}/`, data);
export const deleteEsquemaComision = (id) => apiClient.delete(`/contabilidad/esquemas-comision/${id}/`);
export const getInactiveEsquemasComision = (page = 1, pageSize = 15) => apiClient.get('/contabilidad/esquemas-comision/inactivos/', { params: { page, page_size: pageSize } });
export const hardDeleteEsquemaComision = (id) => apiClient.delete(`/contabilidad/esquemas-comision/${id}/hard/`);
export const exportEsquemasComisionExcel = (columns) => apiClient.post('/contabilidad/esquemas-comision/exportar-excel/', { columns }, { responseType: 'blob' });
export const importarEsquemasComision = (formData) => apiClient.post('/contabilidad/esquemas-comision/importar-excel/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ===================== RRHH / Nóminas =====================
export const getNominas = (page = 1, pageSize = 15, filters = {}) => apiClient.get('/rrhh/nominas/', { params: { page, page_size: pageSize, ...filters } });
export const createNomina = (data) => apiClient.post('/rrhh/nominas/', data);
export const getNominaById = (id) => apiClient.get(`/rrhh/nominas/${id}/`);
export const updateNomina = (id, data) => apiClient.patch(`/rrhh/nominas/${id}/`, data);
export const deleteNomina = (id) => apiClient.delete(`/rrhh/nominas/${id}/`);
export const calcularNomina = (id, data = {}) => apiClient.post(`/rrhh/nominas/${id}/calcular/`, data);
export const importarNominaPagadora = (formData) => apiClient.post('/rrhh/nominas/importar-pagadora/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
// ===================== RRHH / Otros =====================
export const getAllRazonesSociales = () => apiClient.get('/rrhh/razones-sociales/');
export const getHistoricoNomina = (page = 1, pageSize = 20, filters = {}) => apiClient.get('/rrhh/historico-nomina/', { params: { page, page_size: pageSize, ...filters } });
export const exportarHistoricoNominaExcel = (filters = {}) => apiClient.get('/rrhh/historico-nomina/exportar-excel/', { params: filters, responseType: 'blob' });
export const borrarHistoricoNomina = (filters = {}) => apiClient.delete('/rrhh/historico-nomina/borrar-todo/', { params: filters });


export const cerrarNomina = (id) => apiClient.post(`/rrhh/nominas/${id}/cerrar/`);

export const getPeriodos = (params = {}) => apiClient.get('/rrhh/periodos-nomina/', { params });
export const generarPeriodos = (anio) => apiClient.post('/rrhh/periodos-nomina/generar/', { anio });
export const updatePeriodo = (id, data) => apiClient.patch(`/rrhh/periodos-nomina/${id}/`, data);


export const updateRecibo = (id, data) => apiClient.patch(`/rrhh/recibos-nomina/${id}/`, data);
export const recalcularRecibo = (id, data = {}) => apiClient.post(`/rrhh/recibos-nomina/${id}/recalcular/`, data);
export const addConceptoRecibo = (id, data) => apiClient.post(`/rrhh/recibos-nomina/${id}/agregar-concepto/`, data);
export const deleteConceptoRecibo = (reciboId, itemId) => apiClient.delete(`/rrhh/recibos-nomina/${reciboId}/eliminar-concepto/${itemId}/`);
// Need endpoint for concepts list?
export const getConceptos = (params = {}) => apiClient.get('/rrhh/conceptos-nomina/', { params });

// ===================== Portal Empleado =====================
export const getVacacionesBalance = () => apiClient.get('/rrhh/portal-vacaciones/balance/');
export const getSolicitudesVacaciones = () => apiClient.get('/rrhh/portal-vacaciones/');
export const createSolicitudVacaciones = (data) => apiClient.post('/rrhh/portal-vacaciones/', data);

export const getPermisos = () => apiClient.get('/rrhh/portal-permisos/');
export const createSolicitudPermiso = (data) => apiClient.post('/rrhh/portal-permisos/', data);

export const getIncapacidades = () => apiClient.get('/rrhh/portal-incapacidades/');
export const createIncapacidad = (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    return apiClient.post('/rrhh/portal-incapacidades/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getDocumentosExpediente = () => apiClient.get('/rrhh/portal-documentos/');
export const uploadDocumentoExpediente = (data) => {
    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }
    return apiClient.post('/rrhh/portal-documentos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ===================== Gestión RRHH (Admin) =====================
// Vacaciones
export const getAdminVacaciones = () => apiClient.get('/rrhh/gestion-vacaciones/');
export const aprobarVacaciones = (id, data) => apiClient.post(`/rrhh/gestion-vacaciones/${id}/aprobar/`, data);
export const rechazarVacaciones = (id, data) => apiClient.post(`/rrhh/gestion-vacaciones/${id}/rechazar/`, data);

// Permisos
export const getAdminPermisos = () => apiClient.get('/rrhh/gestion-permisos/');
// (Add approve/reject endpoints to backend logic if I forgot them? I added them to Vacaciones but not Permisos explicitly in the ViewSet code block I wrote? Let me check)

// Incapacidades
export const getAdminIncapacidades = () => apiClient.get('/rrhh/gestion-incapacidades/');
export const validarIncapacidad = (id) => apiClient.post(`/rrhh/gestion-incapacidades/${id}/validar/`);

// Documentos
export const getAdminDocumentos = () => apiClient.get('/rrhh/gestion-documentos/');
export const aprobarDocumento = (id) => apiClient.post(`/rrhh/gestion-documentos/${id}/aprobar/`);
export const rechazarDocumento = (id, data) => apiClient.post(`/rrhh/gestion-documentos/${id}/rechazar/`, data);

export const simularNomina = (id, data = { dias: 15 }) => apiClient.post(`/rrhh/empleados/${id}/simular-nomina/`, data);
