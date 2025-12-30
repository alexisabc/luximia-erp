import api from './api';

export const getCuentas = async (params) => {
    return await api.get('/tesoreria/cuentas/', { params });
};

export const getMovimientos = async (filters) => {
    return await api.get('/tesoreria/movimientos/', { params: filters });
};

export const getTurnosPendientes = async () => {
    return await api.get('/tesoreria/turnos-pendientes/');
};

export const procesarCorte = async (turnoId, cuentaId) => {
    return await api.post('/tesoreria/movimientos/procesar-corte/', {
        turno_id: turnoId,
        cuenta_id: cuentaId
    });
};

export const conciliarMovimiento = async (movimientoId, fechaConciliacion = null) => {
    return await api.post(`/tesoreria/movimientos/${movimientoId}/conciliar/`, {
        fecha_conciliacion: fechaConciliacion
    });
};

export const getEgresos = async (params) => {
    return await api.get('/tesoreria/egresos/', { params });
};

export const getContraRecibos = async (params) => {
    return await api.get('/tesoreria/contrarecibos/', { params });
};
