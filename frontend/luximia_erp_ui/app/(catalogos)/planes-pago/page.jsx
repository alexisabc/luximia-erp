'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPlanesPago, createPlanPago, getClientes, getUPEs, importarPlanesPago, exportPlanesPagoExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ExportModal from '@/components/ui/modals/Export';
import ActionButtons from '@/components/ui/ActionButtons';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import Overlay from '@/components/loaders/Overlay';

const PLANPAGO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'cliente', label: 'Cliente' },
    { id: 'upe', label: 'UPE' },
    { id: 'fecha_programada', label: 'Fecha Programada' },
    { id: 'monto_programado', label: 'Monto Programado' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'forma_pago', label: 'Forma de Pago' },
];

export default function PlanesPagoPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [upes, setUpes] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        PLANPAGO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        cliente: '',
        upe: '',
        monto_programado: '',
        fecha_programada: new Date().toISOString().split('T')[0],
        moneda: 'USD',
        forma_pago: 'EFECTIVO',
    });

    const fetchData = useCallback(async (page, size) => {
        if (!size) return;
        pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
        try {
            const [planesRes, clientesRes, upesRes] = await Promise.all([
                getPlanesPago(page, size),
                getClientes(1, 1000),
                getUPEs(1, 1000),
            ]);
            setPageData(planesRes.data);
            setClientes(clientesRes.data.results);
            setUpes(upesRes.data.results);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los planes de pago.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [pageData.results.length]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize);
        }
    };

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
        { header: 'Cliente', render: row => row.cliente_nombre },
        { header: 'UPE', render: row => row.upe_identificador },
        { header: 'Fecha', render: row => new Date(row.fecha_programada + 'T00:00:00').toLocaleDateString('es-MX') },
        { header: 'Monto', render: row => `${parseFloat(row.monto_programado).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${row.moneda}` },
        { header: 'Forma Pago', render: row => row.forma_pago || '' },
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

    if (!hasPermission('cxc.view_planpago')) {
        return <div className="p-8">Sin permiso para ver planes de pago.</div>;
    }

    if (loading && !isPaginating) {
        return <Overlay show />;
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Planes de Pago</h1>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.add_planpago') && (
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    )}
                    <ActionButtons
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('cxc.add_planpago')}
                        onImport={handleImportClick}
                        canImport={hasPermission('cxc.add_planpago')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('cxc.view_planpago')}
                    />
                </div>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            <div ref={ref} className="flex-grow min-h-0 relative">
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

