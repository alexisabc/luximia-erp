'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPlanesPago, createPlanPago, getClientes, getUPEs, importarPlanesPago, exportPlanesPagoExcel, getFormasPago, getMonedas } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ExportModal from '@/components/modals/Export';
import ActionButtons from '@/components/common/ActionButtons';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import Overlay from '@/components/loaders/Overlay';

const PLANPAGO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'cliente', label: 'Cliente' },
    { id: 'upe', label: 'UPE' },
    { id: 'fecha_apartado', label: 'Fecha Apartado' },
    { id: 'apartado_monto', label: 'Monto Apartado' },
    { id: 'moneda_apartado', label: 'Moneda' },
    { id: 'forma_pago_enganche', label: 'Forma de Pago' },
];

export default function PlanesPagoPage() {
    const { hasPermission, authTokens } = useAuth(); // Added authTokens for consistency check
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    // const { ref, pageSize } = useResponsivePageSize(57);
    const pageSize = 10;
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [upes, setUpes] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [monedas, setMonedas] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        PLANPAGO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });
    const fileInputRef = useRef(null);

    const hasInitialData = React.useRef(false);

    const [formData, setFormData] = useState({
        cliente: '',
        upe: '',
        monto_programado: '',
        fecha_programada: new Date().toISOString().split('T')[0],
        moneda: 'USD',
        forma_pago: 'EFECTIVO',
    });

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!size) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const [planesRes, clientesRes, upesRes, formasRes, monedasRes] = await Promise.all([
                getPlanesPago(page, size, { search }),
                getClientes(1, 1000), // Consider optimizing if list is huge
                getUPEs(1, 1000),
                getFormasPago(), // Assuming this returns list now
                getMonedas(1, 1000),
            ]);
            setPageData(planesRes.data);
            setClientes(clientesRes.data.results || clientesRes.data); // Handle both formats just in case
            setUpes(upesRes.data.results || upesRes.data);
            setFormasPago(formasRes.data.results || formasRes.data);
            setMonedas(monedasRes.data.results || monedasRes.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            setError('No se pudieron cargar los planes de pago.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize);
        }
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setFormData({
            cliente: '',
            upe: '',
            monto_programado: '',
            fecha_programada: new Date().toISOString().split('T')[0],
            moneda: 'USD',
            forma_pago: 'EFECTIVO',
        });
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPlanPago(formData);
            setIsFormModalOpen(false);
            fetchData(1, pageSize);
        } catch (err) {
            setError('Error al guardar el plan de pago.');
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await importarPlanesPago(formData);
            fetchData(1, pageSize);
        } catch (err) {
            setError('No se pudieron importar los planes de pago.');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = PLANPAGO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);
        try {
            const response = await exportPlanesPagoExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_planes_pago.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const columns = [
        {
            header: 'Cliente',
            render: row => clientes.find(c => c.id === row.cliente)?.nombre_completo || '',
        },
        {
            header: 'UPE',
            render: row => upes.find(u => u.id === row.upe)?.identificador || '',
        },
        {
            header: 'Fecha',
            render: row => row.fecha_apartado ? new Date(row.fecha_apartado + 'T00:00:00').toLocaleDateString('es-MX') : '',
        },
        {
            header: 'Monto',
            render: row => {
                const moneda = monedas.find(m => m.id === row.moneda_apartado)?.codigo || '';
                const monto = parseFloat(row.apartado_monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
                return `${monto} ${moneda}`;
            },
        },
        {
            header: 'Forma Pago',
            render: row => {
                const forma = formasPago.find(f => f.id === row.forma_pago_enganche);
                return forma ? `${forma.enganche}%/${forma.mensualidades}%/${forma.meses}m/${forma.contra_entrega}%` : '';
            },
        },
    ];

    const formFields = [
        {
            name: 'cliente',
            label: 'Cliente',
            type: 'select',
            required: true,
            options: [{ value: '', label: '--Seleccione--' }, ...clientes.map(c => ({ value: c.id, label: c.nombre_completo }))],
        },
        {
            name: 'upe',
            label: 'UPE',
            type: 'select',
            required: true,
            options: [{ value: '', label: '--Seleccione--' }, ...upes.map(u => ({ value: u.id, label: u.identificador }))],
        },
        { name: 'monto_programado', label: 'Monto Programado', type: 'number', required: true },
        { name: 'fecha_programada', label: 'Fecha Programada', type: 'date', required: true },
        {
            name: 'moneda',
            label: 'Moneda',
            type: 'select',
            required: true,
            options: [
                { value: 'MXN', label: 'MXN' },
                { value: 'USD', label: 'USD' },
            ],
        },
        {
            name: 'forma_pago',
            label: 'Forma de Pago',
            type: 'select',
            options: [
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'TRANSFERENCIA', label: 'Transferencia' },
                { value: 'TARJETA', label: 'Tarjeta' },
            ],
        },
    ];

    if (!hasPermission('contabilidad.view_planpago')) {
        return <div className="p-8">Sin permiso para ver planes de pago.</div>;
    }

    // deleted overlay block

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Planes de Pago
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra los esquemas de pago personalizados por cliente.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {hasPermission('contabilidad.add_planpago') && (
                            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        )}
                        <ActionButtons
                            onCreate={handleCreateClick}
                            canCreate={hasPermission('contabilidad.add_planpago')}
                            onImport={handleImportClick}
                            canImport={hasPermission('contabilidad.add_planpago')}
                            onExport={() => setIsExportModalOpen(true)}
                            canExport={hasPermission('contabilidad.view_planpago')}
                        />
                    </div>
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
            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title="Nuevo Plan de Pago"
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={formFields}
            />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PLANPAGO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />
        </div>
    );
}

