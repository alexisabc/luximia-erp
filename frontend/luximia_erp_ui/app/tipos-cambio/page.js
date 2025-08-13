'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getTiposCambio, createTipoCambio, updateTipoCambio, deleteTipoCambio } from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import ReusableTable from '../../components/ReusableTable';
import FormModal from '../../components/FormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';

const FORM_FIELDS = [
    { name: 'escenario', label: 'Escenario', required: true },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'valor', label: 'Valor', type: 'number', required: true },
];

export default function TiposCambioPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ escenario: '', fecha: '', valor: '' });
    const [editing, setEditing] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const fetchData = useCallback(async (page, size) => {
        if (!size) return;
        try {
            const res = await getTiposCambio(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los tipos de cambio.');
        }
    }, []);

    useEffect(() => { if (pageSize > 0) { fetchData(1, pageSize); } }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreate = () => {
        setEditing(null);
        setFormData({ escenario: '', fecha: '', valor: '' });
        setIsFormOpen(true);
    };

    const handleEdit = (item) => {
        setEditing(item);
        setFormData({ escenario: item.escenario, fecha: item.fecha, valor: item.valor });
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        setToDelete(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteTipoCambio(toDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el tipo de cambio.');
        } finally {
            setConfirmOpen(false);
            setToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateTipoCambio(editing.id, formData);
            } else {
                await createTipoCambio(formData);
            }
            setIsFormOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el tipo de cambio.');
        }
    };

    const columns = [
        { header: 'Escenario', render: row => row.escenario },
        { header: 'Fecha', render: row => new Date(row.fecha + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { header: 'Valor', render: row => <span className="font-mono text-right dark:text-white">{parseFloat(row.valor).toFixed(4)}</span> },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Tipos de Cambio</h1>
                {hasPermission('cxc.add_tipocambio') && (
                    <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        + Nuevo Tipo de Cambio
                    </button>
                )}
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4" role="alert">{error}</div>}

            <div ref={ref} className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={columns}
                    actions={{
                        onEdit: hasPermission('cxc.change_tipocambio') ? handleEdit : null,
                        onDelete: hasPermission('cxc.delete_tipocambio') ? handleDelete : null,
                    }}
                />
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

            <FormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editing ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio'}
                formData={formData}
                onFormChange={handleChange}
                onSubmit={handleSubmit}
                fields={FORM_FIELDS}
            />

            <ConfirmationModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDelete}
                message="¿Eliminar este tipo de cambio?"
            />
        </div>
    );
}
