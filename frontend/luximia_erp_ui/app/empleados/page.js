// app/empleados/page.js
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
} from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import FormModal from '../../components/FormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ReusableTable from '../../components/ReusableTable';

const EMPLEADO_COLUMNAS_DISPLAY = [
    { header: 'Usuario', render: (row) => row.user_username },
    { header: 'Departamento', render: (row) => row.departamento_nombre },
    { header: 'Puesto', render: (row) => row.puesto_nombre },
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
            const [usersRes, deptRes, puestoRes] = await Promise.all([
                getUsers(),
                getDepartamentos(),
                getPuestos(),
            ]);
            setUsers(usersRes.data);
            setDepartamentos(deptRes.data);
            setPuestos(puestoRes.data);
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

    const EMPLEADO_FORM_FIELDS = [
        {
            name: 'user',
            label: 'Usuario',
            type: 'select',
            required: true,
            options: users.map((u) => ({ value: u.id, label: u.username })),
        },
        {
            name: 'departamento',
            label: 'Departamento',
            type: 'select',
            required: true,
            options: departamentos.map((d) => ({ value: d.id, label: d.nombre })),
        },
        {
            name: 'puesto',
            label: 'Puesto',
            type: 'select',
            required: true,
            options: puestos.map((p) => ({ value: p.id, label: p.nombre })),
        },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Empleados</h1>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.can_view_inactive_records') && (
                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                        </button>
                    )}
                    {hasPermission('cxc.add_empleado') && (
                        <button
                            onClick={handleCreateClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + Nuevo Empleado
                        </button>
                    )}
                </div>
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
                />
            </div>

            <div className="flex-shrink-0 flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Total: {pageData.count} registros
                </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pageData.previous}
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next}
                        className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                        Siguiente
                    </button>
                </div>
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
            />
        </div>
    );
}

