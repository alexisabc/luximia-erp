import { useLiveQuery } from 'dexie-react-hooks';
import { useNetworkState } from 'react-use';
import { posDB, SALES_STATUS } from '@/db/posDB';
import { createVenta } from '@/services/pos';

export function usePOS() {
    const network = useNetworkState();
    const isOnline = network.online;

    /**
     * Search products locally in Dexie
     */
    const searchProductsLocal = async (term) => {
        if (!term || term.length < 3) return [];
        const lower = term.toLowerCase();

        const results = await posDB.products
            .filter(p => p.search_terms.includes(lower))
            .limit(20)
            .toArray();

        // Validate that results is an array before mapping
        if (!Array.isArray(results)) return [];

        return results.map(p => ({
            ...p,
            // Map Dexie fields to UI expected fields
            precio_final: p.precio,
            codigo: p.barcode,
            unidad_medida: p.unidad,
            stock_disponible: p.stock
        }));
    };

    /**
     * Process a sale (Offline First strategy)
     */
    const processSale = async (payload) => {
        // 1. Save to Local Queue (Always save first for resilience)
        const saleId = await posDB.salesQueue.add({
            payload,
            status: SALES_STATUS.PENDING,
            timestamp: Date.now()
        });

        // 2. Try to send if Online
        if (isOnline) {
            try {
                // Attempt API call
                const response = await createVenta(payload);

                // Success: Remove from queue (or mark synced)
                await posDB.salesQueue.delete(saleId);

                return { success: true, offline: false, data: response.data };
            } catch (error) {
                console.warn("Online sale failed, kept in offline queue.", error);
                // Fail silently to offline mode
                return { success: true, offline: true };
            }
        }

        // Offline Mode
        return { success: true, offline: true };
    };

    // Live count of pending sales
    const pendingCount = useLiveQuery(
        () => posDB.salesQueue.where('status').equals(SALES_STATUS.PENDING).count()
    );

    return {
        isOnline,
        searchProductsLocal,
        processSale,
        pendingCount: pendingCount || 0
    };
}
