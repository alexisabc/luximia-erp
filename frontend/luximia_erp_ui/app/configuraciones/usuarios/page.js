// app/configuraciones/usuarios/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, getGroups, createUser, updateUser } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/Modal';
import ReusableTable from '../../../components/ReusableTable';

export default function UsuariosPage() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true,
        groups: []
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, groupsRes] = await Promise.all([getUsers(), getGroups()]);
            setUsers(usersRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleGroupChange = (groupId) => {
        const currentGroups = formData.groups || [];
        const newGroups = currentGroups.includes(groupId)
            ? currentGroups.filter(id => id !== groupId)
            : [...currentGroups, groupId];
        setFormData(prev => ({ ...prev, groups: newGroups }));
    };

    const openModalForCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', first_name: '', last_name: '', is_active: true, groups: [] });
        setIsModalOpen(true);
    };

    const openModalForEdit = (user) => {
        setEditingUser(user);
        const userGroupIds = user.groups.map(groupName => {
            const group = groups.find(g => g.name === groupName);
            return group ? group.id : null;
        }).filter(id => id !== null);
        setFormData({ ...user, password: '', groups: userGroupIds });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
            delete dataToSubmit.password;
        }

        try {
            if (editingUser) {
                await updateUser(editingUser.id, dataToSubmit);
            } else {
                await createUser(dataToSubmit);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el usuario.');
            console.error(err);
        }
    };

    const columns = [
        { header: 'Usuario', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.username}</span> },
        { header: 'Nombre', render: (row) => `${row.first_name} ${row.last_name}` },
        { header: 'Roles', render: (row) => row.groups.join(', ') },
        { header: 'Estado', render: (row) => row.is_active ? <span className="text-green-500">Activo</span> : <span className="text-red-500">Inactivo</span> },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right">
                    {hasPermission('cxc.change_user') && <button onClick={() => openModalForEdit(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>}
                </div>
            )
        }
    ];

    if (loading) return <div className="p-8">Cargando datos...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Usuarios</h1>
                {hasPermission('cxc.add_user') && (
                    <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        + Nuevo Usuario
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <ReusableTable data={users} columns={columns} />

            <Modal title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* ### INICIA SECCIÓN CORREGIDA ### */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña ({editingUser ? 'Dejar en blanco para no cambiar' : 'Requerida'})</label>
                        <input type="password" name="password" value={formData.password || ''} onChange={handleInputChange} required={!editingUser} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Roles (Grupos)</label>
                        <div className="mt-2 space-y-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                            {groups.length > 0 ? groups.map(group => (
                                <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.groups?.includes(group.id) || false}
                                        onChange={() => handleGroupChange(group.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{group.name}</span>
                                </label>
                            )) : <p className="text-sm text-gray-500">No hay roles disponibles.</p>}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        <label className="ml-2 block text-sm font-medium text-gray-700">Usuario Activo</label>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Usuario</button>
                    </div>
                </form>
                {/* ### FIN SECCIÓN CORREGIDA ### */}
            </Modal>
        </div>
    );
}