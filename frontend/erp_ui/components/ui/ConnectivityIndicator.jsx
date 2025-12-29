'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ConnectivityIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check relative to browser
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Conexión restaurada", { id: 'connectivity-status' });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("Sin conexión a internet", { id: 'connectivity-status', duration: Infinity });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return (
            <div className="flex items-center gap-1 text-green-400" title="En línea">
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Online</span>
            </div>
        );
    }

    return (
        <Badge variant="destructive" className="animate-pulse flex gap-2 items-center bg-red-600 hover:bg-red-700 font-bold border-none" title="Sin conexión">
            <WifiOff className="w-4 h-4" />
            OFFLINE
        </Badge>
    );
}
