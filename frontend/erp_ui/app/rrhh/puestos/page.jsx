'use client';

/**
 * Página de Gestión de Puestos - MIGRADA a Atomic Design v3.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Briefcase, Building, TrendingUp, AlertCircle } from 'lucide-react';

// Componentes Atomic Design
import ListPageTemplate from '@/components/templates/ListPageTemplate';
import DataTable from '@/components/organisms/DataTable';
import Modal, { ConfirmModal } from '@/components/organisms/Modal';
import { StatCard, ActionButtonGroup, FormField } from '@/components/molecules';
import Button from '@/components/atoms/Button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Servicios
import {
    getPuestos, createPuesto, updatePuesto, deletePuesto,
    getInactivePuestos, hardDeletePuesto, getAllDepartamentos,
    exportPuestosExcel, importarPuestos
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const PUESTO_COLUMNAS = [
    {
        header: 'Puesto',
        accessorKey: 'nombre',
        cell: (row) => (
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
        accessorKey: 'departamento_nombre',
        cell: (row) => (
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

    const statsData = [
        {
            title: 'Total Puestos',
            value: pageData.count || 0,
            icon: Briefcase,
            variant: 'info'
        },
        {
            title: 'Activos',
            value: pageData.results?.filter(p => p.activo).length || 0,
            icon: TrendingUp,
            variant: 'success'
        },
        {
            title: 'Departamentos',
            value: new Set(pageData.results?.map(p => p.departamento_nombre)).size || 0,
            icon: Building,
            variant: 'primary'
        },
        {
            title: 'Inactivos',
            value: pageData.results?.filter(p => !p.activo).length || 0,
            icon: AlertCircle,
            variant: 'warning'
        }
    ];

    return (
        <ListPageTemplate
            title="Gestión de Puestos"
            description="Configura los roles y posiciones de la organización"
            onSearch={handleSearch}
            stats={
                <div className="grid-responsive">
                    {statsData.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>
            }
            actions={
                <ActionButtonGroup
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={hasPermission('rrhh.view_inactive_puesto')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('rrhh.add_puesto')}
                    createLabel="Nuevo Puesto"
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission('rrhh.add_puesto')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('rrhh.view_puesto')}
                />
            }
        >
            <DataTable
                data={pageData.results}
                columns={PUESTO_COLUMNAS}
                actions={{
                    onEdit: hasPermission('rrhh.change_puesto') ? handleEditClick : null,
                    onDelete: hasPermission('rrhh.delete_puesto') ? handleDeleteClick : null,
                    onHardDelete: hasPermission('rrhh.hard_delete_puesto') ? handleHardDelete : null
                }}
                loading={loading}
                isPaginating={isPaginating}
                pagination={{ currentPage, totalCount: pageData.count, pageSize, onPageChange: handlePageChange }}
                onSearch={handleSearch}
                mobileCardView={true}
                sortable={true}
            />

            {/* Modal de Formulario */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingItem ? 'Editar Puesto' : 'Nuevo Puesto'}
                size="md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setIsFormModalOpen(false)}
                            disabled={isSubmitting}
                            fullWidth
                            className="sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            fullWidth
                            className="sm:w-auto"
                        >
                            Guardar Puesto
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Gerente de Ventas"
                        required
                    />

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
                        <Textarea
                            id="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Descripción del puesto"
                            rows={3}
                            className="mt-1"
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Puesto"
                description={`¿Estás seguro de que deseas desactivar el puesto ${itemToDelete?.nombre}? El puesto ya no aparecerá en las listas principales.`}
                confirmLabel="Desactivar"
                cancelLabel="Cancelar"
                variant="warning"
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarPuestos}
                onSuccess={() => {
                    fetchData(currentPage, pageSize);
                    toast.success('Puestos importados exitosamente');
                }}
                templateUrl="/rrhh/puestos/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PUESTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />
        </ListPageTemplate>
    );
}
