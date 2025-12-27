'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api';
import ActionButtons from '@/components/common/ActionButtons';
import ReusableTable from '@/components/tables/ReusableTable';
import { toast } from 'sonner';
import { Mail, RefreshCw, FileText, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BuzonIMSSPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [synching, setSynching] = useState(false);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            // Ajustar endpoint según router en backend/rrhh/urls.py
            const res = await apiClient.get('/rrhh/buzon-imss/');
            setMessages(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando mensajes del IMSS");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleSync = async () => {
        setSynching(true);
        toast.info("Conectando con IDSE (Simulado)...");
        try {
            // Intento de sync (si existe el endpoint)
            // await apiClient.post('/rrhh/buzon-imss/sincronizar/');

            // Simulación de delay network
            await new Promise(r => setTimeout(r, 2000));

            await fetchMessages();
            toast.success("Buzón sincronizado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error sincronizando");
        } finally {
            setSynching(false);
        }
    };

    const columns = [
        {
            header: 'Fecha Recepción',
            accessorKey: 'fecha_recibido',
            cell: (row) => (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(row.fecha_recibido).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Asunto',
            accessorKey: 'asunto',
            cell: (row) => <span className="font-semibold">{row.asunto}</span>
        },
        {
            header: 'Contenido',
            accessorKey: 'cuerpo',
            cell: (row) => (
                <p className="max-w-md truncate text-gray-600 dark:text-gray-400" title={row.cuerpo}>
                    {row.cuerpo}
                </p>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'leido',
            cell: (row) => (
                row.leido
                    ? <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">Leido</Badge>
                    : <Badge className="bg-blue-600 hover:bg-blue-700">Nuevo</Badge>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6 bg-gray-50/50 dark:bg-gray-900/10 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 flex items-center gap-3">
                        <Mail className="w-8 h-8 text-emerald-600" />
                        Buzón IMSS (IDSE)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Notificaciones y requerimientos oficiales del Seguro Social.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ActionButtons
                        canCreate={false}
                        canExport={false}
                        customActions={[
                            {
                                label: synching ? 'Sincronizando...' : 'Sincronizar IDSE',
                                onClick: handleSync,
                                icon: RefreshCw,
                                variant: 'default', // Button variant
                                className: "bg-emerald-600 hover:bg-emerald-700 text-white",
                                disabled: synching
                            }
                        ]}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-1">
                <ReusableTable
                    data={messages}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No hay mensajes nuevos en el buzón."
                />
            </div>
        </div>
    );
}
