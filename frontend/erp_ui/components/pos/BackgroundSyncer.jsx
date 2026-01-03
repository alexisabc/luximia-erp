'use client';
import { useEffect, useRef } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { posDB, SALES_STATUS } from '@/db/posDB';
import { createVenta } from '@/services/pos';
import { toast } from 'sonner';

export default function BackgroundSyncer() {
    const { isOnline, pendingCount } = usePOS();
    const isSyncing = useRef(false);

    useEffect(() => {
        if (isOnline && pendingCount > 0 && !isSyncing.current) {
            syncPendingSales();
        }
    }, [isOnline, pendingCount]);

    const syncPendingSales = async () => {
        isSyncing.current = true;

        try {
            const pending = await posDB.salesQueue
                .where('status').equals(SALES_STATUS.PENDING)
                .toArray();

            if (pending.length === 0) return;

            toast.info(`📡 Sincronizando ${pending.length} ventas pendientes...`, { duration: 3000 });

            let synced = 0;
            for (const sale of pending) {
                try {
                    await createVenta(sale.payload);
                    await posDB.salesQueue.delete(sale.id);
                    synced++;
                } catch (error) {
                    console.error("Sync retry failed for sale", sale.id, error);
                }
            }

            if (synced > 0) {
                const remaining = await posDB.salesQueue.where('status').equals(SALES_STATUS.PENDING).count();
                if (remaining === 0) {
                    toast.success("✅ Sincronización completada exitosamente.");
                } else {
                    toast.warning(`Sincronizadas ${synced}. Quedan ${remaining} pendientes.`);
                }
            }

        } finally {
            isSyncing.current = false;
        }
    };

    return null;
}
