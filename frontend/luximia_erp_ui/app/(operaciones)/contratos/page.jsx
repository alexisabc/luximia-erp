// app/(operaciones)/contratos/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getContratos, exportContratosExcel } from '@/services/api';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import Loader from '@/components/loaders/Overlay'; // Usamos el Overlay para la carga
import ActionButtons from '@/components/ui/ActionButtons';

export default function ContratosPage() {
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);

    // Definición de las columnas para ReusableTable
    const CONTRATOS_COLUMNAS = [
        {
            header: 'ID',
            render: (row) => (
                <Link href={`/contratos/${row.id}`} className="text-blue-600 dark:text-blue-400 underline">
                    #{row.id}
                </Link>
            ),
        },
        {
            header: 'Abonos',
            accessor: 'abonos', // Si el campo es directo, puedes usar accessor
        },
        {
            header: 'Saldo Pendiente',
            accessor: 'saldo_pendiente', // Usa accessor
        },
    ];

    const handleExport = async () => {
        try {
            const response = await exportContratosExcel(['id', 'abonos', 'saldo_pendiente']);
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
            console.error('No se pudo exportar el archivo.', err);
        }
    };

    const fetchData = useCallback(
        async (page, size, isPageChange = false) => {
            isPageChange ? setIsPaginating(true) : setLoading(true);
            try {
                const res = await getContratos(page, size);
                setPageData(res.data);
                setCurrentPage(page);
            } catch (err) {
                console.error('No se pudieron cargar los contratos', err);
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchData(1, pageSize);
    }, [fetchData]);

    if (loading && !isPaginating) {
        return <Loader show />;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Contratos</h1>
                <ActionButtons
                    importHref="/importar/contratos"
                    canImport
                    onExport={handleExport}
                    canExport
                />
            </div>
            <ReusableTable
                data={pageData.results}
                columns={CONTRATOS_COLUMNAS}
                search={true}
                pagination={{
                    currentPage,
                    totalCount: pageData.count,
                    pageSize,
                    onPageChange: (p) => fetchData(p, pageSize, true),
                }}
                loading={loading}
                isPaginating={isPaginating}
            />
        </div>
    );
}