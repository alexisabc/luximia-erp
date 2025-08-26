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
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import ExportModal from '@/components/ui/modals/Export';
import ActionButtons from '@/components/ui/ActionButtons';

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
    const pageSize = 5;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ user: '', departamento: '', puesto: '' });
    const [editingEmpleado, setEditingEmpleado] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [users, setUsers] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const cols = {};
        EMPLEADO_COLUMNAS_EXPORT.forEach(c => (cols[c.id] = true));
        return cols;
    });

    const fetchData = useCallback(async (page) => {
        try {
            const res = showInactive ? await getInactiveEmpleados() : await getEmpleados(page, pageSize);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los empleados.');
        }
    }, [showInactive, pageSize]);

    const fetchOptions = useCallback(async () => {
        try {
            // Aseguramos que la llamada a getUsers sea exitosa y devuelva un arreglo
            const [usersRes, deptRes, puestoRes] = await Promise.all([
                getUsers(),
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
        fetchData(newPage);
    };

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
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Empleados</h1>
                <ActionButtons
                    showInactive={showInactive}
                    onToggleInactive={() => setShowInactive(!showInactive)}
                    canToggleInactive={hasPermission('cxc.can_view_inactive_records')}
                    onCreate={handleCreateClick}
                    canCreate={hasPermission('cxc.add_empleado')}
                    importHref="/importar/empleados"
                    canImport={hasPermission('cxc.add_empleado')}
                    onExport={() => setIsExportModalOpen(true)}
                    canExport={hasPermission('cxc.view_empleado')}
                />
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="flex-grow min-h-0">
                <ReusableTable
                    data={pageData.results}
                    columns={EMPLEADO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_empleado') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_empleado') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null,
                    }}
                    pagination={{
                        currentPage,
                        totalCount: pageData.count,
                        pageSize,
                        onPageChange: handlePageChange,
                    }}
                    loading={loading}
                    isPaginating={isPaginating}
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
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={EMPLEADO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onChange={handleColumnChange}
                onExport={handleExport}
            />
        </div>
    );
}