'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    RefreshCcw, TrendingUp, Calendar, DollarSign,
    Banknote, Loader2
} from 'lucide-react';

import DataTable from '@/components/organisms/DataTable';
import { Button } from '@/components/ui/button';

import { getTiposDeCambio, actualizarTipoDeCambioHoy } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function TiposDeCambioPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Registros',
            value: pageData.count || 0,
            icon: Banknote,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'TC Actual',
            value: pageData.results?.length > 0
                ? `$${parseFloat(pageData.results[0]?.valor || 0).toFixed(4)}`
                : '$0.0000',
            icon: DollarSign,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
            isAmount: true
        },
        {
            label: 'TC Promedio',
            value: pageData.results?.length > 0
                ? `$${(pageData.results.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) / pageData.results.length).toFixed(4)}`
                : '$0.0000',
            icon: TrendingUp,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        },
        {
            label: 'Última Actualización',
            value: pageData.results?.length > 0
                ? new Date(pageData.results[0]?.fecha + 'T06:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
                : '-',
            icon: Calendar,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!size) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setIsTableLoading(true);
        }

        try {
            const res = await getTiposDeCambio(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('No se pudieron cargar los tipos de cambio');
        } finally {
            setIsTableLoading(false);
            setIsPaginating(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const response = await actualizarTipoDeCambioHoy();
            toast.success(response.data.mensaje || 'Tipo de cambio actualizado correctamente');
            fetchData(1, pageSize);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Ocurrió un error al actualizar');
        } finally {
            setIsLoading(false);
        }
    };

    const columns = [
        {
            header: 'Tipo de Cambio',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                        <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-lg">
                            ${parseFloat(row.valor).toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">USD → MXN</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Fecha',
            render: (row) => (
                <div className="text-sm">
                    <div className="text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(row.fecha + 'T06:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Banxico</div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Tipos de Cambio Banxico
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Historial de tipos de cambio oficiales USD/MXN
                        </p>
                    </div>
                    {hasPermission('contabilidad.add_tipodecambio') && (
                        <Button
                            onClick={handleUpdate}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Actualizando...</>
                            ) : (
                                <><RefreshCcw className="w-4 h-4 mr-2" />Actualizar TC Hoy</>
                            )}
                        </Button>
                    )}
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
                    <DataTable
                        data={pageData.results}
                        columns={columns}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={isTableLoading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay tipos de cambio registrados"
                    />
                </div>
            </div>
        </div>
    );
}
