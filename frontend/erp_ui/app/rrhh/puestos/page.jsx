'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Briefcase, Plus, Loader2, Building, TrendingUp, AlertCircle } from 'lucide-react';

import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
    getPuestos, createPuesto, updatePuesto, deletePuesto,
    getInactivePuestos, hardDeletePuesto, getAllDepartamentos,
    exportPuestosExcel, importarPuestos
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const PUESTO_COLUMNAS_DISPLAY = [
    {
        header: 'Puesto',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                    <Briefcase className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{row.nombre}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.descripcion || 'Sin descripción'}</div>
                </div>
            </div>
        )
    },
    {
        header: 'Departamento',
        render: (row) => (
            <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{row.departamento_nombre}</span>
            </div>
        )
    }
];

const PUESTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'departamento_nombre', label: 'Departamento' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'activo', label: 'Estado' }
];

export default function PuestosPage() {
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
    const [formData, setFormData] = useState({ nombre: '', descripcion: '', departamento: '' });
    const [departamentos, setDepartamentos] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        PUESTO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    const stats = [
        {
            label: 'Total Puestos',
            value: pageData.count || 0,
            icon: Briefcase,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(p => p.activo).length || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Departamentos',
            value: new Set(pageData.results?.map(p => p.departamento_nombre)).size || 0,
            icon: Building,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Inactivos',
            value: pageData.results?.filter(p => !p.activo).length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    const fetchDepartamentos = useCallback(async () => {
        try {
            const { data } = await getAllDepartamentos();
            const items = Array.isArray(data) ? data : (data?.results ?? []);
            setDepartamentos(items);
        } catch (e) {
            console.error('Error cargando departamentos', e);
            toast.error('Error cargando departamentos');
        }
    }, []);

    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;
        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }
        try {
            const res = showInactive ? await getInactivePuestos(page, size, { search }) : await getPuestos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando puestos');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => {
        fetchDepartamentos();
    }, [fetchDepartamentos]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => { fetchData(newPage, pageSize); };
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingItem(null);
        setFormData({ nombre: '', descripcion: '', departamento: departamentos[0]?.id || '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (puesto) => {
        setEditingItem(puesto);
        setFormData({ nombre: puesto.nombre, descripcion: puesto.descripcion || '', departamento: puesto.departamento });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (puesto) => {
        setItemToDelete(puesto);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await updatePuesto(editingItem.id, formData);
                toast.success('Puesto actualizado exitosamente');
            } else {
                await createPuesto(formData);
                toast.success('Puesto creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el puesto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deletePuesto(itemToDelete.id);
            toast.success('Puesto desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el puesto');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeletePuesto(id);
            toast.success('Puesto eliminado permanentemente');
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
        const columnsToExport = PUESTO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportPuestosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_puestos.xlsx';
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
                            Gestión de Puestos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Configura los roles y posiciones de la organización
                        </p>
                    </div>
                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_inactive_puesto')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_puesto')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('rrhh.add_puesto')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('rrhh.view_puesto')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                            <div className="flex items-center justify-between mb-2">
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                            </div>
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
                        columns={PUESTO_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('rrhh.change_puesto') ? handleEditClick : null,
                            onDelete: hasPermission('rrhh.delete_puesto') ? handleDeleteClick : null,
                            onHardDelete: hasPermission('rrhh.hard_delete_puesto') ? handleHardDelete : null
                        }}
                        loading={loading}
                        isPaginating={isPaginating}
                        pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                        onSearch={handleSearch}
                        emptyMessage="No hay puestos disponibles"
                    />
                </div>
            </div>

            <ReusableModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingItem ? 'Editar Puesto' : 'Nuevo Puesto'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                        <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Gerente de Ventas" required className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="departamento">Departamento <span className="text-red-500">*</span></Label>
                        <Select value={formData.departamento?.toString()} onValueChange={(value) => setFormData({ ...formData, departamento: value })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccione un departamento" /></SelectTrigger>
                            <SelectContent>
                                {departamentos.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción del puesto" rows={3} className="mt-1" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : ('Guardar Puesto')}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            <ReusableModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Desactivar Puesto" size="sm">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">¿Estás seguro de que deseas desactivar el puesto <span className="font-semibold">{itemToDelete?.nombre}</span>?</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">El puesto ya no aparecerá en las listas principales.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Desactivar</Button>
                    </div>
                </div>
            </ReusableModal>

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={importarPuestos} onSuccess={() => { fetchData(currentPage, pageSize); toast.success('Puestos importados exitosamente'); }} templateUrl="/rrhh/puestos/exportar-plantilla/" />
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} columns={PUESTO_COLUMNAS_EXPORT} selectedColumns={selectedColumns} onColumnChange={handleColumnChange} onDownload={handleExport} data={pageData.results} withPreview={true} />
        </div>
    );
}
