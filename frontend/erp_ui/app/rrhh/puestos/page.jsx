'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getPuestos,
    createPuesto,
    updatePuesto,
    deletePuesto,
    getInactivePuestos,
    hardDeletePuesto,
    getAllDepartamentos,
    exportPuestosExcel,
    importarPuestos // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

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

const PUESTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'departamento_nombre', label: 'Departamento' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'activo', label: 'Estado' },
];

export default function PuestosPage() {
    const { hasPermission, authTokens } = useAuth();

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added

    const [formData, setFormData] = useState({ nombre: '', descripcion: '', departamento: '' });
    const [formFields, setFormFields] = useState(PUESTO_FORM_FIELDS_TEMPLATE);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        PUESTO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;

    });

    const hasInitialData = React.useRef(false);

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

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        // Use ref to decide loader type to avoid adding state to dependencies
        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive ? await getInactivePuestos(page, size, { search }) : await getPuestos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true; // Mark as having data
        } catch (err) {
            setError('No se pudieron cargar los puestos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    // Effect 1: Fetch departments once on mount
    useEffect(() => {
        fetchDepartamentos();
    }, [fetchDepartamentos]);

    // Effect 2: Fetch data when pagination/filters change
    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

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

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = PUESTO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportPuestosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_puestos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de Puestos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configura los roles y posiciones de la organización.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_inactive_puesto')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_puesto')}
                        onImport={() => setIsImportModalOpen(true)} // Updated
                        canImport={hasPermission('rrhh.add_puesto')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('rrhh.view_puesto')}
                    />
                </div>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={PUESTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('rrhh.change_puesto') ? handleEditClick : null,
                        onDelete: hasPermission('rrhh.delete_puesto') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('rrhh.hard_delete_puesto') ? handleHardDelete : null,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                    onSearch={handleSearch}
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

            <ImportModal // Added
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarPuestos}
                onSuccess={() => fetchData(currentPage, pageSize)}
                templateUrl="/rrhh/puestos/exportar-plantilla/"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Seguro que deseas eliminar este puesto?"
            />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PUESTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}
