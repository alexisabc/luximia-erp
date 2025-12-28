'use client';

/**
 * Página de Gestión de Clientes - Actualizada v2.6
 * 
 * Características:
 * - ✅ Responsive (móvil → TV)
 * - ✅ Dark mode completo
 * - ✅ Stats cards con gradientes
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Componentes reutilizables
 * - ✅ Iconos Lucide
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Users, Plus, Download, Upload, Loader2,
    TrendingUp, UserCheck, UserX, AlertCircle,
    Mail, Phone, Search
} from 'lucide-react';

// Componentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Servicios y contexto
import {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getInactiveClientes,
    hardDeleteCliente,
    exportClientesExcel,
    importarClientes,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Modales legacy (para import/export)
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const CLIENTE_COLUMNAS_DISPLAY = [
    {
        header: 'Nombre Completo',
        render: (row) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {row.nombre_completo?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                    {row.nombre_completo}
                </span>
            </div>
        )
    },
    {
        header: 'Email',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                {row.email || '-'}
            </div>
        )
    },
    {
        header: 'Teléfono',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="w-4 h-4 text-gray-400" />
                {row.telefono || '-'}
            </div>
        )
    },
    {
        header: 'Estado',
        render: (row) => (
            <Badge variant={row.activo ? 'success' : 'secondary'}>
                {row.activo ? 'Activo' : 'Inactivo'}
            </Badge>
        )
    }
];

const CLIENTE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'activo', label: 'Estado' }
];

export default function ClientesPage() {
    const { hasPermission, authTokens } = useAuth();

    // Estados
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Export
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        CLIENTE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const pageSize = 10;

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Clientes',
            value: pageData.count || 0,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
            change: null
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(c => c.activo).length || 0,
            icon: UserCheck,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
            change: null
        },
        {
            label: 'Inactivos',
            value: pageData.results?.filter(c => !c.activo).length || 0,
            icon: UserX,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
            change: null
        },
        {
            label: 'Con Email',
            value: pageData.results?.filter(c => c.email).length || 0,
            icon: Mail,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            change: null
        }
    ];

    // Cargar datos
    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (pageData.results.length > 0) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveClientes(page, size, { search })
                : await getClientes(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            toast.error('Error cargando clientes');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive, searchQuery]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    // Handlers
    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingCliente(null);
        setFormData({ nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({
            nombre_completo: cliente.nombre_completo,
            email: cliente.email || '',
            telefono: cliente.telefono || ''
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (cliente) => {
        setItemToDelete(cliente);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, formData);
                toast.success('Cliente actualizado exitosamente');
            } else {
                await createCliente(formData);
                toast.success('Cliente creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteCliente(itemToDelete.id);
            toast.success('Cliente desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Este cliente tiene contratos y no puede ser eliminado');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteCliente(id);
            toast.success('Cliente eliminado permanentemente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar definitivamente');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = CLIENTE_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportClientesExcel(columnsToExport, { search: searchQuery });
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_clientes.xlsx';
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Gestión de Clientes
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Directorio y administración de clientes
                        </p>
                    </div>

                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_cliente')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('contabilidad.add_cliente')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`
                                bg-gradient-to-br ${stat.gradient}
                                rounded-xl p-4 sm:p-6
                                shadow-lg hover:shadow-xl
                                transition-all duration-300
                                transform hover:-translate-y-1
                            `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                                {stat.change && (
                                    <span className="text-xs sm:text-sm font-medium text-white/70">
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs sm:text-sm text-white/80">
                                {stat.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                {/* Tabla */}
                <div className="overflow-x-auto">
                    <ReusableTable
                        data={pageData.results}
                        columns={CLIENTE_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('contabilidad.change_cliente') ? handleEditClick : null,
                            onDelete: hasPermission('contabilidad.delete_cliente') ? handleDeleteClick : null,
                            onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
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
                        emptyMessage="No hay clientes disponibles"
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <ReusableModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre Completo */}
                    <div>
                        <Label htmlFor="nombre_completo">
                            Nombre Completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre_completo"
                            name="nombre_completo"
                            value={formData.nombre_completo}
                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                            placeholder="Ingrese el nombre completo"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="correo@ejemplo.com"
                            required
                            className="mt-1"
                        />
                    </div>

                    {/* Teléfono */}
                    <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                            id="telefono"
                            name="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="(555) 123-4567"
                            className="mt-1"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFormModalOpen(false)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cliente'
                            )}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal de Confirmación */}
            <ReusableModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Desactivar Cliente"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Estás seguro de que deseas desactivar a{' '}
                                <span className="font-semibold">{itemToDelete?.nombre_completo}</span>?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                El cliente ya no aparecerá en las listas principales.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            Desactivar
                        </Button>
                    </div>
                </div>
            </ReusableModal>

            {/* Modales de Import/Export (legacy) */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarClientes}
                onSuccess={() => {
                    fetchData(currentPage, pageSize);
                    toast.success('Clientes importados exitosamente');
                }}
                templateUrl="/contabilidad/clientes/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={CLIENTE_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />
        </div>
    );
}