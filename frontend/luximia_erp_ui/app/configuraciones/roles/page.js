// app/configuraciones/roles/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { getGroups, getPermissions, createGroup, updateGroup } from '../../../services/api';
import Modal from '../../../components/Modal';
import { translatePermission } from '../../../utils/permissions';

export default function RolesPage() {
    const [groups, setGroups] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] });

    const fetchData = async () => {
        try {
            const [groupsRes, permissionsRes] = await Promise.all([getGroups(), getPermissions()]);
            setGroups(groupsRes.data);
            setPermissions(permissionsRes.data);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, name: e.target.value }));
    };

    const handlePermissionChange = (permissionId) => {
        const currentPermissions = formData.permissions || [];
        const newPermissions = currentPermissions.includes(permissionId)
            ? currentPermissions.filter(id => id !== permissionId)
            : [...currentPermissions, permissionId];
        setFormData(prev => ({ ...prev, permissions: newPermissions }));
    };

    const handleSelectAllChange = (e) => {
        if (e.target.checked) {
            const allPermissionIds = permissions.map(p => p.id);
            setFormData(prev => ({ ...prev, permissions: allPermissionIds }));
        } else {
            setFormData(prev => ({ ...prev, permissions: [] }));
        }
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
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Roles</h1>
                <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    + Nuevo Rol
                </button>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Nombre del Rol</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Permisos Asignados</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <tr key={group.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{group.name}</td>
                                <td className="p-4 text-gray-700">{group.permissions.length} permisos</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openModalForEdit(group)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={editingGroup ? 'Editar Rol' : 'Nuevo Rol'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Permisos</label>
                        <div className="mt-2 space-y-2 border rounded-md p-4 h-64 overflow-y-auto">
                            <label className="flex items-center font-semibold border-b pb-2 mb-2">
                                <input type="checkbox"
                                    checked={permissions.length > 0 && formData.permissions?.length === permissions.length}
                                    onChange={handleSelectAllChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Seleccionar / Deseleccionar Todos</span>
                            </label>

                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center">
                                    <input type="checkbox"
                                        checked={formData.permissions?.includes(permission.id) || false}
                                        onChange={() => handlePermissionChange(permission.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{translatePermission(permission)}</span>
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