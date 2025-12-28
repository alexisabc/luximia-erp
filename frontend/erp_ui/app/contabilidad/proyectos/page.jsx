'use client';

/**
 * Página de Gestión de Proyectos - Actualizada v2.6
 * 
 * Características:
 * - ✅ Responsive (móvil → TV)
 * - ✅ Dark mode completo
 * - ✅ Stats cards con gradientes
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Componentes reutilizables
 * - ✅ Iconos Lucide
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Building2, Plus, Loader2, TrendingUp,
    Layers, Home, DollarSign, AlertCircle,
    CheckCircle, Clock, Package
} from 'lucide-react';

// Componentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Servicios y utilidades
import {
    getProyectos,
    createProyecto,
    updateProyecto,
    deleteProyecto,
    getInactiveProyectos,
    hardDeleteProyecto,
    exportProyectosExcel,
    importarProyectos
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';

// Modales legacy
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const PROYECTO_COLUMNAS_DISPLAY = [
    {
        header: 'Proyecto',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {row.descripcion || 'Sin descripción'}
                    </div>
                </div>
            </div>
        )
    },
    {
        header: 'Niveles',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{row.niveles || 0}</span>
            </div>
        )
    },
    {
        header: 'UPEs',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{row.numero_upes || 0}</span>
            </div>
        )
    },
    {
        header: 'm²',
        render: (row) => (
            <span className="text-sm text-gray-600 dark:text-gray-300">
                {row.metros_cuadrados ? `${row.metros_cuadrados.toLocaleString()} m²` : '-'}
            </span>
        )
    },
    {
        header: 'Estacionamientos',
        render: (row) => (
            <span className="text-sm text-gray-600 dark:text-gray-300">
                {row.numero_estacionamientos || 0}
            </span>
        )
    },
    {
        header: 'Valor Total',
        render: (row) => (
            <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(row.valor_total, 'MXN')}
                </div>
            </div>
        )
    },
    {
        header: 'Estado',
        render: (row) => {
            const statusConfig = {
                'Planificado': { variant: 'secondary', icon: Clock },
                'En venta': { variant: 'info', icon: Package },
                'Terminado': { variant: 'success', icon: CheckCircle }
            };
            const config = statusConfig[row.estado] || statusConfig['Planificado'];
            const Icon = config.icon;

            return (
                <Badge variant={config.variant} className="gap-1">
                    <Icon className="w-3 h-3" />
                    {row.estado}
                </Badge>
            );
        }
    }
];

const PROYECTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'niveles', label: 'Niveles' },
    { id: 'numero_upes', label: 'Número de UPEs' },
    { id: 'metros_cuadrados', label: 'Metros cuadrados' },
    { id: 'numero_estacionamientos', label: 'Número de Estacionamientos' },
    { id: 'valor_total', label: 'Valor Total' },
    { id: 'estado', label: 'Estado' },
    { id: 'activo', label: 'Activo' }
];

export default function ProyectosPage() {
    const { hasPermission, authTokens } = useAuth();

    // Estados
    const [pageData, setPageData] = useState({ results: [], count: 0 });
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
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        niveles: '',
        numero_upes: '',
        metros_cuadrados: '',
        numero_estacionamientos: '',
        valor_total: '',
        estado: 'Planificado'
    });
    const [editingProject, setEditingProject] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Export
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        PROYECTO_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Proyectos',
            value: pageData.count || 0,
            icon: Building2,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'En Venta',
            value: pageData.results?.filter(p => p.estado === 'En venta').length || 0,
            icon: Package,
            gradient: 'from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700'
        },
        {
            label: 'Terminados',
            value: pageData.results?.filter(p => p.estado === 'Terminado').length || 0,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Valor Total',
            value: formatCurrency(
                pageData.results?.reduce((sum, p) => sum + (parseFloat(p.valor_total) || 0), 0) || 0,
                'MXN'
            ),
            icon: DollarSign,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700',
            isAmount: true
        }
    ];

    // Cargar datos
    const fetchData = useCallback(async (page, size, search = searchQuery) => {
        if (!authTokens || !size || size <= 0) return;

        if (hasInitialData.current) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveProyectos(page, size, { search })
                : await getProyectos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando proyectos');
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

    // Handlers
    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, pageSize, query);
    }, [fetchData, pageSize]);

    const handleCreateClick = () => {
        setEditingProject(null);
        setFormData({
            nombre: '',
            descripcion: '',
            niveles: '',
            numero_upes: '',
            metros_cuadrados: '',
            numero_estacionamientos: '',
            valor_total: '',
            estado: 'Planificado'
        });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (proyecto) => {
        setEditingProject(proyecto);
        setFormData({
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion || '',
            niveles: proyecto.niveles || '',
            numero_upes: proyecto.numero_upes || '',
            metros_cuadrados: proyecto.metros_cuadrados || '',
            numero_estacionamientos: proyecto.numero_estacionamientos || '',
            valor_total: proyecto.valor_total || '',
            estado: proyecto.estado || 'Planificado'
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (proyecto) => {
        setItemToDelete(proyecto);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingProject) {
                await updateProyecto(editingProject.id, formData);
                toast.success('Proyecto actualizado exitosamente');
            } else {
                await createProyecto(formData);
                toast.success('Proyecto creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el proyecto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteProyecto(itemToDelete.id);
            toast.success('Proyecto desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el proyecto');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteProyecto(id);
            toast.success('Proyecto eliminado permanentemente');
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
        const columnsToExport = PROYECTO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportProyectosExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_proyectos.xlsx';
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
                            Gestión de Proyectos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Administra el catálogo de proyectos activos e inactivos
                        </p>
                    </div>

                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('contabilidad.view_proyecto')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('contabilidad.add_proyecto')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('contabilidad.add_proyecto')}
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
                            </div>
                            <div className={`${stat.isAmount ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-1`}>
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
                    <ReusableTable
                        data={pageData.results}
                        columns={PROYECTO_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('contabilidad.change_proyecto') ? handleEditClick : null,
                            onDelete: hasPermission('contabilidad.delete_proyecto') ? handleDeleteClick : null,
                            onHardDelete: hasPermission('contabilidad.delete_user') ? handleHardDelete : null
                        }}
                        pagination={{
                            currentPage,
                            totalCount: pageData.count,
                            pageSize,
                            onPageChange: handlePageChange
                        }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay proyectos disponibles"
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <ReusableModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Grid de 2 columnas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="sm:col-span-2">
                            <Label htmlFor="nombre">
                                Nombre del Proyecto <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Torre Residencial"
                                required
                                className="mt-1"
                            />
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Descripción del proyecto"
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        {/* Niveles */}
                        <div>
                            <Label htmlFor="niveles">Niveles</Label>
                            <Input
                                id="niveles"
                                type="number"
                                value={formData.niveles}
                                onChange={(e) => setFormData({ ...formData, niveles: e.target.value })}
                                placeholder="0"
                                className="mt-1"
                            />
                        </div>

                        {/* UPEs */}
                        <div>
                            <Label htmlFor="numero_upes">Número de UPEs</Label>
                            <Input
                                id="numero_upes"
                                type="number"
                                value={formData.numero_upes}
                                onChange={(e) => setFormData({ ...formData, numero_upes: e.target.value })}
                                placeholder="0"
                                className="mt-1"
                            />
                        </div>

                        {/* Metros cuadrados */}
                        <div>
                            <Label htmlFor="metros_cuadrados">Metros Cuadrados</Label>
                            <Input
                                id="metros_cuadrados"
                                type="number"
                                step="0.01"
                                value={formData.metros_cuadrados}
                                onChange={(e) => setFormData({ ...formData, metros_cuadrados: e.target.value })}
                                placeholder="0.00"
                                className="mt-1"
                            />
                        </div>

                        {/* Estacionamientos */}
                        <div>
                            <Label htmlFor="numero_estacionamientos">Estacionamientos</Label>
                            <Input
                                id="numero_estacionamientos"
                                type="number"
                                value={formData.numero_estacionamientos}
                                onChange={(e) => setFormData({ ...formData, numero_estacionamientos: e.target.value })}
                                placeholder="0"
                                className="mt-1"
                            />
                        </div>

                        {/* Valor Total */}
                        <div>
                            <Label htmlFor="valor_total">Valor Total</Label>
                            <Input
                                id="valor_total"
                                type="number"
                                step="0.01"
                                value={formData.valor_total}
                                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                                placeholder="0.00"
                                className="mt-1"
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <Label htmlFor="estado">Estado</Label>
                            <Select
                                value={formData.estado}
                                onValueChange={(value) => setFormData({ ...formData, estado: value })}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Planificado">Planificado</SelectItem>
                                    <SelectItem value="En venta">En venta</SelectItem>
                                    <SelectItem value="Terminado">Terminado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                                'Guardar Proyecto'
                            )}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal de Confirmación */}
            <ReusableModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Desactivar Proyecto"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Estás seguro de que deseas desactivar el proyecto{' '}
                                <span className="font-semibold">{itemToDelete?.nombre}</span>?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                El proyecto ya no aparecerá en las listas principales.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Desactivar
                        </Button>
                    </div>
                </div>
            </ReusableModal>

            {/* Modales de Import/Export */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarProyectos}
                onSuccess={() => {
                    fetchData(currentPage, pageSize);
                    toast.success('Proyectos importados exitosamente');
                }}
                templateUrl="/contabilidad/proyectos/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PROYECTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />
        </div>
    );
}
