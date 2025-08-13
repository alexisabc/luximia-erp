'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPlanesPago, createPlanPago, getClientes, getUPEs } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReusableTable from '../../components/ReusableTable';
import FormModal from '../../components/FormModal';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import Loader from '../../components/loaders/Loader';

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
        return <Loader className="p-8" />;
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Planes de Pago</h1>
                {hasPermission('cxc.add_planpago') && (
                    <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        + Nuevo Plan
                    </button>
                )}
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
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next}
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Siguiente
                    </button>
                </div>
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
        </div>
    );
}

