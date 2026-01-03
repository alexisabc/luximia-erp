import Dexie from 'dexie';

export const posDB = new Dexie('POS_Offline_DB');

posDB.version(1).stores({
    products: 'id, barcode, search_terms', // Indexed fields for fast search
    salesQueue: '++id, status, timestamp'  // Queue for offline sales
});

export const SALES_STATUS = {
    PENDING: 'PENDING',
    SYNCED: 'SYNCED',
    ERROR: 'ERROR'
};
