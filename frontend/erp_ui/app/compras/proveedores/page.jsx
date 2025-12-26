'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Plus, Building2, CreditCard,
    Search, Phone, Hash, Receipt
} from 'lucide-react';
import { toast } from 'sonner';

import ReusableTable from '@/components/tables/ReusableTable';
import ProveedorModal from '@/components/modals/ProveedorModal';
import ConfirmationModal from '@/components/modals/Confirmation';
import { Badge } from '@/components/ui/badge';

import ActionButtons from '@/components/common/ActionButtons';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

import {
    getProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    exportarProveedoresExcel,
    importarProveedores
} from '@/services/compras';

export default function ProveedoresPage() {
    // ... (existing state)
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Feature flags / filters
    const [showInactive, setShowInactive] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Import/Export Modals
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // --- Data Fetching ---
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

            // Handle pagination response format
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

    // --- Handlers ---
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

            // Crear Blob y descargar
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

    // Columns for Export Modal
    const exportColumns = [
        { id: 'rfc', label: 'RFC' },
        { id: 'razon_social', label: 'Razón Social' },
        { id: 'nombre_comercial', label: 'Nombre Comercial' },
        { id: 'email_contacto', label: 'Email' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'banco_nombre', label: 'Banco' },
        { id: 'cuenta', label: 'Cuenta' },
        { id: 'dias_credito', label: 'Días Crédito' },
    ];

    const [selectedExportColumns, setSelectedExportColumns] = useState(
        exportColumns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
    );

    // --- Table Configuration ---
    // ... (columns definition remains same, omitting for brevity in tool call context unless needed rewrite)
    const columns = [
        // ... (Keep existing columns logic)
        {
            header: 'Razón Social / Comercial',
            accessorKey: 'razon_social',
            cell: (row) => (
                <div className="flex items-start gap-3 text-left">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                        <Building2 className="nav-icon text-blue-600 dark:text-blue-400 w-5 h-5" />
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
                            {/* Mail icon implicit */}
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
        <div className="p-8 h-full flex flex-col space-y-6">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        Directorio de Proveedores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestión centralizada de cuentas por pagar y socios comerciales.
                    </p>
                </div>
                <ActionButtons
                    // Visual Toggle
                    showInactive={showInactive}
                    onToggleInactive={handleToggleInactive}
                    canToggleInactive={true} // Assuming all users can toggle for now

                    // Import
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={true} // Add permission check if needed

                    // Export
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={true} // Add permission check if needed

                    // Create
                    onCreate={handleCreate}
                    canCreate={true}
                />
            </div>

            {/* Table Section */}
            <div className="flex-grow min-h-0 relative">
                <ReusableTable
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
                        onDelete: handleDeleteClick,
                    }}
                />
            </div>

            {/* Modals */}
            <ProveedorModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingProveedor}
            />

            <ConfirmationModal
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
                data={proveedores} // Preview data
                withPreview={true}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarProveedores}
                onSuccess={() => fetchProveedores(currentPage, search, showInactive)}
                templateUrl="/compras/proveedores/exportar-plantilla/"
            />
        </div>
    );
}
