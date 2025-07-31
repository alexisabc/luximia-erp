'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPagos } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import Link from 'next/link';
import Loader from '../../components/Loader';

export default function PagosPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (page, size, preserveData = false) => {
        if (!size) return;
        preserveData ? setIsPaginating(true) : setLoading(true);
        try {
            const res = await getPagos(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los pagos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, []);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize, true);
        }
    };

    const columns = [
        { header: 'ID', render: row => row.id },
        { header: 'Contrato', render: row => <Link href={`/contratos/${row.contrato}`}>{row.contrato}</Link> },
        { header: 'Fecha Pago', render: row => new Date(row.fecha_pago + 'T00:00:00').toLocaleDateString('es-MX') },
        { header: 'Monto Pagado', render: row => `${parseFloat(row.monto_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${row.moneda_pagada}` },
        { header: 'Tipo Cambio', render: row => row.moneda_pagada === 'USD' ? parseFloat(row.tipo_cambio).toFixed(4) : '1.00' },
        { header: 'Valor MXN', render: row => parseFloat(row.valor_mxn).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) },
        { header: 'Concepto', render: row => row.concepto },
    ];

    if (!hasPermission('cxc.view_pago')) {
        return <div className="p-8">Sin permiso para ver pagos.</div>;
    }

    if (loading && !isPaginating) {
        return <Loader className="p-8" />;
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Pagos Registrados</h1>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            <div ref={ref} className="flex-grow min-h-0 relative">
                {isPaginating && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                        <Loader overlay={false} />
                    </div>
                )}
                <ReusableTable data={pageData.results} columns={columns} />
            </div>
            <div className="flex-shrink-0 flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Total: {pageData.count} registros
                </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pageData.previous}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
