'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getDepartamentos,
    createDepartamento,
    updateDepartamento,
    deleteDepartamento,
    getInactiveDepartamentos,
    hardDeleteDepartamento,
    exportDepartamentosExcel,
    importarDepartamentos
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import ImportModal from '@/components/ui/modals/Import';
import ActionButtons from '@/components/common/ActionButtons';

const DEPARTAMENTO_COLUMNAS_DISPLAY = [
    { header: 'Nombre', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre}</span> },
];

const DEPARTAMENTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'activo', label: 'Estado' },
];

const DEPARTAMENTO_FORM_FIELDS = [
    { name: 'nombre', label: 'Nombre', required: true },
];

export default function DepartamentosPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre: '' });
    const [editingDepartamento, setEditingDepartamento] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        DEPARTAMENTO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveDepartamentos(page, size, { search })
                : await getDepartamentos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            setError('No se pudieron cargar los departamentos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => { fetchData(1, pageSize); }, [pageSize, fetchData]);

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
        setEditingDepartamento(null);
        setFormData({ nombre: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (departamento) => {
        setEditingDepartamento(departamento);
        setFormData({ nombre: departamento.nombre });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteDepartamento(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el departamento.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteDepartamento(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingDepartamento) {
                await updateDepartamento(editingDepartamento.id, formData);
            } else {
                await createDepartamento(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el departamento.');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = DEPARTAMENTO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportDepartamentosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_departamentos.xlsx';
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
                            Gestión de Departamentos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Organiza la estructura interna de la empresa.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_inactive_departamento')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_departamento')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('rrhh.add_departamento')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('rrhh.view_departamento')}
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
                    columns={DEPARTAMENTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('rrhh.change_departamento') ? handleEditClick : null,
                        onDelete: hasPermission('rrhh.delete_departamento') ? handleDeleteClick : null,
                        onHardDelete: showInactive && hasPermission('rrhh.delete_departamento') ? handleHardDelete : null,
                    }}
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
                title={editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSubmit}
                fields={DEPARTAMENTO_FORM_FIELDS}
                formData={formData}
                onChange={handleInputChange}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarDepartamentos}
                onSuccess={() => fetchData(currentPage, pageSize)}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Estás seguro de que deseas eliminar este departamento?"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={DEPARTAMENTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}
