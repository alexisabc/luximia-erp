'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    FileText, Plus, Eye, TrendingUp, DollarSign,
    Clock, CheckCircle, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReusableTable from '@/components/tables/ReusableTable';

import { getOrdenesCompra } from '@/services/compras';

export default function ComprasPage() {
    const router = useRouter();
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const stats = [
        {
            label: 'Total Órdenes',
            value: ordenes.length || 0,
            icon: FileText,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Autorizadas',
            value: ordenes.filter(o => o.estado === 'AUTORIZADA').length || 0,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Pendientes',
            value: ordenes.filter(o => o.estado === 'PENDIENTE_AUTORIZACION' || o.estado === 'PENDIENTE_VOBO').length || 0,
            icon: Clock,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Total Compras',
            value: ordenes.length > 0
                ? `$${ordenes.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                : '$0.00',
            icon: DollarSign,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        }
    ];

    const fetchOrdenes = async () => {
        try {
            setLoading(true);
            const response = await getOrdenesCompra();
            setOrdenes(response.data.results || response.data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar órdenes de compra");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdenes();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'AUTORIZADA': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'PENDIENTE_AUTORIZACION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PENDIENTE_VOBO': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'RECHAZADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'BORRADOR': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        {
            header: 'Orden de Compra',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.folio}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.proveedor_nombre}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Fecha',
            render: (row) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(row.fecha_solicitud).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Total',
            render: (row) => (
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                    ${parseFloat(row.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge className={`border-0 ${getStatusColor(row.estado)}`}>
                    {row.estado_display || row.estado}
                </Badge>
            )
        }
    ];

    const filteredOrdenes = ordenes.filter(o =>
        o.folio?.toLowerCase().includes(search.toLowerCase()) ||
        o.proveedor_nombre?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <FileText className="text-orange-600 dark:text-orange-400 w-8 h-8" />
                            Compras
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestiona tus órdenes de compra y aprobaciones
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/compras/nueva')}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Orden
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <ReusableTable
                        data={filteredOrdenes}
                        columns={columns}
                        loading={loading}
                        onSearch={setSearch}
                        actions={{
                            custom: [
                                {
                                    icon: Eye,
                                    label: 'Ver',
                                    onClick: (row) => router.push(`/compras/${row.id}`),
                                    tooltip: 'Ver detalles'
                                }
                            ]
                        }}
                        emptyMessage="No hay órdenes de compra registradas"
                    />
                </div>
            </div>
        </div>
    );
}
