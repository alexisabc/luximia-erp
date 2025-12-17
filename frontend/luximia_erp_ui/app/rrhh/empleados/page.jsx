// app/empleados/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    importarEmpleados // Imported
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ExportModal from '@/components/ui/modals/Export';
import ImportModal from '@/components/ui/modals/Import'; // Imported
import ActionButtons from '@/components/common/ActionButtons';

const EMPLEADO_COLUMNAS_DISPLAY = [
    { header: 'Usuario', render: (row) => row.user_username },
    { header: 'Departamento', render: (row) => row.departamento_nombre },
    { header: 'Puesto', render: (row) => row.puesto_nombre },
];

const EMPLEADO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'user_username', label: 'Usuario' },
    { id: 'departamento_nombre', label: 'Departamento' },
    { id: 'puesto_nombre', label: 'Puesto' },
    { id: 'activo', label: 'Estado' },
];

export default function EmpleadosPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Added
    const [formData, setFormData] = useState({ user: '', departamento: '', puesto: '' });
    const [editingEmpleado, setEditingEmpleado] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [users, setUsers] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        EMPLEADO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const [loading, setLoading] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);

    const hasInitialData = React.useRef(false);

    const fetchData = useCallback(
        async (page, isPageChange = false, search = searchQuery) => {
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
                setError('No se pudieron cargar los empleados.');
            } finally {
                setLoading(false);
                setIsPaginating(false);
            }
        },
        [showInactive, pageSize, searchQuery]
    );

    const fetchOptions = useCallback(async () => {
        try {
            // Aseguramos que la llamada a getUsers sea exitosa y devuelva un arreglo
            const [usersRes, deptRes, puestoRes] = await Promise.all([
                getUsers(1, 1000),
                getDepartamentos(),
                getPuestos(),
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
            setError('No se pudieron cargar los catálogos.');
        }
    }, []);

    useEffect(() => {
        fetchData(1);
        fetchOptions();
    }, [fetchData, fetchOptions]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, true);
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        fetchData(1, false, query);
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmpleado) {
                await updateEmpleado(editingEmpleado.id, formData);
            } else {
                await createEmpleado(formData);
            }
            setIsFormModalOpen(false);
            fetchData(currentPage);
        } catch (err) {
            setError('Error al guardar el empleado.');
        }
    };

    const handleCreateClick = () => {
        setEditingEmpleado(null);
        setFormData({ user: '', departamento: '', puesto: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (empleado) => {
        setEditingEmpleado(empleado);
        setFormData({ user: empleado.user, departamento: empleado.departamento, puesto: empleado.puesto });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEmpleado(itemToDelete);
            fetchData(currentPage);
        } catch (err) {
            setError('Error al eliminar el empleado.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteEmpleado(id);
            fetchData(currentPage);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = EMPLEADO_COLUMNAS_EXPORT.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const response = await exportEmpleadosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_empleados.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };

    const EMPLEADO_FORM_FIELDS = [
        {
            name: 'user',
            label: 'Usuario',
            type: 'select',
            required: true,
            // Aquí se agrega la validación para asegurarse de que `users` es un array
            options: Array.isArray(users) ? users.map((u) => ({ value: u.id, label: u.username })) : [],
        },
        {
            name: 'departamento',
            label: 'Departamento',
            type: 'select',
            required: true,
            options: Array.isArray(departamentos) ? departamentos.map((d) => ({ value: d.id, label: d.nombre })) : [],
        },
        {
            name: 'puesto',
            label: 'Puesto',
            type: 'select',
            required: true,
            options: Array.isArray(puestos) ? puestos.map((p) => ({ value: p.id, label: p.nombre })) : [],
        },
    ];

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Gestión de Empleados
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra el personal y sus asignaciones.</p>
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

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={EMPLEADO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('rrhh.change_empleado') ? handleEditClick : null,
                        onDelete: hasPermission('rrhh.delete_empleado') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('rrhh.hard_delete_empleado') ? handleHardDelete : null,
                    }}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
                    onSearch={handleSearch}
                />
            </div>

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingEmpleado ? 'Editar Empleado' : 'Crear Nuevo Empleado'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={EMPLEADO_FORM_FIELDS}
                submitText="Guardar Empleado"
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Empleado"
                message="¿Estás seguro de que deseas desactivar este empleado? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarEmpleados}
                onSuccess={() => fetchData(currentPage)}
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={EMPLEADO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}
