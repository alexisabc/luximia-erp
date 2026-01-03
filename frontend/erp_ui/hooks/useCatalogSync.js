import { useState, useEffect } from 'react';
import apiClient from '@/services/core';
import { posDB } from '@/db/posDB';

export function useCatalogSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        // Initialize state
        const stored = localStorage.getItem('pos_last_sync');
        if (stored) setLastSync(new Date(parseInt(stored)));

        // Auto-sync check
        checkAndSync();
    }, []);

    const checkAndSync = async () => {
        const stored = localStorage.getItem('pos_last_sync');
        const now = Date.now();

        // Sync if never synced or > 1 hour old
        if (!stored || (now - parseInt(stored) > 3600000)) {
            await syncCatalog();
        }
    };

    const syncCatalog = async () => {
        try {
            setIsSyncing(true);
            setSyncError(null);

            // Get from optimized endpoint
            const res = await apiClient.get('/pos/productos/productos-fast/');
            // Correct URL path? in views.py I added 'productos-fast' action to ProductoViewSet
            // ProductoViewSet is mapped to 'router.register(r'productos', ProductoViewSet)'
            // So URL is /pos/productos/productos-fast/

            // Let me re-verify URL.
            // In backend/pos/urls.py: router.register(r'productos', ProductoViewSet)
            // In ProductoViewSet: @action(url_path='productos-fast')
            // So url is /pos/productos/productos-fast/

            // Wait, previous step I implemented it in ProductoViewSet.
            // Let's correct the URL in the code below.

            const products = res.data;

            if (Array.isArray(products)) {
                await posDB.transaction('rw', posDB.products, async () => {
                    await posDB.products.clear();
                    await posDB.products.bulkPut(products);
                });

                const now = Date.now();
                localStorage.setItem('pos_last_sync', now.toString());
                setLastSync(new Date(now));
            }

        } catch (err) {
            console.error("Catalog Sync Error", err);
            setSyncError("No se pudo actualizar el catálogo. Se usará la copia local.");
        } finally {
            setIsSyncing(false);
        }
    };

    return { isSyncing, syncError, lastSync, syncCatalog };
}
