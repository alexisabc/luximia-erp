'use client';

/**
 * Página de Gestión de Proveedores - Actualizada v2.6
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
    Users, Plus, Building2, CreditCard,
    Phone, TrendingUp, AlertCircle, Clock
} from 'lucide-react';

// Componentes
import DataTable from '@/components/organisms/DataTable';
import ProveedorModal from '@/components/modals/ProveedorModal';
import { ConfirmModal } from '@/components/organisms';
import { ActionButtonGroup } from '@/components/molecules';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';
import { Badge } from '@/components/ui/badge';

// Servicios
import {
    getProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    exportarProveedoresExcel,
    importarProveedores
} from '@/services/compras';

export default function ProveedoresPage() {
    // Estados
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Export
    const exportColumns = [
        { id: 'rfc', label: 'RFC' },
        { id: 'razon_social', label: 'Razón Social' },
        { id: 'nombre_comercial', label: 'Nombre Comercial' },
        { id: 'email_contacto', label: 'Email' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'banco_nombre', label: 'Banco' },
        { id: 'cuenta', label: 'Cuenta' },
        { id: 'dias_credito', label: 'Días Crédito' }
    ];

    const [selectedExportColumns, setSelectedExportColumns] = useState(
        exportColumns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
    );

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Proveedores',
            value: totalItems || 0,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Con Crédito',
            value: proveedores.filter(p => p.dias_credito > 0).length || 0,
            icon: Clock,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Contado',
            value: proveedores.filter(p => p.dias_credito === 0).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Con Datos Bancarios',
            value: proveedores.filter(p => p.banco_nombre).length || 0,
            icon: CreditCard,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        }
    ];

    // Cargar datos
    const fetchProveedores = useCallback(async (page = 1, searchQuery = '', showInactiveFlag = false) => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
                search: searchQuery,
                show_inactive: showInactiveFlag
            };
            const response = await getProveedores(params);

            if (response.data.results) {
                setProveedores(response.data.results);
                setTotalItems(response.data.count);
            } else {
                setProveedores(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error("Error fetching proveedores:", error);
            toast.error("Error al cargar proveedores");
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchProveedores(currentPage, search, showInactive);
    }, [fetchProveedores, currentPage, search, showInactive]);

    // Handlers
    const handleSearch = (query) => {
        setSearch(query);
        setCurrentPage(1);
    };

    const handleToggleInactive = () => {
        setShowInactive(prev => !prev);
        setCurrentPage(1);
    };

    const handleCreate = () => {
        setEditingProveedor(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (proveedor) => {
        setEditingProveedor(proveedor);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingProveedor) {
                await updateProveedor(editingProveedor.id, formData);
                toast.success("Proveedor actualizado correctamente");
            } else {
                await createProveedor(formData);
                toast.success("Proveedor registrado correctamente");
            }
            fetchProveedores(currentPage, search, showInactive);
        } catch (error) {
            const msg = error.response?.data?.error || "Error al guardar proveedor";
            toast.error(msg);
            throw error;
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteProveedor(itemToDelete);
            toast.success("Proveedor eliminado correctamente");
            fetchProveedores(currentPage, search, showInactive);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar proveedor");
        }
    };

    const handleExport = async () => {
        try {
            const response = await exportarProveedoresExcel({
                search,
                show_inactive: showInactive
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Reporte_Proveedores.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            setIsExportModalOpen(false);
            toast.success("Exportación completada");
        } catch (error) {
            console.error(error);
            toast.error("Error al exportar datos");
        }
    };

    // Columnas de la tabla
    const columns = [
        {
            header: 'Razón Social / Comercial',
            accessorKey: 'razon_social',
            cell: (row) => (
                <div className="flex items-start gap-3 text-left">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                        <Building2 className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{row.razon_social}</p>
                        {row.nombre_comercial && row.nombre_comercial !== row.razon_social && (
                            <p className="text-sm text-gray-500">{row.nombre_comercial}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-mono text-gray-500">
                                {row.rfc}
                            </Badge>
                            <Badge variant={row.tipo_persona === 'MORAL' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-5">
                                {row.tipo_persona === 'MORAL' ? 'PM' : 'PF'}
                            </Badge>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contacto Directo',
            accessorKey: 'email_contacto',
            cell: (row) => (
                <div className="flex flex-col gap-1 text-sm text-left">
                    {row.email_contacto ? (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <span className="truncate max-w-[180px]" title={row.email_contacto}>{row.email_contacto}</span>
                        </div>
                    ) : <span className="text-gray-400 italic">Sin email</span>}

                    {row.telefono ? (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{row.telefono}</span>
                        </div>
                    ) : null}
                </div>
            )
        },
        {
            header: 'Datos Bancarios',
            accessorKey: 'banco_nombre',
            cell: (row) => (
                <div className="space-y-1 text-left">
                    {row.banco_nombre ? (
                        <>
                            <p className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-gray-400" />
                                {row.banco_nombre}
                            </p>
                            {row.clabe && <p className="text-xs font-mono text-gray-500">CLABE: {row.clabe}</p>}
                        </>
                    ) : (
                        <Badge variant="outline" className="text-gray-400 border-dashed">Pendiente</Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Condiciones',
            accessorKey: 'dias_credito',
            cell: (row) => (
                <div className="text-center">
                    {row.dias_credito > 0 ? (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                            {row.dias_credito} Días Crédito
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            Contado
                        </Badge>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Directorio de Proveedores
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Gestión centralizada de cuentas por pagar y socios comerciales
                        </p>
                    </div>

                    <ActionButtonGroup
                        showInactive={showInactive}
                        onToggleInactive={handleToggleInactive}
                        canToggleInactive={true}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={true}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={true}
                        onCreate={handleCreate}
                        canCreate={true}
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
                <div className="overflow-x-auto">
                    <DataTable
                        data={proveedores}
                        columns={columns}
                        loading={loading}
                        onSearch={handleSearch}
                        search={true}
                        pagination={{
                            currentPage,
                            totalCount: totalItems,
                            pageSize,
                            onPageChange: setCurrentPage
                        }}
                        actions={{
                            onEdit: handleEdit,
                            onDelete: handleDeleteClick
                        }}
                        emptyMessage="No hay proveedores disponibles"
                    />
                </div>
            </div>

            {/* Modales */}
            <ProveedorModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingProveedor}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Proveedor"
                message="¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer si tiene historial."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={exportColumns}
                selectedColumns={selectedExportColumns}
                onColumnChange={(e) => {
                    const { name, checked } = e.target;
                    setSelectedExportColumns(prev => ({ ...prev, [name]: checked }));
                }}
                onDownload={handleExport}
                data={proveedores}
                withPreview={true}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarProveedores}
                onSuccess={() => {
                    fetchProveedores(currentPage, search, showInactive);
                    toast.success('Proveedores importados exitosamente');
                }}
                templateUrl="/compras/proveedores/exportar-plantilla/"
            />
        </div>
    );
}
