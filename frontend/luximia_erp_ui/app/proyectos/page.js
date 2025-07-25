// app/proyectos/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProyectos, createProyecto, updateProyecto, deleteProyecto, exportProyectosExcel } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReusableTable from '../../components/ReusableTable';
import FormModal from '../../components/FormModal'; // <-- Usa el FormModal
import ExportModal from '../../components/ExportModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { TableCellsIcon } from '@heroicons/react/24/solid';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';


const PROYECTO_COLUMNAS_DISPLAY = [
    { header: 'Nombre del Proyecto', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre}</span> },
    { header: 'Descripción', render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.descripcion}</span> },
];

const PROYECTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' }, { id: 'nombre', label: 'Nombre' },
    { id: 'descripcion', label: 'Descripción' }, { id: 'activo', label: 'Estado' }
];


const PROYECTO_FORM_FIELDS = [
    { name: 'nombre', label: 'Nombre del Proyecto', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' }
];

export default function ProyectosPage() {
    const { hasPermission, authTokens } = useAuth();

    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [error, setError] = useState(null);

    // Estados para los modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estados para la gestión de datos
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
    const [editingProject, setEditingProject] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        PROYECTO_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;

        try {
            // Ahora getProyectos también acepta 'page' y 'size'
            const res = await getProyectos(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los proyectos.');
            console.error(err);
        }
    }, [authTokens]);

    useEffect(() => {
        if (pageSize > 0) {
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);
    

    const handlePageChange = (newPage) => {
        const totalPages = pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1;
        if (newPage > 0 && newPage <= totalPages) {
            fetchData(newPage, pageSize);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreateClick = () => {
        setEditingProject(null);
        setFormData({ nombre: '', descripcion: '' });
        setIsFormModalOpen(true);
    };

    const handleEditClick = (proyecto) => {
        setEditingProject(proyecto);
        setFormData({ nombre: proyecto.nombre, descripcion: proyecto.descripcion || '' });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (proyectoId) => {
        setItemToDelete(proyectoId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteProyecto(itemToDelete);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al eliminar el proyecto.');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingProject) {
                await updateProyecto(editingProject.id, formData);
            } else {
                await createProyecto(formData);
            }
            setIsFormModalOpen(false); 
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el proyecto.');
            console.error(err);
        }
    };

    const handleExport = async () => {
        const columnsToExport = PROYECTO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportProyectosExcel(columnsToExport);

            // ### LÓGICA PARA CREAR Y DESCARGAR EL BLOB ###
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_proyectos.xlsx'; // Puedes hacer este nombre dinámico si quieres
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

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Proyectos</h1>
                    <div className="flex items-center space-x-3">
                        {hasPermission('cxc.add_proyecto') && (
                            <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                + Nuevo Proyecto
                            </button>
                        )}
                        <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg" title="Exportar a Excel">
                            <TableCellsIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div ref={ref} className="flex-grow min-h-0">
                {/* ### CAMBIO 4: Se añade la prop 'actions' a la tabla ### */}
                <ReusableTable
                    data={pageData.results}
                    columns={PROYECTO_COLUMNAS_DISPLAY}
                    actions={{
                        onEdit: hasPermission('cxc.change_proyecto') ? handleEditClick : null,
                        onDelete: hasPermission('cxc.delete_proyecto') ? handleDeleteClick : null
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pageData.next}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            <FormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                formData={formData}
                onFormChange={handleInputChange}
                onSubmit={handleSubmit}
                fields={PROYECTO_FORM_FIELDS}
                submitText="Guardar Proyecto"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={PROYECTO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Desactivar Proyecto"
                message="¿Estás seguro de que deseas desactivar este Proyecto? Ya no aparecerá en las listas principales."
                confirmText="Desactivar"
            />
        </div>
    );
}
