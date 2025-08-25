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
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import ImportModal from '@/components/ui/modals/Import';
import { translatePermission, translateModel, shouldDisplayPermission } from '@/utils/permissions';
import Overlay from '@/components/loaders/Overlay';
import ActionButtons from '@/components/ui/ActionButtons';

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
    const [permissions, setPermissions] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const groupsPromise = showInactive ? getInactiveGroups() : getGroups();
            const [groupsRes, permissionsRes] = await Promise.all([
                groupsPromise,
                getPermissions(),
            ]);

            // La API devuelve los permisos de cada grupo en el campo
            // `permissions_data`.  El resto del componente espera un
            // arreglo `permissions`, así que normalizamos la respuesta
            // para evitar errores al renderizar.
            const groupsData = groupsRes.data.map((g) => ({
                ...g,
                permissions: g.permissions_data || [],
            }));

            const permissionsData = permissionsRes.data.filter(shouldDisplayPermission);

            setGroups(groupsData);
            setPermissions(permissionsData);
            setPermissionGroups(groupPermissions(permissionsData));
        } catch (err) {
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, [showInactive]);

    useEffect(() => { fetchData(); }, [fetchData]);

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
            fetchData();
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
            fetchData();
        } catch (err) {
            setError('Error al guardar el rol.');
        }
    };

    if (loading) return <Overlay show />;

    return (
        <div className="p-8 h-full flex flex-col">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Roles</h1>
            <ActionButtons
                showInactive={showInactive}
                onToggleInactive={() => setShowInactive(!showInactive)}
                canToggleInactive={hasPermission('cxc.can_view_inactive_records')}
                onCreate={openModalForCreate}
                canCreate={hasPermission('cxc.add_group')}
                onImport={() => setIsImportModalOpen(true)}
                canImport={hasPermission('cxc.add_group')}
                onExport={() => setIsExportModalOpen(true)}
                canExport
            />
        </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={groups}
                    columns={ROLES_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_group') ? openModalForEdit : null,
                        onDelete: hasPermission('cxc.delete_group') ? handleDeleteClick : null,
                    }}
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
                onSuccess={() => fetchData()}
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
