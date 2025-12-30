'use client';

/**
 * Página de Gestión de Departamentos - MIGRADA a Atomic Design v3.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Briefcase, Users, Building, AlertCircle } from 'lucide-react';

// Componentes Atomic Design
import ListPageTemplate from '@/components/templates/ListPageTemplate';
import DataTable from '@/components/organisms/DataTable';
import Modal, { ConfirmModal } from '@/components/organisms/Modal';
import { StatCard, ActionButtonGroup } from '@/components/molecules';
import { FormField } from '@/components/molecules';
import Button from '@/components/atoms/Button';
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

const DEPARTAMENTO_COLUMNAS = [
    {
        header: 'Departamento',
        accessorKey: 'nombre',
        cell: (row) => (
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
        accessorKey: 'activo',
        cell: (row) => (
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

    // Stats
    const statsData = [
        {
            title: 'Total Departamentos',
            value: pageData.count || 0,
            icon: Briefcase,
            variant: 'primary'
        },
        {
            title: 'Activos',
            value: pageData.results?.filter(d => d.activo).length || 0,
            icon: Building,
            variant: 'success'
        },
        {
            title: 'Inactivos',
            value: pageData.results?.filter(d => !d.activo).length || 0,
            icon: AlertCircle,
            variant: 'warning'
        },
        {
            title: 'Empleados',
            value: 0,
            icon: Users,
            variant: 'info'
        }
    ];

    return (
        <ListPageTemplate
            title="Gestión de Departamentos"
            description="Organiza la estructura interna de la empresa"
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
                    canToggleInactive={hasPermission('rrhh.view_inactive_departamento')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('rrhh.add_departamento')}
                    createLabel="Nuevo Departamento"
                    onImport={() => setIsImportModalOpen(true)}
                    canImport={hasPermission('rrhh.add_departamento')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('rrhh.view_departamento')}
                />
            }
        >
            <DataTable
                data={pageData.results}
                columns={DEPARTAMENTO_COLUMNAS}
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
                mobileCardView={true}
                sortable={true}
            />

            {/* Modal de Formulario */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
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
                            Guardar Departamento
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre del Departamento"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ nombre: e.target.value })}
                        placeholder="Ej: Recursos Humanos"
                        required
                    />
                </form>
            </Modal>

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Departamento"
                description={`¿Estás seguro de que deseas desactivar el departamento ${itemToDelete?.nombre}? El departamento ya no aparecerá en las listas principales.`}
                confirmLabel="Desactivar"
                cancelLabel="Cancelar"
                variant="warning"
            />

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
        </ListPageTemplate>
    );
}
