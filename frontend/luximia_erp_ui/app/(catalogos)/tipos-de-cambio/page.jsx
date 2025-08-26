// app/tipos-de-cambio/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getTiposDeCambio, actualizarTipoDeCambioHoy } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import { RefreshCcw } from 'lucide-react';

export default function TiposDeCambioPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize);
        }
    };

    const fetchData = useCallback(async (page, size) => {
        if (!size) return;
        try {
            const res = await getTiposDeCambio(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los tipos de cambio.');
        }
    }, []);

    useEffect(() => { if (pageSize > 0) { fetchData(1, pageSize); } }, [pageSize, fetchData]);

    const handleUpdate = async () => {
        setIsLoading(true);
        setMessage(null);
        setError(null);
        try {
            const response = await actualizarTipoDeCambioHoy();
            setMessage(response.data.mensaje);
            fetchData(1, pageSize); // Refresca la tabla
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al actualizar.');
        } finally {
            setIsLoading(false);
        }
    };

    const columns = [
        { header: 'Fecha', render: (row) => new Date(row.fecha + 'T06:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { header: 'Valor (MXN)', render: (row) => <span className="font-mono text-right dark:text-white">{parseFloat(row.valor).toFixed(4)}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Historial de Tipos de Cambio</h1>
                {hasPermission('cxc.add_tipodecambio') && (
                    <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg disabled:bg-gray-400"
                        title="Consultar/Actualizar TC de Hoy"
                    >
                        <RefreshCcw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            {message && <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4" role="alert">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4" role="alert">{error}</div>}

            <div ref={ref} className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={columns}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                />
            </div>
        </div>
    );
}