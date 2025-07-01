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

    // Usamos el hook para obtener la ref y el tamaño de página dinámico.
    const { ref, pageSize } = useResponsivePageSize(57); // 57px es una altura de fila estimada

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nombre_completo: '', email: '', telefono: '' });
    const [editingCliente, setEditingCliente] = useState(null);

    // Envolvemos fetchData en useCallback para estabilizar la función
    const fetchData = useCallback(async (page, size) => {
        // Agregamos una guardia extra: no hacer nada si no estamos autenticados.
        if (!authTokens || !size || size <= 0) return;

        try {
            const res = await getClientes(page, size);
            setPageData(res.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los clientes.');
            console.error("Error en fetchData:", err);
        }
    }, [authTokens]);

    // Este es el efecto principal para cargar y recargar datos.
    // Ahora depende de 'pageSize' y de la función 'fetchData' estabilizada.
    useEffect(() => {
        // Solo se ejecuta si pageSize ya tiene un valor válido y mayor que cero.
        if (pageSize > 0) {
            // Siempre que el tamaño de la página cambie, volvemos a la página 1 con el nuevo tamaño.
            fetchData(1, pageSize);
        }
    }, [pageSize, fetchData]);

    const handlePageChange = (newPage) => {
        // Aseguramos que 'pageSize' sea un número válido antes de calcular el total de páginas.
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
            fetchData(currentPage, pageSize);
        } catch (err) {
            setError('Error al guardar el cliente.');
        }
    };

    const handleDeleteClick = async (clienteId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            try {
                await deleteCliente(clienteId);
                fetchData(currentPage, pageSize);
            } catch (err) {
                setError('Este cliente tiene contratos y no puede ser eliminado.');
            }
        }
    };

    const columns = [
        {
            header: 'Nombre Completo',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.nombre_completo}</span>
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
                    {hasPermission('api.change_cliente') && (
                        <button onClick={() => handleEditClick(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                    )}
                    {hasPermission('api.delete_cliente') && (
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
                    {hasPermission('api.add_cliente') && (
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

            <Modal title={editingCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
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