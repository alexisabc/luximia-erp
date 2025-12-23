'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getVendedores, createVendedor, updateVendedor, deleteVendedor, getInactiveVendedores, hardDeleteVendedor,
    exportVendedoresExcel,
    importarVendedores // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ReusableTable from '@/components/tables/ReusableTable';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

const VENDEDOR_COLUMNAS_DISPLAY = [
    { header: 'Tipo', render: (row) => row.tipo },
    { header: 'Nombre Completo', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</span> },
    { header: 'Email', render: (row) => row.email },
    { header: 'Teléfono', render: (row) => row.telefono },
];

const VENDEDOR_FORM_FIELDS = [
    { name: 'tipo', label: 'Tipo', required: true },
    { name: 'nombre_completo', label: 'Nombre Completo', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'tel' },
];

const VENDEDOR_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'activo', label: 'Estado' },
];

export default function VendedoresPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Increased page size
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added
    const [formData, setFormData] = useState({ tipo: '', nombre_completo: '', email: '', telefono: '' });
    const [editingVendedor, setEditingVendedor] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); // Search state
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        VENDEDOR_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            // Note: Assuming getInactiveVendedores supports search or needed logic changes in api.js
            const res = showInactive
                ? await getInactiveVendedores(page, size, { search })
                : await getVendedores(page, size, { search });

            setPageData(showInactive ? { results: res.data, count: res.data.length } : res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            setError('No se pudieron cargar los vendedores.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

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

    // ... rest of handlers ...
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVendedor) {
                await updateVendedor(editingVendedor.id, formData);
            } else {
                await createVendedor(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el vendedor.');
        }
    };

    const handleCreateClick = () => {
        setEditingVendedor(null);
        setFormData({ tipo: '', nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (vendedor) => {
        setEditingVendedor(vendedor);
        setFormData({ tipo: vendedor.tipo, nombre_completo: vendedor.nombre_completo, email: vendedor.email || '', telefono: vendedor.telefono || '' });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (vendedorId) => {
        setItemToDelete(vendedorId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteVendedor(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el vendedor.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteVendedor(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = VENDEDOR_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportVendedoresExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_vendedores.xlsx';
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
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Gestión de Vendedores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra el equipo comercial y sus datos de contacto.</p>
                </div>
                <ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={hasPermission('contabilidad.view_cliente')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('contabilidad.add_vendedor')}
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission('contabilidad.add_vendedor')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('contabilidad.view_vendedor')}
                />
            </div>
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}
            <div className="flex-1">
                <ReusableTable
                    data={pageData.results}
                    columns={VENDEDOR_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('contabilidad.change_vendedor') ? handleEditClick : null,
                        onDelete: hasPermission('contabilidad.delete_vendedor') ? handleDeleteClick : null,
                        onHardDelete: showInactive && hasPermission('contabilidad.delete_user') ? handleHardDelete : null,
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
                title={editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                fields={VENDEDOR_FORM_FIELDS}
                formData={formData}
                onFormChange={handleInputChange} // Fixed prop
                onSubmit={handleSubmit}
            />

            <ImportModal // Added
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarVendedores}
                onSuccess={() => fetchData(currentPage, pageSize)}
                templateUrl="/contabilidad/vendedores/exportar-plantilla/"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Está seguro de eliminar este vendedor?"
            />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={VENDEDOR_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}

