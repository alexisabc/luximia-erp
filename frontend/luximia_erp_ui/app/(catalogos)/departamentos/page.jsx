'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getDepartamentos,
    createDepartamento,
    updateDepartamento,
    deleteDepartamento,
    getInactiveDepartamentos,
    hardDeleteDepartamento,
    exportDepartamentosExcel
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import { Download, Upload } from 'lucide-react';

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
    const pageSize = 5;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        pageData.results.length > 0 ? setIsPaginating(true) : setLoading(true);
        try {
            const res = showInactive ? await getInactiveDepartamentos() : await getDepartamentos(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los departamentos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive]);

    useEffect(() => { fetchData(1, pageSize); }, [fetchData]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };

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
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Departamentos</h1>
                    <div className="flex items-center space-x-3">
                        {hasPermission('cxc.can_view_inactive_records') && (
                            <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                                {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                            </button>
                        )}
                        {hasPermission('cxc.add_departamento') && (
                            <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                + Nuevo Departamento
                            </button>
                        )}
                        {hasPermission('cxc.add_departamento') && (
                            <Link
                                href="/importar/departamentos"
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2 rounded-lg transition-colors duration-200"
                                title="Importar desde Excel"
                            >
                                <Upload className="h-6 w-6" />
                            </Link>
                        )}
                        {hasPermission('cxc.view_departamento') && (
                            <button
                                onClick={() => setIsExportModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg transition-colors duration-200"
                                title="Exportar a Excel"
                            >
                                <Download className="h-6 w-6" />
                            </button>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={DEPARTAMENTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_departamento') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_departamento') ? handleDeleteClick : null,
                        onHardDelete: showInactive && hasPermission('cxc.delete_departamento') ? handleHardDelete : null,
                    }}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    totalCount={pageData.count}
                    onPageChange={handlePageChange}
                    loading={loading}
                    isPaginating={isPaginating}
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
