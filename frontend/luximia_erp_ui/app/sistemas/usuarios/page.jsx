// app/(configuraciones)/configuraciones/usuarios/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    getUsers,
    getGroups,
    createUser,
    updateUser,
    deleteUser,
    getInactiveUsers,
    hardDeleteUser,
    resendInvite,
    exportUsuariosExcel,
    importarUsuarios,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ExportModal from '@/components/ui/modals/Export';
import ImportModal from '@/components/ui/modals/Import';
import Overlay from '@/components/loaders/Overlay';
import { Key, ShieldCheck, Mail } from 'lucide-react';
import ActionButtons from '@/components/common/ActionButtons';

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

const USUARIO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'username', label: 'Usuario' },
    { id: 'email', label: 'Email' },
    { id: 'is_active', label: 'Estado' },
];

export default function UsuariosPage() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { authTokens } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasPermission('users.view_customuser') && !hasPermission('users.view_user')) { // check both jsic incase
            router.push('/unauthorized');
        }
    }, [hasPermission, loading, router]);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        USUARIO_COLUMNAS_EXPORT.forEach(c => (allCols[c.id] = true));
        return allCols;
    });

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        groups: []
    });

    const fetchData = useCallback(
        async (page, size, search = searchQuery) => {
            if (!authTokens?.access) return;
            setError(null);
            setLoading(true);
            try {
                const usersPromise = showInactive
                    ? getInactiveUsers(page, size)
                    : getUsers(page, size, { search });
                const [usersRes, groupsRes] = await Promise.all([
                    usersPromise,
                    getGroups(1, 1000),
                ]);

                const usersResData = usersRes.data;
                const usersData = Array.isArray(usersResData)
                    ? usersResData
                    : usersResData.results || [];
                const groupsData = Array.isArray(groupsRes.data)
                    ? groupsRes.data
                    : groupsRes.data?.results || [];

                setUsers(usersData);
                setPageData(usersResData);
                setGroups(groupsData);
                setCurrentPage(page);
            } catch (err) {
                setError('No se pudieron cargar los usuarios.');
                console.error(err);
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        [showInactive, searchQuery, authTokens?.access]
    );

    useEffect(() => {
        fetchData(1, pageSize);
    }, [fetchData]); // pageSize is constant 10

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const USER_FORM_FIELDS = [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'first_name', label: 'Nombre' },
        { name: 'last_name', label: 'Apellido' },
        {
            name: 'groups',
            label: 'Roles (Grupos)',
            type: 'checkbox-group',
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

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = USUARIO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportUsuariosExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_usuarios.xlsx';
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
            fetchData(currentPage, pageSize);
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
            fetchData(currentPage, pageSize);
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
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el usuario.');
            console.error(err);
        }
    };

    // deleted overlay block

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Gestión de Usuarios
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Administra las cuentas de usuario y sus roles.</p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('users.view_inactive_users')}
                        onCreate={openModalForCreate}
                        canCreate={hasPermission('users.add_customuser')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('users.add_customuser')}
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
                    data={users}
                    columns={USUARIO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('users.change_customuser') ? openModalForEdit : null,
                        onDelete: hasPermission('users.delete_customuser') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('users.hard_delete_customuser') ? handleHardDelete : null,
                        customActions: [
                            {
                                label: 'Reenviar Invitación',
                                onClick: handleReinvite,
                                icon: <Mail />,
                                shouldShow: (user) => !user.is_active
                            }
                        ]
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
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                formData={formData}
                onFormChange={handleInputChange}
                handleMultiSelectChange={handleMultiSelectChange}
                onSubmit={handleSubmit}
                fields={USER_FORM_FIELDS}
                submitText="Enviar Invitación"
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarUsuarios}
                onSuccess={() => fetchData(currentPage, pageSize)}
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={USUARIO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
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