// app/proyectos/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';

export default function ProyectosPage() {
    const { hasPermission, authTokens } = useAuth();

    // Usamos el mismo estado que en Clientes para manejar la paginación
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);

    // Aplicamos el hook de tamaño de página responsivo
    const { ref, pageSize } = useResponsivePageSize(57);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
    const [editingProject, setEditingProject] = useState(null);

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

    const handleEditClick = (proyecto) => {
        setEditingProject(proyecto);
        setFormData({ nombre: proyecto.nombre, descripcion: proyecto.descripcion || '' });
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingProject(null);
        setFormData({ nombre: '', descripcion: '' });
        setIsModalOpen(true);
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
            setIsModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el proyecto.');
            console.error(err);
        }
    };

    const handleDeleteClick = async (proyectoId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
            try {
                await deleteProyecto(proyectoId);
                // En lugar de filtrar, recargamos los datos de la página actual
                fetchData(currentPage, pageSize);
            } catch (err) {
                setError('Error al eliminar el proyecto.');
                console.error(err);
            }
        }
    };

    const columns = [
        {
            header: 'Nombre del Proyecto',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre}</span>
        },
        {
            header: 'Descripción',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.descripcion}</span>
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right space-x-4">
                    {hasPermission('api.change_proyecto') && (
                        <button onClick={() => handleEditClick(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                    )}
                    {hasPermission('api.delete_proyecto') && (
                        <button onClick={() => handleDeleteClick(row.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Proyectos</h1>
                    {hasPermission('api.add_proyecto') && (
                        <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Nuevo Proyecto
                        </button>
                    )}
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div ref={ref} className="flex-grow min-h-0">
                <ReusableTable data={pageData.results} columns={columns} />
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

            <Modal title={editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Proyecto</label>
                        <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="descripcion" className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                        <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" />
                    </div>
                    <div className="flex items-center justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
