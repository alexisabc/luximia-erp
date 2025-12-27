import Dexie from 'dexie';

export const db = new Dexie('ERP_POS_DB');

db.version(1).stores({
    products: 'id, nombre, codigo_barras, precio', // Indexamos por lo que buscaremos
    ventas: '++id, timestamp, status, payload', // Status: 'pending' | 'synced'
    turnos: 'id, usuario, inicio_turno, fin_turno, cerrado' // Copia local del turno
});

export const saveOfflineSale = async (saleData) => {
    return await db.ventas.add({
        payload: saleData,
        status: 'pending',
        timestamp: new Date().toISOString()
    });
};

export const getPendingSales = async () => {
    return await db.ventas.where('status').equals('pending').toArray();
};

export const markSaleSynced = async (id) => {
    return await db.ventas.update(id, { status: 'synced' });
};
