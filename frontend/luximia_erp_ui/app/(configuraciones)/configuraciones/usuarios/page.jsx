// app/(configuraciones)/configuraciones/usuarios/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, getGroups, createUser, updateUser, deleteUser, getInactiveUsers, hardDeleteUser, resendInvite } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import Overlay from '@/components/loaders/Overlay';
import { Key, ShieldCheck, Mail } from 'lucide-react';

const USUARIO_COLUMNAS_DISPLAY = [
    { header: 'Usuario', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.username}</span> },
    { header: 'Email', render: (row) => row.email },
    {
        header: 'Estado',
        render: (row) => (
            <div className="flex items-center gap-2">
                {row.is_active ? (
                    <span className="text-green-500 font-semibold">Activo</span>
                ) : (
                    <span className="text-red-500 font-semibold">Inactivo</span>
                )}
            </div>
        )
    },
    {
        header: 'Seguridad',
        render: (row) => (
            <div className="flex items-center gap-2">
                {row.has_passkey && <span title="Passkey registrada"><Key className="text-blue-500" /></span>}
                {row.has_totp && <span title="TOTP registrado"><ShieldCheck className="text-purple-500" /></span>}
            </div>
        )
    }
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
    const [showInactive, setShowInactive] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        groups: []
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const usersPromise = showInactive ? getInactiveUsers() : getUsers();
            const [usersRes, groupsRes] = await Promise.all([usersPromise, getGroups()]);
            setUsers(usersRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showInactive]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const USER_FORM_FIELDS = [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'first_name', label: 'Nombre' },
        { name: 'last_name', label: 'Apellido' },
        {
            name: 'groups',
            label: 'Roles (Grupos)',
            type: 'checkbox-group',
            // Verificamos si groups es un array antes de llamar a map()
            options: Array.isArray(groups) ? groups.map(g => ({ value: g.id, label: g.name })) : []
        },
    ];

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

    const openModalForCreate = () => {
        setEditingUser(null);
        setFormData({ email: '', first_name: '', last_name: '', groups: [] });
        setIsFormModalOpen(true);
    };

    const openModalForEdit = (user) => {
        setEditingUser(user);
        const userGroupIds = user.groups.map(groupName => groups.find(g => g.name === groupName)?.id).filter(Boolean);
        setFormData({ ...user, groups: userGroupIds });
        setIsFormModalOpen(true);
    };

    const handleReinvite = async (user) => {
        try {
            await resendInvite(user.id);
            alert("Invitación reenviada con éxito.");
        } catch (err) {
            setError('Error al reenviar la invitación.');
            console.error(err);
        }
    };

    const handleDeleteClick = (userId) => {
        setItemToDelete(userId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteUser(itemToDelete);
            fetchData();
        } catch (err) {
            setError('Error al eliminar el usuario.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (userId) => {
        try {
            await hardDeleteUser(userId);
            fetchData();
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await updateUser(editingUser.id, formData);
            } else {
                await createUser({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    groups: formData.groups
                });
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el usuario.');
            console.error(err);
        }
    };

    if (loading) return <Overlay show />;

    return (
        <div className="p-8">
            <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Usuarios</h1>
                <div className="flex gap-2">
                    {hasPermission('cxc.can_view_inactive_records') && (
                        <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                            {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                        </button>
                    )}
                    {hasPermission('cxc.add_user') && (
                        <button onClick={openModalForCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Nuevo Usuario
                        </button>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <ReusableTable
                data={users}
                columns={USUARIO_COLUMNAS_DISPLAY}
                actions={{
                    onEdit: hasPermission('cxc.change_user') ? openModalForEdit : null,
                    onDelete: hasPermission('cxc.delete_user') ? handleDeleteClick : null,
                    onHardDelete: hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null,
                    customActions: [
                        {
                            label: 'Reenviar Invitación',
                            onClick: handleReinvite,
                            icon: <Mail />,
                            shouldShow: (user) => !user.is_active
                        }
                    ]
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
                submitText="Enviar Invitación"
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