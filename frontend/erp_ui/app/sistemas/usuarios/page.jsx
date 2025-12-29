'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Users, UserCheck, UserX, Shield,
    Loader2, AlertCircle, Mail, Key
} from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import UserModal from '@/components/modals/UserModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
    getUsers, createUser, updateUser, deleteUser,
    getInactiveUsers, hardDeleteUser, resendInvite,
    exportUsuariosExcel, importarUsuarios
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import ConfirmationModal from '@/components/modals/Confirmation';

const USUARIO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'username', label: 'Usuario' },
    { id: 'email', label: 'Email' },
    { id: 'is_active', label: 'Estado' }
];

export default function UsuariosPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        USUARIO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Usuarios',
            value: pageData.count || 0,
            icon: Users,
            gradient: 'from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(u => u.is_active).length || 0,
            icon: UserCheck,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Inactivos',
            value: pageData.results?.filter(u => !u.is_active).length || 0,
            icon: UserX,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Con Permisos',
            value: pageData.results?.filter(u => u.is_staff || u.is_superuser).length || 0,
            icon: Shield,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        }
    ];

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveUsers(page, size, { search })
                : await getUsers(page, size, { search });
            setPageData(showInactive ? { results: res.data, count: res.data.length } : res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando usuarios');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [showInactive, searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            toast.success('Usuario desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al desactivar usuario');
        } finally {
            setIsConfirmModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteUser(id);
            toast.success('Usuario eliminado permanentemente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar definitivamente');
        }
    };

    const handleResendInvite = async (userId) => {
        try {
            await resendInvite(userId);
            toast.success('Invitación reenviada exitosamente');
        } catch (err) {
            console.error(err);
            toast.error('Error al reenviar invitación');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = USUARIO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportUsuariosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'usuarios.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
            toast.success('Archivo exportado exitosamente');
        } catch (err) {
            console.error(err);
            toast.error('No se pudo exportar el archivo');
        }
    };

    const columns = [
        {
            header: 'Usuario',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {row.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.is_active ? 'success' : 'secondary'}>
                    {row.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            )
        },
        {
            header: 'Permisos',
            render: (row) => (
                <div className="flex gap-1">
                    {row.is_superuser && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                        </Badge>
                    )}
                    {row.is_staff && !row.is_superuser && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Staff
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Última Sesión',
            render: (row) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {row.last_login ? new Date(row.last_login).toLocaleDateString() : '-'}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Gestión de Usuarios
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Administra usuarios, permisos y accesos al sistema
                        </p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('auth.view_user')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('auth.add_user')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('auth.add_user')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('auth.view_user')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-white/80">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="overflow-x-auto">
                    <ReusableTable
                        data={pageData.results}
                        columns={columns}
                        actions={{
                            onEdit: hasPermission('auth.change_user') ? handleEditClick : null,
                            onDelete: hasPermission('auth.delete_user') ? handleDeleteClick : null,
                            onHardDelete: showInactive && hasPermission('auth.delete_user') ? handleHardDelete : null,
                            custom: [
                                {
                                    icon: Mail,
                                    label: 'Reenviar Invitación',
                                    onClick: (row) => handleResendInvite(row.id),
                                    tooltip: 'Reenviar invitación por email'
                                }
                            ]
                        }}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay usuarios disponibles"
                    />
                </div>
            </div>

            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                editingUser={editingUser}
                onSuccess={() => {
                    setIsUserModalOpen(false);
                    fetchData(currentPage, pageSize);
                }}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Usuario"
                message={`¿Estás seguro de que deseas desactivar al usuario ${userToDelete?.username}?`}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarUsuarios}
                onSuccess={() => {
                    fetchData(currentPage, pageSize);
                    toast.success('Usuarios importados exitosamente');
                }}
                templateUrl="/auth/usuarios/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={USUARIO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />
        </div>
    );
}