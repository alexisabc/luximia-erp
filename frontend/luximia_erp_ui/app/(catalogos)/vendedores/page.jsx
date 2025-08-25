'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getVendedores, createVendedor, updateVendedor, deleteVendedor, getInactiveVendedores, hardDeleteVendedor, exportVendedoresExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ExportModal from '@/components/ui/modals/Export';
import ActionButtons from '@/components/ui/ActionButtons';

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
    const pageSize = 5;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ tipo: '', nombre_completo: '', email: '', telefono: '' });
    const [editingVendedor, setEditingVendedor] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        VENDEDOR_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;

        if (pageData.results.length > 0) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive ? await getInactiveVendedores() : await getVendedores(page, size);
            if (showInactive) {
                setPageData({ results: res.data, count: res.data.length, next: null, previous: null });
            } else {
                setPageData(res.data);
            }
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
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
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Vendedores</h1>
                <ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={hasPermission('cxc.can_view_inactive_records')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('cxc.add_vendedor')}
                    importHref="/importar/vendedores"
                    canImport={hasPermission('cxc.add_vendedor')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('cxc.view_vendedor')}
                />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex-1">
                {loading ? (
                    <p>Cargando...</p>
                ) : (
                    <ReusableTable
                        data={pageData.results}
                        columns={VENDEDOR_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('cxc.change_vendedor') ? handleEditClick : null,
                            onDelete: hasPermission('cxc.delete_vendedor') ? handleDeleteClick : null,
                            onHardDelete: showInactive && hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null,
                        }}
                    />
                )}
            </div>
            {!showInactive && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pageData.previous || isPaginating}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next || isPaginating}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                fields={VENDEDOR_FORM_FIELDS}
                formData={formData}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
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
                onChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}

