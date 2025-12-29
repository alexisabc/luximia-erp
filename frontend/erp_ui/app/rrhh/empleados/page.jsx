'use client';

/**
 * Página de Gestión de Empleados - Actualizada v2.6
 * 
 * Características:
 * - ✅ Responsive (móvil → TV)
 * - ✅ Dark mode completo
 * - ✅ Stats cards con gradientes
 * - ✅ Toasts modernos (Sonner)
 * - ✅ Componentes reutilizables
 * - ✅ Iconos Lucide
 * - ✅ Modal de detalle de empleado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Users, Plus, Loader2, UserCheck,
    Building, Briefcase, AlertCircle, Eye
} from 'lucide-react';

// Componentes
import ReusableTable from '@/components/tables/ReusableTable';
import ReusableModal from '@/components/modals/ReusableModal';
import ActionButtons from '@/components/common/ActionButtons';
import EmployeeDetailModal from '@/components/rrhh/EmployeeDetailModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Servicios
import {
    getEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    getInactiveEmpleados,
    hardDeleteEmpleado,
    getDepartamentos,
    getPuestos,
    getUsers,
    exportEmpleadosExcel,
    importarEmpleados
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Modales legacy
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const EMPLEADO_COLUMNAS_DISPLAY = [
    {
        header: 'Empleado',
        render: (row) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {row.nombres?.charAt(0)}{row.apellido_paterno?.charAt(0)}
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.nombres} {row.apellido_paterno}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {row.correo_laboral || row.user_email || 'Sin correo'}
                    </div>
                </div>
            </div>
        )
    },
    {
        header: 'Centro de Trabajo',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                    {row.centro_trabajo_nombre || 'N/A'}
                </span>
            </div>
        )
    },
    {
        header: 'Departamento',
        render: (row) => (
            <Badge variant="outline" className="font-medium">
                {row.departamento_nombre}
            </Badge>
        )
    },
    {
        header: 'Puesto',
        render: (row) => (
            <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                    {row.puesto_nombre}
                </span>
            </div>
        )
    }
];

const EMPLEADO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'user_username', label: 'Usuario' },
    { id: 'departamento_nombre', label: 'Departamento' },
    { id: 'puesto_nombre', label: 'Puesto' },
    { id: 'activo', label: 'Estado' }
];

export default function EmpleadosPage() {
    const { hasPermission } = useAuth();

    // Estados
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Formulario
    const [formData, setFormData] = useState({ user: '', departamento: '', puesto: '' });
    const [editingEmpleado, setEditingEmpleado] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Catálogos
    const [users, setUsers] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [puestos, setPuestos] = useState([]);

    // Export
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        EMPLEADO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const pageSize = 10;
    const hasInitialData = useRef(false);

    // Estadísticas calculadas
    const stats = [
        {
            label: 'Total Empleados',
            value: pageData.count || 0,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700'
        },
        {
            label: 'Activos',
            value: pageData.results?.filter(e => e.activo).length || 0,
            icon: UserCheck,
            gradient: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700'
        },
        {
            label: 'Departamentos',
            value: new Set(pageData.results?.map(e => e.departamento_nombre)).size || 0,
            icon: Building,
            gradient: 'from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700'
        },
        {
            label: 'Puestos',
            value: new Set(pageData.results?.map(e => e.puesto_nombre)).size || 0,
            icon: Briefcase,
            gradient: 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700'
        }
    ];

    // Cargar datos
    const fetchData = useCallback(async (page, isPageChange = false, search = searchQuery) => {
        if (hasInitialData.current || isPageChange) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive
                ? await getInactiveEmpleados(page, pageSize, { search })
                : await getEmpleados(page, pageSize, { search });
            setPageData(res.data);
            setCurrentPage(page);
            hasInitialData.current = true;
        } catch (err) {
            console.error(err);
            toast.error('Error cargando empleados');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [showInactive, pageSize, searchQuery]);

    const fetchOptions = useCallback(async () => {
        try {
            const [usersRes, deptRes, puestoRes] = await Promise.all([
                getUsers(1, 1000),
                getDepartamentos(),
                getPuestos()
            ]);

            const usersData = Array.isArray(usersRes.data)
                ? usersRes.data
                : usersRes.data?.results || [];
            const deptData = Array.isArray(deptRes.data)
                ? deptRes.data
                : deptRes.data?.results || [];
            const puestoData = Array.isArray(puestoRes.data)
                ? puestoRes.data
                : puestoRes.data?.results || [];

            setUsers(usersData);
            setDepartamentos(deptData);
            setPuestos(puestoData);
        } catch (err) {
            console.error(err);
            toast.error('Error cargando catálogos');
        }
    }, []);

    useEffect(() => {
        fetchData(1);
        fetchOptions();
    }, [fetchData, fetchOptions]);

    // Handlers
    const handlePageChange = (newPage) => {
        fetchData(newPage, true);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, false, query);
    }, [fetchData]);

    const handleCreateClick = () => {
        setEditingEmpleado(null);
        setFormData({ user: '', departamento: '', puesto: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (empleado) => {
        setEditingEmpleado(empleado);
        setFormData({
            user: empleado.user,
            departamento: empleado.departamento,
            puesto: empleado.puesto
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (empleado) => {
        setItemToDelete(empleado);
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingEmpleado) {
                await updateEmpleado(editingEmpleado.id, formData);
                toast.success('Empleado actualizado exitosamente');
            } else {
                await createEmpleado(formData);
                toast.success('Empleado creado exitosamente');
            }
            setIsFormModalOpen(false);
            fetchData(currentPage);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar el empleado');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteEmpleado(itemToDelete.id);
            toast.success('Empleado desactivado exitosamente');
            fetchData(currentPage);
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar el empleado');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteEmpleado(id);
            toast.success('Empleado eliminado permanentemente');
            fetchData(currentPage);
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
        const columnsToExport = EMPLEADO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportEmpleadosExcel(columnsToExport);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_empleados.xlsx';
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
                            Gestión de Empleados
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Administra el personal y sus asignaciones
                        </p>
                    </div>

                    <ActionButtons
                        showInactive={showInactive}
                        onToggleInactive={() => setShowInactive(!showInactive)}
                        canToggleInactive={hasPermission('rrhh.view_inactive_empleado')}
                        onCreate={handleCreateClick}
                        canCreate={hasPermission('rrhh.add_empleado')}
                        onImport={() => setIsImportModalOpen(true)}
                        canImport={hasPermission('rrhh.add_empleado')}
                        onExport={() => setIsExportModalOpen(true)}
                        canExport={hasPermission('rrhh.view_empleado')}
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
                        columns={EMPLEADO_COLUMNAS_DISPLAY}
                        actions={{
                            onEdit: hasPermission('rrhh.change_empleado') ? handleEditClick : null,
                            onDelete: hasPermission('rrhh.delete_empleado') ? handleDeleteClick : null,
                            onHardDelete: hasPermission('rrhh.hard_delete_empleado') ? handleHardDelete : null
                        }}
                        customActions={(row) => (
                            <button
                                onClick={() => setSelectedEmployee(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 rounded-lg transition-colors"
                                title="Ver Detalle"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                        )}
                        pagination={{
                            currentPage,
                            totalCount: pageData.count,
                            pageSize,
                            onPageChange: handlePageChange
                        }}
                        loading={loading}
                        isPaginating={isPaginating}
                        onSearch={handleSearch}
                        emptyMessage="No hay empleados disponibles"
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <ReusableModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Usuario */}
                    <div>
                        <Label htmlFor="user">
                            Usuario <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.user}
                            onValueChange={(value) => setFormData({ ...formData, user: value })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccione un usuario" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Departamento */}
                    <div>
                        <Label htmlFor="departamento">
                            Departamento <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.departamento}
                            onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccione un departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {departamentos.map((d) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>
                                        {d.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Puesto */}
                    <div>
                        <Label htmlFor="puesto">
                            Puesto <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.puesto}
                            onValueChange={(value) => setFormData({ ...formData, puesto: value })}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Seleccione un puesto" />
                            </SelectTrigger>
                            <SelectContent>
                                {puestos.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                'Guardar Empleado'
                            )}
                        </Button>
                    </div>
                </form>
            </ReusableModal>

            {/* Modal de Confirmación */}
            <ReusableModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Desactivar Empleado"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Estás seguro de que deseas desactivar a{' '}
                                <span className="font-semibold">
                                    {itemToDelete?.nombres} {itemToDelete?.apellido_paterno}
                                </span>?
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                El empleado ya no aparecerá en las listas principales.
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
                onImport={importarEmpleados}
                onSuccess={() => {
                    fetchData(currentPage);
                    toast.success('Empleados importados exitosamente');
                }}
                templateUrl="/rrhh/empleados/exportar-plantilla/"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={EMPLEADO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
                data={pageData.results}
                withPreview={true}
            />

            {/* Modal de Detalle */}
            <EmployeeDetailModal
                employee={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
            />
        </div>
    );
}
