'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getEsquemasComision, createEsquemaComision, updateEsquemaComision, deleteEsquemaComision, getInactiveEsquemasComision, hardDeleteEsquemaComision, exportEsquemasComisionExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import ActionButtons from '@/components/common/ActionButtons';

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

const ESQUEMA_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'esquema', label: 'Esquema' },
    { id: 'escenario', label: 'Escenario' },
    { id: 'porcentaje', label: 'Porcentaje' },
    { id: 'iva', label: 'IVA' },
    { id: 'activo', label: 'Estado' },
];

export default function EsquemasComisionPage() {
    const { hasPermission, authTokens } = useAuth();
    // const { ref, pageSize } = useResponsivePageSize(57); // Changed to fixed page size
    const pageSize = 10;

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ esquema: '', escenario: '', porcentaje: '', iva: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        ESQUEMA_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(
        async (page, size, search = searchQuery) => {
            if (!authTokens || !size || size <= 0) return;

            if (hasInitialData.current) {
                setIsPaginating(true);
            } else {
                setLoading(true);
            }

            try {
                const res = showInactive
                    ? await getInactiveEsquemasComision(page, size)
                    : await getEsquemasComision(page, size, { search });
                setPageData(res.data);
                setCurrentPage(page);
                hasInitialData.current = true;
            } catch (err) {
                setError('No se pudieron cargar los esquemas.');
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        [authTokens?.access, showInactive, searchQuery]
    );

    useEffect(() => {
        fetchData(1, pageSize);
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

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = ESQUEMA_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportEsquemasComisionExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_esquemas_comision.xlsx';
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
                            Gestión de Esquemas de Comisión
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configura las reglas de comisiones para vendedores.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_esquemacomision')}
                        importHref="/importar/esquemas-comision"
                        canImport={hasPermission('contabilidad.add_esquemacomision')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('contabilidad.view_esquemacomision')}
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
                    columns={ESQUEMA_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('contabilidad.change_esquemacomision') ? handleEditClick : null,
                        onDelete: hasPermission('contabilidad.delete_esquemacomision') ? handleDeleteClick : null,
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
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={ESQUEMA_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}

