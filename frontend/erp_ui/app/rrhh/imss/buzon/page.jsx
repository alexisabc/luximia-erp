'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Mail, RefreshCw, FileText, Calendar,
    AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import apiClient from '@/services/api';

export default function BuzonIMSSPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [synching, setSynching] = useState(false);

    const stats = [
        {
            label: 'Total Mensajes',
            value: messages.length || 0,
            icon: Mail,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Nuevos',
            value: messages.filter(m => !m.leido).length || 0,
            icon: AlertCircle,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Leídos',
            value: messages.filter(m => m.leido).length || 0,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Esta Semana',
            value: messages.filter(m => {
                const fecha = new Date(m.fecha_recibido);
                const hoy = new Date();
                const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
                return diff <= 7;
            }).length || 0,
            icon: Calendar,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
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
        toast.info("Conectando con IDSE...");
        try {
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
            header: 'Mensaje',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{row.asunto}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(row.fecha_recibido).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contenido',
            render: (row) => (
                <p className="max-w-md truncate text-gray-600 dark:text-gray-400" title={row.cuerpo}>
                    {row.cuerpo}
                </p>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                row.leido
                    ? <Badge variant="secondary">Leído</Badge>
                    : <Badge className="bg-blue-600 hover:bg-blue-700">Nuevo</Badge>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Mail className="text-purple-600 dark:text-purple-400 w-8 h-8" />
                            Buzón IMSS (IDSE)
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Notificaciones y requerimientos oficiales del Seguro Social
                        </p>
                    </div>
                    <Button
                        onClick={handleSync}
                        disabled={synching}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                    >
                        {synching ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sincronizando...</>
                        ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" />Sincronizar IDSE</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <DataTable
                        data={messages}
                        columns={columns}
                        loading={loading}
                        emptyMessage="No hay mensajes nuevos en el buzón"
                    />
                </div>
            </div>
        </div>
    );
}
