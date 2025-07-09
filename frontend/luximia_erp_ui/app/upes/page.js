// app/upes/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUPEs, getAllProyectos, createUPE, updateUPE, deleteUPE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import { formatCurrency } from '../../utils/formatters'; // Importar el formateador de moneda

export default function UPEsPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [proyectos, setProyectos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ identificador: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
    const [editingUPE, setEditingUPE] = useState(null);

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        setError(null);
        try {
            const [upesRes, proyectosRes] = await Promise.all([
                getUPEs(page, size),
                getAllProyectos()
            ]);
            setPageData(upesRes.data);
            setProyectos(proyectosRes.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setEditingUPE(null);
        setFormData({ identificador: '', valor_total: '', moneda: 'USD', estado: 'Disponible', proyecto: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (upe) => {
        setEditingUPE(upe);
        // ### CAMBIO 1 ###: 'upe.proyecto' ahora es el ID directamente. No necesitamos '.id'.
        setFormData({ ...upe, proyecto: upe.proyecto });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUPE) {
                await updateUPE(editingUPE.id, formData);
            } else {
                await createUPE(formData);
            }
            setIsModalOpen(false);
            fetchData(currentPage, pageSize);
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).flat().join(', ') : 'Error al guardar la UPE.';
            setError(errorMessages);
        }
    };

    const handleDeleteClick = async (upeId) => {
        if (window.confirm('¿Estás seguro? Si esta UPE tiene un contrato, no podrá ser eliminada.')) {
            try {
                await deleteUPE(upeId);
                fetchData(currentPage, pageSize);
            } catch (err) {
                setError('Error al eliminar. La UPE podría tener un contrato asociado.');
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
            header: 'Identificador',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.identificador}</span>
        },
        {
            header: 'Proyecto',
            render: (row) => (
                // Usamos la función para obtener el estilo dinámicamente
                <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${getProjectBadgeStyle(row.proyecto_nombre)}`}>
                    {row.proyecto_nombre}
                </span>
            )
        },
        {
            header: 'Estado',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.estado}</span>
        },
        {
            header: 'Valor Total',
            render: (row) => (
                <div className="text-right text-gray-900 dark:text-white">
                    {formatCurrency(row.valor_total, row.moneda)}
                </div>
            )
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right space-x-4 whitespace-nowrap">
                    {hasPermission('api.change_upe') && (
                        <button onClick={() => handleEditClick(row)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                    )}
                    {hasPermission('api.delete_upe') && (
                        <button onClick={() => handleDeleteClick(row.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            {/* ... El resto del JSX no necesita cambios ... */}
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de UPEs</h1>
                    {hasPermission('api.add_upe') && (
                        <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Nueva UPE
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
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={!pageData.previous} className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Anterior</button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={!pageData.next} className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Siguiente</button>
                </div>
            </div>

            <Modal title={editingUPE ? 'Editar UPE' : 'Crear Nueva UPE'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Identificador</label>
                        <input type="text" name="identificador" value={formData.identificador} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                        <select name="proyecto" value={formData.proyecto} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                            <option value="" disabled>Seleccione un proyecto</option>
                            {proyectos.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-2/3">
                            <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                            <input type="number" step="0.01" name="valor_total" value={formData.valor_total} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Moneda</label>
                            <select name="moneda" value={formData.moneda} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                                <option value="USD">USD</option>
                                <option value="MXN">MXN</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select name="estado" value={formData.estado} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                            <option value="Disponible">Disponible</option>
                            <option value="Vendida">Vendida</option>
                            <option value="Pagada">Pagada y Entregada</option>
                            <option value="Bloqueada">Bloqueada</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar UPE</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}