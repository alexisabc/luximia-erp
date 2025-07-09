// app/clientes/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';

export default function ClientesPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const { ref, pageSize } = useResponsivePageSize(57);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        setError(null);
        try {
            const res = await getClientes(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los clientes.');
            console.error("Error en fetchData:", err);
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setEditingCliente(null);
        setFormData({ nombre_completo: '', email: '', telefono: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (cliente) => {
        setEditingCliente(cliente);
        setFormData({ nombre_completo: cliente.nombre_completo, email: cliente.email || '', telefono: cliente.telefono || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, formData);
            } else {
                await createCliente(formData);
            }
            setIsModalOpen(false);
            // Vuelve a la página actual para ver el cambio
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el cliente.');
        }
    };

    const handleDeleteClick = async (clienteId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            try {
                await deleteCliente(clienteId);
                // Si estamos en una página que queda vacía, retrocedemos a la anterior
                const newTotalPages = Math.ceil((pageData.count - 1) / pageSize);
                const newCurrentPage = Math.min(currentPage, newTotalPages > 0 ? newTotalPages : 1);
                fetchData(newCurrentPage, pageSize);
            } catch (err) {
                setError('Este cliente tiene contratos y no puede ser eliminado.');
            }
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

    const columns = [
        {
            header: 'Nombre Completo',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</span>
        },
        {
            header: 'Proyectos',
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.proyectos_asociados?.map((proyecto, index) => (
                        <span
                            key={index}
                            // Usamos la función para obtener el estilo dinámicamente
                            className={`px-2.5 py-1 text-xs font-medium rounded-md ${getProjectBadgeStyle(proyecto)}`}
                        >
                            {proyecto}
                        </span>
                    ))}
                </div>
            )
        },
        {
            header: 'Email',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.email}</span>
        },
        {
            header: 'Teléfono',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.telefono}</span>
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right space-x-4 whitespace-nowrap">
                    {/* ### CAMBIO: Usamos 'cxc' en los permisos ### */}
                    {hasPermission('cxc.change_cliente') && (
                        <button onClick={() => handleEditClick(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                    )}
                    {hasPermission('cxc.delete_cliente') && (
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
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Clientes</h1>
                    {/* ### CAMBIO: Usamos 'cxc' en el permiso ### */}
                    {hasPermission('cxc.add_cliente') && (
                        <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Nuevo Cliente
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

            <Modal title={editingCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        {/* Se añade text-gray-900 */}
                        <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        {/* Se añade text-gray-900 */}
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        {/* Se añade text-gray-900 */}
                        <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Guardar Cliente
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}