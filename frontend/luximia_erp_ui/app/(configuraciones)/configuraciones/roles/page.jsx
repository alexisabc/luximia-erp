// app/configuraciones/roles/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// 1. Importa todo lo necesario
import { getGroups, getPermissions, createGroup, updateGroup, deleteGroup } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import { translatePermission, translateModel } from '@/utils/permissions';
import Loader from '@/components/loaders/Spinner';

// --- Constantes de Configuración ---

const ROLES_COLUMNAS_DISPLAY = [
    { header: 'Nombre del Rol', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span> },
    { header: 'Permisos Asignados', render: (row) => `${row.permissions.length} permisos` },
];

export default function RolesPage() {
    const { hasPermission } = useAuth();
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para los modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estados para la gestión de datos
    const [formData, setFormData] = useState({ name: '', permissions: [] });
    const [editingGroup, setEditingGroup] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const groupPermissions = (perms) => {
        const byModel = {};
        perms.forEach(p => {
            const model = p['content_type__model'];
            if (!byModel[model]) byModel[model] = [];
            byModel[model].push({ value: p.id, label: translatePermission(p) });
        });
        return Object.entries(byModel).map(([model, options]) => ({
            label: translateModel(model),
            options,
        }));
    };

    // Define los campos del formulario dinámicamente
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
            const [groupsRes, permissionsRes] = await Promise.all([getGroups(), getPermissions()]);
            setGroups(groupsRes.data);
            setPermissions(permissionsRes.data);
            setPermissionGroups(groupPermissions(permissionsRes.data));
        } catch (err) {
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, []);

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

    const openModalForCreate = () => {
        setEditingGroup(null);
        setFormData({ name: '', permissions: [] });
        setIsFormModalOpen(true);
    };

    const openModalForEdit = (group) => {
        setEditingGroup(group);
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
            await deleteGroup(itemToDelete); // Necesitarás crear esta función en api.js
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
            if (editingGroup) {
                await updateGroup(editingGroup.id, formData);
            } else {
                await createGroup(formData);
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el rol.');
        }
    };

    if (loading) return <Loader className="p-8" />;

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Roles</h1>
                {hasPermission('cxc.add_group') && (
                    <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        + Nuevo Rol
                    </button>
                )}
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

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Rol"
                message="¿Estás seguro de que deseas desactivar este Rol? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}