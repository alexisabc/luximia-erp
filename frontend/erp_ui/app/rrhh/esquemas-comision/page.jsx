'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Percent, TrendingUp, DollarSign, AlertCircle,
    Loader2
} from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
    getEsquemasComision, createEsquemaComision, updateEsquemaComision,
    deleteEsquemaComision, getInactiveEsquemasComision, hardDeleteEsquemaComision,
    exportEsquemasComisionExcel
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

import ExportModal from '@/components/modals/Export';

const ESQUEMA_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'esquema', label: 'Esquema' },
    { id: 'escenario', label: 'Escenario' },
    { id: 'porcentaje', label: 'Porcentaje' },
    { id: 'iva', label: 'IVA' },
    { id: 'activo', label: 'Estado' }
];

export default function EsquemasComisionPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [formData, setFormData] = useState({ esquema: '', escenario: '', porcentaje: '', iva: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        ESQUEMA_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Esquemas',
            value: pageData.count || 0,
            icon: Percent,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(e => e.activo !== false).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Comisión Promedio',
            value: pageData.results?.length > 0
                ? `${(pageData.results.reduce((sum, e) => sum + parseFloat(e.porcentaje || 0), 0) / pageData.results.length).toFixed(2)}%`
                : '0%',
            icon: DollarSign,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
            isAmount: true
        },
        {
            label: 'Escenarios',
            value: new Set(pageData.results?.map(e => e.escenario)).size || 0,
            icon: AlertCircle,
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
                ? await getInactiveEsquemasComision(page, size)
                : await getEsquemasComision(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('No se pudieron cargar los esquemas');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

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
        setEditingItem(null);
        setFormData({ esquema: '', escenario: '', porcentaje: '', iva: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormData({
            esquema: item.esquema,
            escenario: item.escenario,
            porcentaje: item.porcentaje,
            iva: item.iva
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await updateEsquemaComision(editingItem.id, formData);
                toast.success('Esquema actualizado exitosamente');
            } else {
                await createEsquemaComision(formData);
                toast.success('Esquema creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el esquema');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEsquemaComision(itemToDelete.id);
            toast.success('Esquema desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el esquema');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteEsquemaComision(id);
            toast.success('Esquema eliminado permanentemente');
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
        const columnsToExport = ESQUEMA_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportEsquemasComisionExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'esquemas_comision.xlsx';
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
            header: 'Esquema',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                        <Percent className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">{row.esquema}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{row.escenario}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Comisión',
            render: (row) => (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {row.porcentaje}%
                </Badge>
            )
        },
        {
            header: 'IVA',
            render: (row) => (
                <span className="text-gray-700 dark:text-gray-300">{row.iva}%</span>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Esquemas de Comisión
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Configura las reglas de comisiones para vendedores
                        </p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_cliente')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_esquemacomision')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('contabilidad.view_esquemacomision')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2"><Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" /></div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>{stat.value}</div>
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
                            onEdit: hasPermission('contabilidad.change_esquemacomision') ? handleEditClick : null,
                            onDelete: hasPermission('contabilidad.delete_esquemacomision') ? handleDeleteClick : null,
                            onHardDelete: showInactive && hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                        }}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay esquemas de comisión disponibles"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingItem ? 'Editar Esquema' : 'Nuevo Esquema'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="esquema">Esquema <span className="text-red-500">*</span></Label>
                        <Input id="esquema" value={formData.esquema} onChange={(e) => setFormData({ ...formData, esquema: e.target.value })} placeholder="Nombre del esquema" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="escenario">Escenario <span className="text-red-500">*</span></Label>
                        <Input id="escenario" value={formData.escenario} onChange={(e) => setFormData({ ...formData, escenario: e.target.value })} placeholder="Ej: Venta directa" required className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="porcentaje">Porcentaje (%) <span className="text-red-500">*</span></Label>
                            <Input id="porcentaje" type="number" step="0.01" value={formData.porcentaje} onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })} placeholder="0.00" required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="iva">IVA (%) <span className="text-red-500">*</span></Label>
                            <Input id="iva" type="number" step="0.01" value={formData.iva} onChange={(e) => setFormData({ ...formData, iva: e.target.value })} placeholder="0.00" required className="mt-1" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            <ReusableModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Desactivar Esquema" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar este esquema de comisión?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">El esquema ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Desactivar</Button>
                    </div>
                </div>
            </ReusableModal>

            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} columns={ESQUEMA_COLUMNAS_EXPORT} selectedColumns={selectedColumns} onColumnChange={handleColumnChange} onDownload={handleExport} data={pageData.results} withPreview={true} />
        </div>
    );
}
