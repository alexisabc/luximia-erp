// app/configuraciones/usuarios/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, getGroups, createUser, updateUser } from '../../../services/api';
import Modal from '../../../components/Modal';

export default function UsuariosPage() {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]); // Para la lista de roles
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

    const fetchData = async () => {
        try {
            // Pedimos los usuarios y los grupos (roles) al mismo tiempo
            const [usersRes, groupsRes] = await Promise.all([getUsers(), getGroups()]);
            setUsers(usersRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleGroupChange = (groupId) => {
        const currentGroups = formData.groups || [];
        const newGroups = currentGroups.includes(groupId)
            ? currentGroups.filter(id => id !== groupId) // Si ya está, lo quitamos
            : [...currentGroups, groupId]; // Si no está, lo añadimos
        setFormData(prev => ({ ...prev, groups: newGroups }));
    };

    const openModalForCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', first_name: '', last_name: '', is_active: true, groups: [] });
        setIsModalOpen(true);
    };

    const openModalForEdit = (user) => {
        setEditingUser(user);
        // Extraemos solo los IDs de los grupos a los que pertenece el usuario
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
        // No enviamos la contraseña si el campo está vacío (al editar)
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
            fetchData(); // Recargamos los datos para ver los cambios
        } catch (err) {
            setError('Error al guardar el usuario.');
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios y Roles</h1>
                <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    + Nuevo Usuario
                </button>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Roles (Grupos)</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{user.username}</td>
                                <td className="p-4 text-gray-700">{user.email}</td>
                                <td className="p-4 text-gray-700">{`${user.first_name} ${user.last_name}`}</td>
                                <td className="p-4 text-gray-700">
                                    {user.groups.map(group => <span key={group} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{group}</span>)}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openModalForEdit(user)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                    {/* El botón de eliminar se puede añadir después si se necesita */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" value={formData.username || ''} onChange={handleInputChange} required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña ({editingUser ? 'Dejar en blanco para no cambiar' : 'Requerida'})</label>
                        <input type="password" name="password" value={formData.password || ''} onChange={handleInputChange} required={!editingUser}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Roles (Grupos)</label>
                        <div className="mt-2 space-y-2">
                            {groups.map(group => (
                                <label key={group.id} className="flex items-center">
                                    <input type="checkbox"
                                        checked={formData.groups?.includes(group.id) || false}
                                        onChange={() => handleGroupChange(group.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{group.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        <label className="ml-2 block text-sm text-gray-900">Usuario Activo</label>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Guardar Usuario
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}