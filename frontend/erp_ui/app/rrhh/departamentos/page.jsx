'use client';

/**
 * Página de Gestión de Departamentos - Actualizada v2.6
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
    Briefcase, Plus, Loader2, Users,
    Building, TrendingUp, AlertCircle
} from 'lucide-react';

// Componentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Servicios
import {
    getDepartamentos,
    createDepartamento,
    updateDepartamento,
    deleteDepartamento,
    getInactiveDepartamentos,
    hardDeleteDepartamento,
    exportDepartamentosExcel,
    importarDepartamentos
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Modales legacy
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const DEPARTAMENTO_COLUMNAS_DISPLAY = [
    {
        header: 'Departamento',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    <Briefcase className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {row.id}
                    </div>
                </div>
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

const DEPARTAMENTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'activo', label: 'Estado' }
];

export default function DepartamentosPage() {
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
    const [formData, setFormData] = useState({ nombre: '' });
    const [editingDepartamento, setEditingDepartamento] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Export
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        DEPARTAMENTO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Departamentos',
            value: pageData.count || 0,
            icon: Briefcase,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(d => d.activo).length || 0,
            icon: Building,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Inactivos',
            value: pageData.results?.filter(d => !d.activo).length || 0,
            icon: AlertCircle,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        },
        {
            label: 'Empleados',
            value: 0, // Esto se podría calcular si hay relación con empleados
            icon: Users,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
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
                ? await getInactiveDepartamentos(page, size, { search })
                : await getDepartamentos(page, size, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando departamentos');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, showInactive, searchQuery]);

    useEffect(() => {
        fetchData(1, pageSize);
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
        setEditingDepartamento(null);
        setFormData({ nombre: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (departamento) => {
        setEditingDepartamento(departamento);
        setFormData({ nombre: departamento.nombre });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (departamento) => {
        setItemToDelete(departamento);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingDepartamento) {
                await updateDepartamento(editingDepartamento.id, formData);
                toast.success('Departamento actualizado exitosamente');
            } else {
                await createDepartamento(formData);
                toast.success('Departamento creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el departamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteDepartamento(itemToDelete.id);
            toast.success('Departamento desactivado exitosamente');
            fetchData(currentPage, pageSize);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el departamento');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteDepartamento(id);
            toast.success('Departamento eliminado permanentemente');
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
        const columnsToExport = DEPARTAMENTO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportDepartamentosExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_departamentos.xlsx';
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
                            Gestión de Departamentos
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Organiza la estructura interna de la empresa
                        </p>
                    </div>

                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_inactive_departamento')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_departamento')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('rrhh.add_departamento')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('rrhh.view_departamento')}
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
                    <ReusableTable
                        data={pageData.results}
                        columns={DEPARTAMENTO_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('rrhh.change_departamento') ? handleEditClick : null,
                            onDelete: hasPermission('rrhh.delete_departamento') ? handleDeleteClick : null,
                            onHardDelete: showInactive && hasPermission('rrhh.delete_departamento') ? handleHardDelete : null
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
                        emptyMessage="No hay departamentos disponibles"
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <ReusableModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <Label htmlFor="nombre">
                            Nombre del Departamento <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ nombre: e.target.value })}
                            placeholder="Ej: Recursos Humanos"
                            required
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
                                'Guardar Departamento'
                            )}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal de Confirmación */}
            <ReusableModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Desactivar Departamento"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Estás seguro de que deseas desactivar el departamento{' '}
                                <span className="font-semibold">{itemToDelete?.nombre}</span>?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                El departamento ya no aparecerá en las listas principales.
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
                onImport={importarDepartamentos}
                onSuccess={() => {
                    fetchData(currentPage, pageSize);
                    toast.success('Departamentos importados exitosamente');
                }}
                templateUrl="/rrhh/departamentos/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={DEPARTAMENTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />
        </div>
    );
}
