import api from './api';

export const getEstadoCaja = async (cajaId) => {
    return await api.get(`/pos/cajas-management/${cajaId}/estado-actual/`);
};

export const abrirTurno = async (cajaId, saldoInicial) => {
    return await api.post(`/pos/cajas-management/${cajaId}/abrir-turno/`, {
        saldo_inicial: saldoInicial
    });
};

export const cerrarTurno = async (cajaId, saldoDeclarado) => {
    return await api.post(`/pos/cajas-management/${cajaId}/cerrar-turno/`, {
        saldo_declarado: saldoDeclarado
    });
};

export const getCajas = async () => {
    return await api.get('/pos/cajas-management/');
};

export const getAlmacenes = async () => {
    return await api.get('/pos/almacenes/');
};

export const getCatalogo = async (almacenId) => {
    return await api.get('/pos/catalogo/items/', {
        params: { almacen_id: almacenId }
    });
};

export const cobrarVenta = async (payload) => {
    return await api.post('/pos/ventas-pos/cobrar/', payload);
};

export const getVentas = async (params) => {
    return await api.get('/pos/ventas-pos/', { params });
};

export const getVenta = async (id) => {
    return await api.get(`/pos/ventas-pos/${id}/`);
};
