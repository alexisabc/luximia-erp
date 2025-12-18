// app/configuraciones/roles/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    getGroups,
    getPermissions,
    createGroup,
    updateGroup,
    deleteGroup,
    getInactiveGroups,
    exportRolesExcel,
    importarRoles,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/tables/ReusableTable';
import FormModal from '@/components/modals/Form';
import ConfirmationModal from '@/components/modals/Confirmation';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import { translatePermission, translateModel, shouldDisplayPermission } from '@/utils/permissions';
import Overlay from '@/components/loaders/Overlay';
import ActionButtons from '@/components/common/ActionButtons';

// --- Constantes de Configuración ---
const ROLES_COLUMNAS_DISPLAY = [
    { header: 'Nombre del Rol', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span> },
    { header: 'Permisos Asignados', render: (row) => `${row.permissions.length} permisos` },
];

const ROLES_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nombre del Rol' },
    { id: 'permissions', label: 'Permisos' },
];

export default function RolesPage() {
    const { hasPermission } = useAuth();
    const [groups, setGroups] = useState([]);
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [permissions, setPermissions] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { authTokens } = useAuth();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [formData, setFormData] = useState({ name: '', permissions: [] });
    const [editingGroup, setEditingGroup] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        ROLES_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const groupPermissions = (perms) => {
        const byModel = {};
        perms.forEach(p => {
            if (!shouldDisplayPermission(p)) return;
            const model = p['content_type__model'];
            if (!byModel[model]) byModel[model] = [];
            byModel[model].push({ value: p.id, label: translatePermission(p) });
        });
        return Object.entries(byModel).map(([model, options]) => ({
            label: translateModel(model),
            options,
        }));
    };

    const ROL_FORM_FIELDS = [
        { name: 'name', label: 'Nombre del Rol', required: true },
        {
            name: 'permissions',
            label: 'Permisos',
            type: 'grouped-checkbox',
            withSelectAll: true,
            groups: permissionGroups,
        },
    ];

    const fetchData = useCallback(
        async (page, size, search = searchQuery) => {
            if (!authTokens?.access) return;
            setLoading(true);
            try {
                const groupsPromise = showInactive
                    ? getInactiveGroups(page, size)
                    : getGroups(page, size, { search });
                const [groupsRes, permissionsRes] = await Promise.all([
                    groupsPromise,
                    getPermissions(),
                ]);

                const groupsResData = groupsRes.data;
                const groupsData = Array.isArray(groupsResData)
                    ? groupsResData
                    : groupsResData.results || [];
                const normalizedGroups = groupsData.map((g) => ({
                    ...g,
                    permissions: g.permissions_data || [],
                }));

                const permissionsData = permissionsRes.data.filter(shouldDisplayPermission);

                setGroups(normalizedGroups);
                setPageData({
                    results: normalizedGroups,
                    count: Array.isArray(groupsResData)
                        ? normalizedGroups.length
                        : groupsResData.count ?? normalizedGroups.length,
                });
                setPermissions(permissionsData);
                setPermissionGroups(groupPermissions(permissionsData));
                setCurrentPage(page);
            } catch (err) {
                setError('No se pudieron cargar los roles.');
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        [showInactive, searchQuery, authTokens?.access]
    );

    useEffect(() => {
        fetchData(1, pageSize);
    }, [fetchData]);



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

    const handleMultiSelectChange = (fieldName, selectedId) => {
        const currentSelection = formData[fieldName] || [];
        const newSelection = currentSelection.includes(selectedId)
            ? currentSelection.filter(id => id !== selectedId)
            : [...currentSelection, selectedId];
        setFormData(prev => ({ ...prev, [fieldName]: newSelection }));
    };

    const handleSelectAll = (fieldName, isChecked, options) => {
        const values = isChecked ? options.map(o => o.value) : [];
        setFormData(prev => ({ ...prev, [fieldName]: values }));
    };

    const handleGroupSelect = (fieldName, isChecked, options) => {
        const values = options.map(o => o.value);
        setFormData(prev => {
            const current = prev[fieldName] || [];
            const newValues = isChecked
                ? Array.from(new Set([...current, ...values]))
                : current.filter(id => !values.includes(id));
            return { ...prev, [fieldName]: newValues };
        });
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = ROLES_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportRolesExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_roles.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const openModalForCreate = () => {
        setEditingGroup(null);
        setFormData({ name: '', permissions: [] });
        setIsFormModalOpen(true);
    };

    const openModalForEdit = (group) => {
        setEditingGroup(group);
        // Ahora se usa la propiedad `id` de los objetos de permiso en la lista
        const groupPermissionIds = group.permissions.map(p => p.id);
        setFormData({ name: group.name, permissions: groupPermissionIds });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (groupId) => {
        setItemToDelete(groupId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteGroup(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el rol. Asegúrate de que no esté en uso.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                // El backend espera una lista de IDs de permisos.
                permissions: formData.permissions,
            };
            if (editingGroup) {
                await updateGroup(editingGroup.id, dataToSubmit);
            } else {
                await createGroup(dataToSubmit);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el rol.');
        }
    };

    // deleted overlay block

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de Roles
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configura los niveles de acceso y permisos.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={openModalForCreate}
                        canCreate={hasPermission('auth.add_group')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('auth.add_group')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport
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
                    data={groups}
                    columns={ROLES_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('auth.change_group') ? openModalForEdit : null,
                        onDelete: hasPermission('auth.delete_group') ? handleDeleteClick : null,
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
                title={editingGroup ? 'Editar Rol' : 'Nuevo Rol'}
                formData={formData}
                onFormChange={handleInputChange}
                handleMultiSelectChange={handleMultiSelectChange}
                handleSelectAll={handleSelectAll}
                handleGroupSelect={handleGroupSelect}
                onSubmit={handleSubmit}
                fields={ROL_FORM_FIELDS}
                submitText="Guardar Rol"
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarRoles}
                onSuccess={() => fetchData(currentPage, pageSize)}
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={ROLES_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Rol Permanentemente"
                message="¡ADVERTENCIA! Esta acción eliminará el rol de forma permanente. ¿Estás seguro de que deseas continuar?"
                confirmText="Eliminar"
            />
        </div>
    );
}
