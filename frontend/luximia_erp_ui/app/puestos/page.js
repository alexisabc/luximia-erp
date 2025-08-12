'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPuestos, createPuesto, updatePuesto, deletePuesto, getInactivePuestos, hardDeletePuesto, getAllDepartamentos } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReusableTable from '../../components/ReusableTable';
import FormModal from '../../components/FormModal';
import ConfirmationModal from '../../components/ConfirmationModal';

const PUESTO_COLUMNAS_DISPLAY = [
    { header: 'Nombre', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre}</span> },
    { header: 'Departamento', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.departamento_nombre}</span> },
    { header: 'Descripción', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.descripcion}</span> },
];

const PUESTO_FORM_FIELDS_TEMPLATE = [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'departamento', label: 'Departamento', type: 'select', options: [] },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
];

export default function PuestosPage() {
    const { hasPermission, authTokens } = useAuth();

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [error, setError] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [formData, setFormData] = useState({ nombre: '', descripcion: '', departamento: '' });
    const [formFields, setFormFields] = useState(PUESTO_FORM_FIELDS_TEMPLATE);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const fetchDepartamentos = useCallback(async () => {
        try {
            const { data } = await getAllDepartamentos(); // o getDepartamentos()
            const items = Array.isArray(data) ? data : (data?.results ?? []);
            setFormFields(prevFields =>
                prevFields.map(field =>
                    field.name === 'departamento'
                        ? { ...field, options: items.map(d => ({ value: d.id, label: d.nombre })) }
                        : field
                )
            );
        } catch (e) {
            console.error('Error cargando departamentos', e);
            setFormFields(prevFields =>
                prevFields.map(field =>
                    field.name === 'departamento' ? { ...field, options: [] } : field
                )
            );
        }
    }, []);

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
        try {
            const res = showInactive ? await getInactivePuestos() : await getPuestos(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los puestos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchDepartamentos();
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData, fetchDepartamentos]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreateClick = () => {
        setEditingItem(null);
        setFormData({ nombre: '', descripcion: '', departamento: formFields.find(f => f.name === 'departamento').options[0]?.value || '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (puesto) => {
        setEditingItem(puesto);
        setFormData({ nombre: puesto.nombre, descripcion: puesto.descripcion || '', departamento: puesto.departamento });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deletePuesto(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el puesto.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeletePuesto(id);
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
                await updatePuesto(editingItem.id, formData);
            } else {
                await createPuesto(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el puesto.');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Puestos</h1>
                    <div className="flex items-center space-x-3">
                        {hasPermission('cxc.can_view_inactive_records') && (
                            <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                                {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                            </button>
                        )}
                        {hasPermission('cxc.add_puesto') && (
                            <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                + Nuevo Puesto
                            </button>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={PUESTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_puesto') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_puesto') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSubmit}
                title={editingItem ? 'Editar Puesto' : 'Nuevo Puesto'}
                formData={formData}
                onFormChange={handleInputChange}
                fields={formFields}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Seguro que deseas eliminar este puesto?"
            />
        </div>
    );
}

