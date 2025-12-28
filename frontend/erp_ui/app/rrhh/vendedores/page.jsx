'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Users, Plus, Loader2, TrendingUp,
    AlertCircle, Phone, Mail
} from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
    getVendedores, createVendedor, updateVendedor, deleteVendedor,
    getInactiveVendedores, hardDeleteVendedor, exportVendedoresExcel, importarVendedores
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const VENDEDOR_COLUMNAS_DISPLAY = [
    {
        header: 'Vendedor',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                    {row.nombre_completo?.charAt(0) || 'V'}
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.tipo}</div>
                </div>
            </div>
        )
    },
    {
        header: 'Contacto',
        render: (row) => (
            <div className="space-y-1">
                {row.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{row.email}</span>
                    </div>
                )}
                {row.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{row.telefono}</span>
                    </div>
                )}
            </div>
        )
    }
];

const VENDEDOR_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'activo', label: 'Estado' }
];

export default function VendedoresPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [formData, setFormData] = useState({ tipo: '', nombre_completo: '', email: '', telefono: '' });
    const [editingVendedor, setEditingVendedor] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        VENDEDOR_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Vendedores',
            value: pageData.count || 0,
            icon: Users,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(v => v.activo !== false).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Con Email',
            value: pageData.results?.filter(v => v.email).length || 0,
            icon: Mail,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Con Teléfono',
            value: pageData.results?.filter(v => v.telefono).length || 0,
            icon: Phone,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveVendedores(page, size, { search })
                : await getVendedores(page, size, { search });
            setPageData(showInactive ? { results: res.data, count: res.data.length } : res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando vendedores');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingVendedor(null);
        setFormData({ tipo: '', nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (vendedor) => {
        setEditingVendedor(vendedor);
        setFormData({
            tipo: vendedor.tipo,
            nombre_completo: vendedor.nombre_completo,
            email: vendedor.email || '',
            telefono: vendedor.telefono || ''
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (vendedor) => {
        setItemToDelete(vendedor);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingVendedor) {
                await updateVendedor(editingVendedor.id, formData);
                toast.success('Vendedor actualizado exitosamente');
            } else {
                await createVendedor(formData);
                toast.success('Vendedor creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el vendedor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteVendedor(itemToDelete.id);
            toast.success('Vendedor desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el vendedor');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteVendedor(id);
            toast.success('Vendedor eliminado permanentemente');
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
        const columnsToExport = VENDEDOR_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportVendedoresExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_vendedores.xlsx';
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
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Gestión de Vendedores
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Administra el equipo comercial y sus datos de contacto
                        </p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_vendedor')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('contabilidad.add_vendedor')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('contabilidad.view_vendedor')}
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
                        columns={VENDEDOR_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('contabilidad.change_vendedor') ? handleEditClick : null,
                            onDelete: hasPermission('contabilidad.delete_vendedor') ? handleDeleteClick : null,
                            onHardDelete: showInactive && hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                        }}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay vendedores disponibles"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                        <Input id="tipo" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} placeholder="Ej: Interno, Externo" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="nombre_completo">Nombre Completo <span className="text-red-500">*</span></Label>
                        <Input id="nombre_completo" value={formData.nombre_completo} onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })} placeholder="Nombre completo del vendedor" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="(555) 123-4567" className="mt-1" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar Vendedor')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            <ReusableModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Desactivar Vendedor" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar a <span className="font-semibold">{itemToDelete?.nombre_completo}</span>?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">El vendedor ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Desactivar</Button>
                    </div>
                </div>
            </ReusableModal>

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={importarVendedores} onSuccess={() => { fetchData(currentPage, pageSize); toast.success('Vendedores importados exitosamente'); }} templateUrl="/contabilidad/vendedores/exportar-plantilla/" />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} columns={VENDEDOR_COLUMNAS_EXPORT} selectedColumns={selectedColumns} onColumnChange={handleColumnChange} onDownload={handleExport} data={pageData.results} withPreview={true} />
        </div>
    );
}
