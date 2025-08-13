// app/clientes/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente, getInactiveClientes, hardDeleteCliente, exportClientesExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/modals';
import FormModal from '@/components/ui/modals/Form';
import ConfirmationModal from '@/components/ui/modals/Confirmation';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import ExportModal from '@/components/ui/modals/Export';
import { Download } from 'lucide-react';


const CLIENTE_COLUMNAS_DISPLAY = [
    { header: 'Nombre Completo', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</span> },
    { header: 'Email', render: (row) => row.email },
    { header: 'Teléfono', render: (row) => row.telefono },
];

const CLIENTE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' }, { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' }, { id: 'telefono', label: 'Teléfono' }, { id: 'activo', label: 'Estado' }
];

const CLIENTE_FORM_FIELDS = [
    { name: 'nombre_completo', label: 'Nombre Completo', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'telefono', label: 'Teléfono', type: 'tel' }
];

export default function ClientesPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        CLIENTE_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });
    const [loading, setLoading] = useState(true); // Para la carga inicial
    const [isPaginating, setIsPaginating] = useState(false); // <-- NUEVO ESTADO

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = CLIENTE_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportClientesExcel(columnsToExport);
            // ### LÓGICA PARA CREAR Y DESCARGAR EL BLOB ###
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_clientes.xlsx'; // Puedes hacer este nombre dinámico si quieres
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            // ### FIN DE LA LÓGICA ###
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };


    const fetchData = useCallback(async (page, size) => {
        // La variable 'authTokens' se usa aquí adentro, por lo que debe ser una dependencia.
        if (!authTokens || !size || size <= 0) return;

        if (pageData.results.length > 0) {
            setIsPaginating(true);
        } else {
            setLoading(true);
        }

        try {
            const res = showInactive ? await getInactiveClientes() : await getClientes(page, size); // O getProyectos, getUPEs, etc.
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
            setIsPaginating(false);
        }
    }, [authTokens, pageData.results.length, showInactive]);

    // El useEffect se queda como estaba, dependiendo solo de pageSize
    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        fetchData(newPage, pageSize);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, formData);
            } else {
                await createCliente(formData);
            }
            setIsFormModalOpen(false);
            // Vuelve a la página actual para ver el cambio
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el cliente.');
        }
    };

    const handleCreateClick = () => {
        setEditingCliente(null);
        setFormData({ nombre_completo: '', email: '', telefono: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({ nombre_completo: cliente.nombre_completo, email: cliente.email || '', telefono: cliente.telefono || '' });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (clienteId) => {
        setItemToDelete(clienteId);
        setIsConfirmModalOpen(true);
    };

    // Esta función es la que realmente EJECUTA la eliminación
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteCliente(itemToDelete);
            fetchData(currentPage, pageSize); // Refresca los datos
        } catch (err) {
            setError('Este cliente tiene contratos y no puede ser eliminado.');
        } finally {
            // Cierra el modal y resetea el estado
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleHardDelete = async (id) => {
        try {
            await hardDeleteCliente(id);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar definitivamente.');
        }
    };

    // Función para obtener el estilo del badge según el nombre del proyecto
    const getProjectBadgeStyle = (projectName) => {
        // Puedes añadir más proyectos y colores aquí
        switch (projectName.toLowerCase()) {
            case 'shark tower':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'be towers':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'torre medica':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Clientes</h1>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.can_view_inactive_records') && (
                        <button onClick={() => setShowInactive(!showInactive)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                            {showInactive ? 'Ver Activos' : 'Ver Inactivos'}
                        </button>
                    )}
                    {hasPermission('cxc.add_cliente') && <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Nuevo Cliente</button>}
                    <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg" title="Exportar a Excel"><Download className="h-6 w-6" /></button>
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="flex-grow min-h-0">
                {/* ### 4. Usa ReusableTable con la prop 'actions' ### */}
                <ReusableTable
                    data={pageData.results}
                    columns={CLIENTE_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_cliente') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_cliente') ? handleDeleteClick : null,
                        onHardDelete: hasPermission('cxc.can_delete_permanently') ? handleHardDelete : null
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
                title={editingCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={CLIENTE_FORM_FIELDS}
                submitText="Guardar Cliente"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={CLIENTE_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Cliente"
                message="¿Estás seguro de que deseas desactivar este Cliente? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}