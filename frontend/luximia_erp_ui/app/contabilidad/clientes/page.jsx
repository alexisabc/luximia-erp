// app/clientes/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getInactiveClientes,
    hardDeleteCliente,
    exportClientesExcel,
    importarClientes,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ExportModal from '@/components/ui/modals/Export';
import ImportModal from '@/components/ui/modals/Import';
import ActionButtons from '@/components/common/ActionButtons';


const CLIENTE_COLUMNAS_DISPLAY = [
    { header: 'Nombre Completo', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</span> },
    { header: 'Email', render: (row) => row.email },
    { header: 'Teléfono', render: (row) => row.telefono },
];

const CLIENTE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' }, { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' }, { id: 'telefono', label: 'Teléfono' }, { id: 'activo', label: 'Estado' }
];

const CLIENTE_FORM_FIELDS = [
    { name: 'nombre_completo', label: 'Nombre Completo', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'telefono', label: 'Teléfono', type: 'tel' }
];

export default function ClientesPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        CLIENTE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });
    const [loading, setLoading] = useState(true); // Para la carga inicial
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); // Estado para la búsqueda

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = CLIENTE_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportClientesExcel(columnsToExport, { search: searchQuery });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_clientes.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };


    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (pageData.results.length > 0) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            // Nota: getInactiveClientes podría necesitar actualización en api.js para soportar búsqueda
            const res = showInactive
                ? await getInactiveClientes(page, size, { search })
                : await getClientes(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive, searchQuery]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, formData);
            } else {
                await createCliente(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el cliente.');
        }
    };

    const handleCreateClick = () => {
        setEditingCliente(null);
        setFormData({ nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({ nombre_completo: cliente.nombre_completo, email: cliente.email || '', telefono: cliente.telefono || '' });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (clienteId) => {
        setItemToDelete(clienteId);
        setIsConfirmModalOpen(true);
    };

    // Esta función es la que realmente EJECUTA la eliminación
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteCliente(itemToDelete);
            fetchData(currentPage, pageSize); // Refresca los datos
        } catch (err) {
            setError('Este cliente tiene contratos y no puede ser eliminado.');
        } finally {
            // Cierra el modal y resetea el estado
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteCliente(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    // Función para obtener el estilo del badge según el nombre del proyecto
    const getProjectBadgeStyle = (projectName) => {
        // Puedes añadir más proyectos y colores aquí
        switch (projectName.toLowerCase()) {
            case 'shark tower':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'be towers':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'torre medica':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };


    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Gestión de Clientes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Directorio y administración de clientes.</p>
                </div>
                <ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={hasPermission('contabilidad.view_cliente')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('contabilidad.add_cliente')}
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission('contabilidad.add_cliente')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport
                />
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="flex-grow min-h-0">
                {/* ### 4. Usa ReusableTable con la prop 'actions' ### */}
                <ReusableTable
                    data={pageData.results}
                    columns={CLIENTE_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('contabilidad.change_cliente') ? handleEditClick : null,
                        onDelete: hasPermission('contabilidad.delete_cliente') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
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
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={CLIENTE_FORM_FIELDS}
                submitText="Guardar Cliente"
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarClientes}
                onSuccess={() => fetchData(currentPage, pageSize)}
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={CLIENTE_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Cliente"
                message="¿Estás seguro de que deseas desactivar este Cliente? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}