'use client';

/**
 * Página de Gestión de Empleados - MIGRADA a Atomic Design v3.0
 * 
 * Mejoras:
 * - ✅ Usa ListPageTemplate
 * - ✅ Usa DataTable mejorado
 * - ✅ Usa ActionButtonGroup
 * - ✅ Usa StatCard
 * - ✅ Usa Modal mejorado con variantes
 * - ✅ 100% Mobile First
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
    Users, UserCheck, Building, Briefcase, Eye
} from 'lucide-react';

// Nuevos componentes Atomic Design
import ListPageTemplate from '@/components/templates/ListPageTemplate';
import DataTable from '@/components/organisms/DataTable';
import Modal, { ConfirmModal } from '@/components/organisms/Modal';
import { StatCard } from '@/components/molecules';
import { ActionButtonGroup } from '@/components/molecules';
import Button from '@/components/atoms/Button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Componentes específicos
import EmployeeDetailModal from '@/components/rrhh/EmployeeDetailModal';

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

// Modales legacy (temporal)
import ExportModal from '@/components/modals/Export';
import ImportModal from '@/components/modals/Import';

const EMPLEADO_COLUMNAS = [
    {
        header: 'Empleado',
        accessorKey: 'nombres',
        cell: (row) => (
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
        accessorKey: 'centro_trabajo_nombre',
        cell: (row) => (
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
        accessorKey: 'departamento_nombre',
        cell: (row) => (
            <Badge variant="outline" className="font-medium">
                {row.departamento_nombre}
            </Badge>
        )
    },
    {
        header: 'Puesto',
        accessorKey: 'puesto_nombre',
        cell: (row) => (
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

    // Estadísticas para StatCards
    const statsData = [
        {
            title: 'Total Empleados',
            value: pageData.count || 0,
            icon: Users,
            variant: 'primary'
        },
        {
            title: 'Activos',
            value: pageData.results?.filter(e => e.activo).length || 0,
            icon: UserCheck,
            variant: 'success',
            change: 5.2,
            changeLabel: 'vs mes anterior'
        },
        {
            title: 'Departamentos',
            value: new Set(pageData.results?.map(e => e.departamento_nombre)).size || 0,
            icon: Building,
            variant: 'info'
        },
        {
            title: 'Puestos',
            value: new Set(pageData.results?.map(e => e.puesto_nombre)).size || 0,
            icon: Briefcase,
            variant: 'warning'
        }
    ];

    return (
        <ListPageTemplate
            title="Gestión de Empleados"
            description="Administra el personal y sus asignaciones"
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
                    canToggleInactive={hasPermission('rrhh.view_inactive_empleado')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('rrhh.add_empleado')}
                    createLabel="Nuevo Empleado"
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission('rrhh.add_empleado')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('rrhh.view_empleado')}
                />
            }
        >
            <DataTable
                data={pageData.results}
                columns={EMPLEADO_COLUMNAS}
                actions={{
                    onEdit: hasPermission('rrhh.change_empleado') ? handleEditClick : null,
                    onDelete: hasPermission('rrhh.delete_empleado') ? handleDeleteClick : null,
                    onHardDelete: hasPermission('rrhh.hard_delete_empleado') ? handleHardDelete : null,
                    custom: [
                        {
                            icon: Eye,
                            onClick: (row) => setSelectedEmployee(row),
                            label: 'Ver Detalle',
                            tooltip: 'Ver Detalle'
                        }
                    ]
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
                mobileCardView={true}
                sortable={true}
            />

            {/* Modal de Formulario */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
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
                            Guardar Empleado
                        </Button>
                    </>
                }
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
                </form>
            </Modal>

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Empleado"
                description={`¿Estás seguro de que deseas desactivar a ${itemToDelete?.nombres} ${itemToDelete?.apellido_paterno}? El empleado ya no aparecerá en las listas principales.`}
                confirmLabel="Desactivar"
                cancelLabel="Cancelar"
                variant="warning"
            />

            {/* Modales de Import/Export (legacy - temporal) */}
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
        </ListPageTemplate>
    );
}
