// app/configuraciones/usuarios/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, getGroups, createUser, updateUser, deleteUser } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ReusableTable from '../../../components/ReusableTable';
import FormModal from '../../../components/FormModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

const USUARIO_COLUMNAS_DISPLAY = [
    { header: 'Usuario', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.username}</span> },
    { header: 'Nombre', render: (row) => `${row.first_name} ${row.last_name}` },
    { header: 'Roles', render: (row) => row.groups.join(', ') },
    { header: 'Estado', render: (row) => row.is_active ? <span className="text-green-500">Activo</span> : <span className="text-red-500">Inactivo</span> },
];


export default function UsuariosPage() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

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

    useEffect(() => { fetchData(); }, [fetchData]);

    const USER_FORM_FIELDS = [
        { name: 'username', label: 'Username', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: `Contraseña (${editingUser ? 'Dejar en blanco para no cambiar' : 'Requerida'})`, type: 'password', required: !editingUser },
        { name: 'first_name', label: 'Nombre' },
        { name: 'last_name', label: 'Apellido' },
        { name: 'groups', label: 'Roles (Grupos)', type: 'checkbox-group', options: groups.map(g => ({ value: g.id, label: g.name })) },
        { name: 'is_active', label: '', type: 'checkbox', checkboxLabel: 'Usuario Activo' }
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleMultiSelectChange = (fieldName, selectedId) => {
        const currentSelection = formData[fieldName] || [];
        const newSelection = currentSelection.includes(selectedId)
            ? currentSelection.filter(id => id !== selectedId)
            : [...currentSelection, selectedId];
        setFormData(prev => ({ ...prev, [fieldName]: newSelection }));
    };

    const openModalForCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', first_name: '', last_name: '', is_active: true, groups: [] });
        setIsFormModalOpen(true);
    };

    const openModalForEdit = (user) => {
        setEditingUser(user);
        const userGroupIds = user.groups.map(groupName => groups.find(g => g.name === groupName)?.id).filter(Boolean);
        setFormData({ ...user, password: '', groups: userGroupIds });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (userId) => {
        setItemToDelete(userId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteUser(itemToDelete); // Necesitarás crear esta función en api.js
            fetchData();
        } catch (err) {
            setError('Error al eliminar el usuario.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
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
            setIsFormModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el usuario.');
            console.error(err);
        }
    };


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

            <ReusableTable
                data={users}
                columns={USUARIO_COLUMNAS_DISPLAY}
                actions={{
                    onEdit: hasPermission('cxc.change_user') ? openModalForEdit : null,
                    onDelete: hasPermission('cxc.delete_user') ? handleDeleteClick : null,
                }}
            />

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                formData={formData}
                onFormChange={handleInputChange}
                handleMultiSelectChange={handleMultiSelectChange}
                onSubmit={handleSubmit}
                fields={USER_FORM_FIELDS}
                submitText="Guardar Usuario"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Usuario"
                message="¿Estás seguro de que deseas desactivar este Usuario? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}