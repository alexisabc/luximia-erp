'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPagos, createPago, getContratos, getMetodosPago, exportPagosExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import Link from 'next/link';
import Overlay from '@/components/loaders/Overlay';
import Modal from '@/components/ui/modals';
import { formatCurrency } from '@/utils/formatters';
import ActionButtons from '@/components/common/ActionButtons';

const PAGO_COLUMNAS_EXPORT = [
    { id: 'fecha_pago', label: 'Fecha de Pago' },
    { id: 'concepto', label: 'Concepto' },
    { id: 'metodo_pago', label: 'Método' },
    { id: 'ordenante', label: 'Ordenante' },
    { id: 'monto_pagado', label: 'Monto Pagado' },
    { id: 'moneda_pagada', label: 'Moneda' },
    { id: 'tipo_cambio', label: 'Tipo de Cambio' },
    { id: 'valor_mxn', label: 'Valor (MXN)' },
    { id: 'banco_origen', label: 'Banco Origen' },
    { id: 'num_cuenta_origen', label: 'Cuenta Origen' },
    { id: 'banco_destino', label: 'Banco Destino' },
    { id: 'cuenta_beneficiaria', label: 'Cuenta Beneficiaria' },
    { id: 'comentarios', label: 'Comentarios' },
];

export default function PagosPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPagoData, setNewPagoData] = useState({});
    const [contratos, setContratos] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!size) return;
        setLoading(true);
        try {
            const res = await getPagos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los pagos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const [contratosRes, metodosRes] = await Promise.all([
                    getContratos(1, 1000),
                    getMetodosPago(),
                ]);
                setContratos(contratosRes.data.results || contratosRes.data);
                setMetodosPago(metodosRes.data);
            } catch (err) {
                // silent fail
            }
        };
        fetchFormData();
    }, []);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleExport = async () => {
        const columnsToExport = PAGO_COLUMNAS_EXPORT.map(c => c.id);
        try {
            const response = await exportPagosExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_pagos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const columns = [
        { header: 'ID', render: row => row.id },
        { header: 'Contrato', render: row => <Link href={`/contratos/${row.contrato}`}>{row.contrato}</Link> },
        { header: 'Método Pago', render: row => row.metodo_pago_nombre || row.metodo_pago },
        { header: 'Fecha Pago', render: row => new Date(row.fecha_pago + 'T00:00:00').toLocaleDateString('es-MX') },
        {
            header: 'Monto Pagado',
            render: (row) => {
                // Si el monto no existe, muestra 'N/A'
                if (!row.monto_pagado) {
                    return 'N/A';
                }
                return formatCurrency(row.monto_pagado, row.moneda);
            },
        },
        { header: 'Tipo Cambio', render: row => row.moneda_pagada === 'USD' ? parseFloat(row.tipo_cambio).toFixed(4) : '1.00' },
        { header: 'Valor MXN', render: row => parseFloat(row.valor_mxn).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) },
        { header: 'Concepto', render: row => row.concepto },
    ];

    const handleCreateClick = () => {
        const today = new Date().toISOString().split('T')[0];
        setNewPagoData({
            contrato: '',
            metodo_pago: '',
            concepto: 'PAGO',
            monto_pagado: '',
            moneda_pagada: 'MXN',
            tipo_cambio: 1,
            fecha_pago: today,
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPagoData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitPago = async (e) => {
        e.preventDefault();
        try {
            await createPago(newPagoData);
            setIsModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('No se pudo registrar el pago.');
        }
    };

    if (!hasPermission('contabilidad.view_pago')) {
        return <div className="p-8">Sin permiso para ver pagos.</div>;
    }

    // deleted overlay block

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Pagos Registrados
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Consulta y registra los pagos recibidos.</p>
                    </div>
                    <ActionButtons
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_pago')}
                        importHref="/importar/pagos"
                        canImport={hasPermission('contabilidad.add_pago')}
                        onExport={handleExport}
                        canExport={hasPermission('contabilidad.view_pago')}
                    />
                </div>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}
            </div>
            <div className="flex-grow min-h-0 relative">
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
                    onSearch={handleSearch}
                />
            </div>
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Pago">
                    <form onSubmit={handleSubmitPago} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Contrato</label>
                            <select name="contrato" value={newPagoData.contrato} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded">
                                <option value="">Selecciona</option>
                                {contratos.map(c => (
                                    <option key={c.id} value={c.id}>{c.id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Método de Pago</label>
                            <select name="metodo_pago" value={newPagoData.metodo_pago} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded">
                                <option value="">Selecciona</option>
                                {metodosPago.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Monto</label>
                                <input type="number" step="0.01" name="monto_pagado" value={newPagoData.monto_pagado} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Moneda</label>
                                <select name="moneda_pagada" value={newPagoData.moneda_pagada} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded">
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Tipo de Cambio</label>
                                <input type="number" step="0.0001" name="tipo_cambio" value={newPagoData.tipo_cambio} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Fecha de Pago</label>
                                <input type="date" name="fecha_pago" value={newPagoData.fecha_pago} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
