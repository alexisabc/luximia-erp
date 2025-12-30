'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import {
    getEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    getInactiveEmpresas,
    exportEmpresasExcel,
    importarEmpresas
} from '@/services/core';
import { useAuth } from '@/context/AuthContext';
import DataTable from '@/components/organisms/DataTable';
import FormModal from '@/components/modals/Form';
import { ConfirmModal } from '@/components/organisms';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import { ActionButtonGroup } from '@/components/molecules';

const EMPRESA_COLUMNAS_DISPLAY = [
    { header: 'Código', render: (row) => <span className="font-bold text-blue-600">{row.codigo}</span> },
    { header: 'Nombre Comercial', render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.nombre_comercial}</span> },
    { header: 'Razón Social', render: (row) => row.razon_social },
    { header: 'RFC', render: (row) => row.rfc },
    { header: 'Ubicación', render: (row) => <span className="text-sm text-gray-500">{row.municipio}, {row.estado}</span> },
];

const EMPRESA_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'codigo', label: 'Código' },
    { id: 'razon_social', label: 'Razón Social' },
    { id: 'nombre_comercial', label: 'Nombre Comercial' },
    { id: 'rfc', label: 'RFC' },
    { id: 'regimen_fiscal', label: 'Régimen Fiscal' },
    { id: 'calle', label: 'Calle' },
    { id: 'municipio', label: 'Municipio' },
    { id: 'estado', label: 'Estado' },
    { id: 'pais', label: 'País' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'email', label: 'Email' },
    { id: 'activo', label: 'Activo' },
];

const EMPRESA_FORM_FIELDS = [
    { name: 'codigo', label: 'Código (Ej: EMP01)', required: true },
    { name: 'nombre_comercial', label: 'Nombre Comercial', required: true },
    { name: 'razon_social', label: 'Razón Social', required: true },
    { name: 'rfc', label: 'RFC', required: true },
    { name: 'regimen_fiscal', label: 'Régimen Fiscal (Clave SAT)' },
    { name: 'calle', label: 'Calle' },
    { name: 'numero_exterior', label: 'No. Exterior' },
    { name: 'numero_interior', label: 'No. Interior' },
    { name: 'colonia', label: 'Colonia' },
    { name: 'codigo_postal', label: 'Código Postal' },
    { name: 'municipio', label: 'Municipio' },
    { name: 'estado', label: 'Estado' },
    { name: 'pais', label: 'País' },
    { name: 'telefono', label: 'Teléfono', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'sitio_web', label: 'Sitio Web', type: 'url' },
    { name: 'serie_factura', label: 'Serie Facturación' },
    { name: 'folio_inicial', label: 'Folio Inicial', type: 'number' },
];

export default function EmpresasPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Data state
    const [formData, setFormData] = useState({});
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        EMPRESA_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        // Validación básica de autenticación
        if (!authTokens?.access) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const params = { search };
            const res = showInactive
                ? await getInactiveEmpresas(page, size, params)
                : await getEmpresas(page, size, params);

            // Normalizar respuesta (algunos endpoints retornan array directo si no hay pagination, pero BaseViewSet usa pagination)
            const data = res.data.results ? res.data : { results: res.data, count: res.data.length };
            setPageData(data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar las empresas. Verifica tus permisos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens?.access, showInactive, searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [fetchData, pageSize]);

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
        setError(null);
        try {
            if (editingEmpresa) {
                await updateEmpresa(editingEmpresa.id, formData);
            } else {
                await createEmpresa(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            setError('Error al guardar la empresa. Revisa los datos.');
        }
    };

    const handleCreateClick = () => {
        setEditingEmpresa(null);
        setFormData({
            codigo: '',
            razon_social: '',
            nombre_comercial: '',
            rfc: '',
            pais: 'México',
            color_primario: '#3B82F6'
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (empresa) => {
        setEditingEmpresa(empresa);
        setFormData({ ...empresa });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEmpresa(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar la empresa.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = EMPRESA_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportEmpresasExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_empresas.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    // Permisos
    // Asumimos que existen core.view_empresa, core.add_empresa, etc.
    // O usamos un permiso genérico de Admin.
    // hasPermission verifica permisos del usuario.
    const canView = hasPermission('core.view_empresa') || true; // Forzamos true si superuser tiene acceso implícito
    const canCreate = hasPermission('core.add_empresa');
    const canEdit = hasPermission('core.change_empresa');
    const canDelete = hasPermission('core.delete_empresa');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="flex-shrink-0 mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            Gestión de Empresas
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Configuración multi-empresa y datos fiscales.
                        </p>
                    </div>
                    <ActionButtonGroup
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={canView}
                        onCreate={handleCreateClick}
                        canCreate={canCreate}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={canCreate}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={canView}
                    />
                </div>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex-grow min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
                <DataTable
                    data={pageData.results}
                    columns={EMPRESA_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: canEdit ? handleEditClick : null,
                        onDelete: canDelete ? handleDeleteClick : null,
                        // onHardDelete: hasPermission('core.hard_delete_empresa') ? handleHardDelete : null,
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
                title={editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={EMPRESA_FORM_FIELDS}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarEmpresas}
                onSuccess={() => fetchData(currentPage, pageSize)}
                templateUrl="/core/empresas/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={EMPRESA_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onExport={handleExport}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Empresa"
                message="¿Estás seguro de desactivar esta empresa? Los usuarios no podrán acceder a ella."
                confirmText="Desactivar"
            />
        </div>
    );
}
