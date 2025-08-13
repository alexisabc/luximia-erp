'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getEsquemasComision, createEsquemaComision, updateEsquemaComision, deleteEsquemaComision, getInactiveEsquemasComision, hardDeleteEsquemaComision } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';

const ESQUEMA_COLUMNAS_DISPLAY = [
    { header: 'Esquema', render: (row) => <span className="text-gray-900 dark:text-white">{row.esquema}</span> },
    { header: 'Escenario', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.escenario}</span> },
    { header: 'Porcentaje', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.porcentaje}%</span> },
    { header: 'IVA', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.iva}%</span> },
];

const ESQUEMA_FORM_FIELDS = [
    { name: 'esquema', label: 'Esquema', required: true },
    { name: 'escenario', label: 'Escenario', required: true },
    { name: 'porcentaje', label: 'Porcentaje', type: 'number', required: true },
    { name: 'iva', label: 'IVA', type: 'number', required: true },
];

export default function EsquemasComisionPage() {
    const { hasPermission, authTokens } = useAuth();
    const pageSize = useResponsivePageSize();

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ esquema: '', escenario: '', porcentaje: '', iva: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
        try {
            const res = showInactive ? await getInactiveEsquemasComision() : await getEsquemasComision(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los esquemas.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreateClick = () => {
        setEditingItem(null);
        setFormData({ esquema: '', escenario: '', porcentaje: '', iva: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormData({
            esquema: item.esquema,
            escenario: item.escenario,
            porcentaje: item.porcentaje,
            iva: item.iva,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEsquemaComision(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el esquema.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteEsquemaComision(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingItem) {
                await updateEsquemaComision(editingItem.id, formData);
            } else {
                await createEsquemaComision(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el esquema.');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Esquemas de Comisión</h1>
                    <div className="flex items-center space-x-3">
                        {hasPermission('cxc.can_view_inactive_records') && (
                            <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                                {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                            </button>
                        )}
                        {hasPermission('cxc.add_esquemacomision') && (
                            <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                + Nuevo Esquema
                            </button>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={ESQUEMA_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_esquemacomision') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_esquemacomision') ? handleDeleteClick : null,
                        onHardDelete: showInactive && hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null,
                    }}
                />
                {pageData.count > 0 && pageSize > 0 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {[...Array(Math.ceil(pageData.count / pageSize)).keys()].map((page) => (
                            <button
                                key={page + 1}
                                onClick={() => handlePageChange(page + 1)}
                                className={`px-3 py-1 rounded ${currentPage === page + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'}`}
                            >
                                {page + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSubmit}
                title={editingItem ? 'Editar Esquema' : 'Nuevo Esquema'}
                fields={ESQUEMA_FORM_FIELDS}
                formData={formData}
                onChange={handleInputChange}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Estás seguro de eliminar este esquema?"
            />
        </div>
    );
}

