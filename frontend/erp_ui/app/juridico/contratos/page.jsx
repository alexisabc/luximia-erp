// app/(operaciones)/contratos/page.jsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getContratos, exportContratosExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import DataTable from '@/components/organisms/DataTable';
import Loader from '@/components/loaders/Overlay'; // Usamos el Overlay para la carga
import { ActionButtonGroup } from '@/components/molecules';
import { formatCurrency } from '@/utils/formatters';

export default function ContratosPage() {
    const { authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const hasInitialData = useRef(false);

    const [error, setError] = useState(null);

    // Definición de las columnas para ReusableTable
    const CONTRATOS_COLUMNAS = [
        {
            header: 'ID',
            render: (row) => (
                <Link href={`/contratos/${row.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors">
                    #{row.id}
                </Link>
            ),
        },
        {
            header: 'Cliente',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.cliente_nombre || 'N/A'}</span>
        },
        {
            header: 'Proyecto/UPE',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.proyecto_nombre || 'Sin Proyecto'}</span>
                    <span className="text-xs text-gray-500">{row.upe_nombre || 'Sin UPE'}</span>
                </div>
            )
        },
        {
            header: 'Abonos',
            render: (row) => <span className="text-green-600 font-medium">{formatCurrency(row.abonos || 0)}</span>,
        },
        {
            header: 'Saldo Pendiente',
            render: (row) => <span className="text-red-600 font-medium">{formatCurrency(row.saldo_pendiente || 0)}</span>,
        },
        {
            header: 'Estado',
            render: (row) => {
                const statusStyles = {
                    'Activo': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    'Cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    'Pagado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                };
                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${statusStyles[row.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {row.estado || 'Desconocido'}
                    </span>
                );
            }
        }
    ];

    const handleExport = async () => {
        try {
            const response = await exportContratosExcel(['id', 'cliente_nombre', 'proyecto_nombre', 'abonos', 'saldo_pendiente']);
            const blob = new Blob([
                response.data,
            ], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_contratos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const fetchData = useCallback(
        async (page, size, search = searchQuery) => {
            if (!authTokens) return;

            if (hasInitialData.current) {
                setIsPaginating(true);
            } else {
                setLoading(true);
            }

            try {
                const res = await getContratos(page, size, { search });
                setPageData(res.data);
                setCurrentPage(page);
                hasInitialData.current = true;
            } catch (err) {
                setError('No se pudieron cargar los contratos.');
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        [searchQuery, authTokens?.access]
    );

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    // deleted loader block

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de Contratos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra los contratos de venta y sus estados de cuenta.</p>
                    </div>
                    <ActionButtonGroup
                        importHref="/importar/contratos"
                        canImport
                        onExport={handleExport}
                        canExport
                    />
                </div>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}
            </div>
            <div className="flex-grow min-h-0">
                <DataTable
                    data={pageData.results}
                    columns={CONTRATOS_COLUMNAS}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: (p) => fetchData(p, pageSize),
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                    onSearch={handleSearch}
                />
            </div>
        </div>
    );
}