// app/configuraciones/roles/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { getGroups, getPermissions, createGroup, updateGroup } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal';
import ReusableTable from '../../../components/ReusableTable'; // <-- 1. Usamos la tabla reutilizable
import { translatePermission } from '../../../utils/permissions';

export default function RolesPage() {
    const { hasPermission } = useAuth();
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsRes, permissionsRes] = await Promise.all([getGroups(), getPermissions()]);
            setGroups(groupsRes.data);
            setPermissions(permissionsRes.data);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, name: e.target.value }));

    const handlePermissionChange = (permissionId) => {
        const currentPermissions = formData.permissions || [];
        const newPermissions = currentPermissions.includes(permissionId)
            ? currentPermissions.filter(id => id !== permissionId)
            : [...currentPermissions, permissionId];
        setFormData(prev => ({ ...prev, permissions: newPermissions }));
    };

    const handleSelectAllChange = (e) => {
        const allPermissionIds = e.target.checked ? permissions.map(p => p.id) : [];
        setFormData(prev => ({ ...prev, permissions: allPermissionIds }));
    };

    const openModalForCreate = () => {
        setEditingGroup(null);
        setFormData({ name: '', permissions: [] });
        setIsModalOpen(true);
    };

    const openModalForEdit = (group) => {
        setEditingGroup(group);
        const groupPermissionIds = group.permissions.map(p => p.id);
        setFormData({ name: group.name, permissions: groupPermissionIds });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGroup) {
                await updateGroup(editingGroup.id, formData);
            } else {
                await createGroup(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el rol.');
        }
    };

    // ### 2. Definimos las columnas para ReusableTable ###
    const columns = [
        {
            header: 'Nombre del Rol',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
        },
        {
            header: 'Permisos Asignados',
            render: (row) => `${row.permissions.length} de ${permissions.length}`
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right">
                    {hasPermission('cxc.change_group') && <button onClick={() => openModalForEdit(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>}
                </div>
            )
        }
    ];

    if (loading) return <div className="p-8">Cargando roles...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Roles</h1>
                {hasPermission('cxc.add_group') && (
                    <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        + Nuevo Rol
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <ReusableTable data={groups} columns={columns} />

            <Modal title={editingGroup ? 'Editar Rol' : 'Nuevo Rol'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* ### 3. Aplicamos los estilos al formulario ### */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Permisos</label>
                        <div className="mt-2 space-y-2 border rounded-md p-4 h-64 overflow-y-auto">
                            <label className="flex items-center font-semibold border-b pb-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={permissions.length > 0 && formData.permissions?.length === permissions.length}
                                    onChange={handleSelectAllChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-800">Seleccionar / Deseleccionar Todos</span>
                            </label>

                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions?.includes(permission.id) || false}
                                        onChange={() => handlePermissionChange(permission.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{translatePermission(permission)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Rol</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}