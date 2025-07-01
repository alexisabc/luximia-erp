// app/contratos/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getContratos, createContrato, getClientes, getUPEsDisponibles } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import Link from 'next/link';
import { formatCurrency } from '../../utils/formatters'; // Importamos el formateador

export default function ContratosPage() {
    const { hasPermission, authTokens } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [clientes, setClientes] = useState([]);
    const [upesDisponibles, setUpesDisponibles] = useState([]);
    const [error, setError] = useState(null);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ upe: '', cliente: '', fecha_venta: '', precio_final_pactado: '', moneda_pactada: 'USD' });

    const fetchData = useCallback(async (page, size) => {
        if (!authTokens || !size || size <= 0) return;
        setError(null); // Limpiar errores anteriores
        try {
            const [contratosRes, clientesRes, upesRes] = await Promise.all([
                getContratos(page, size),
                getClientes(1, 1000),
                getUPEsDisponibles()
            ]);

            setPageData(contratosRes.data);
            setClientes(clientesRes.data.results);
            setUpesDisponibles(upesRes.data);
            setCurrentPage(page);
        } catch (err) {
            setError('No se pudieron cargar los datos. Revisa la consola del servidor de Django para más detalles.');
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
        const today = new Date().toISOString().split('T')[0];
        setFormData({ upe: '', cliente: '', fecha_venta: today, precio_final_pactado: '', moneda_pactada: 'USD' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createContrato(formData);
            setIsModalOpen(false);
            fetchData(1, pageSize); // Volver a la página 1 para ver el nuevo registro
        } catch (err) {
            setError('Error al crear el contrato.');
        }
    };

    const columns = [
        {
            header: 'Cliente',
            render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.cliente.nombre_completo}</span>
        },
        {
            header: 'UPE Vendida',
            // ### CAMBIO 1 ###: Usamos el campo plano 'proyecto_nombre' que ahora envía el API.
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{`${row.upe.proyecto_nombre} - ${row.upe.identificador}`}</span>
        },
        {
            header: 'Fecha Venta',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{new Date(row.fecha_venta).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</span>
        },
        {
            header: 'Precio Pactado',
            render: (row) => (
                <div className="text-right text-gray-900 dark:text-white">
                    {/* Usamos el formateador de moneda para consistencia */}
                    {formatCurrency(row.precio_final_pactado, row.moneda_pactada)}
                </div>
            )
        },
        {
            header: 'Acciones',
            render: (row) => (
                <div className="text-right">
                    <Link href={`/contratos/${row.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        Ver Detalles
                    </Link>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Contratos</h1>
                    {hasPermission('api.add_contrato') && (
                        <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Nuevo Contrato
                        </button>
                    )}
                </div>
                {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
            </div>

            <div ref={ref} className="flex-grow min-h-0">
                <ReusableTable data={pageData.results} columns={columns} />
            </div>

            <div className="flex-shrink-0 flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">Total: {pageData.count} registros</span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={!pageData.previous} className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Anterior</button>
                    <span className="text-sm text-gray-700 dark:text-gray-400">Página {currentPage} de {pageSize > 0 ? Math.ceil(pageData.count / pageSize) : 1}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={!pageData.next} className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Siguiente</button>
                </div>
            </div>

            <Modal title="Crear Nuevo Contrato" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cliente</label>
                        <select name="cliente" value={formData.cliente} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                            <option value="" disabled>Seleccione un cliente</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">UPE Disponible</label>
                        <select name="upe" value={formData.upe} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                            <option value="" disabled>Seleccione una UPE</option>
                            {/* ### CAMBIO 2 ###: Usamos 'proyecto_nombre' también en el dropdown. */}
                            {upesDisponibles.map(u => <option key={u.id} value={u.id}>{`${u.proyecto_nombre} - ${u.identificador}`}</option>)}
                        </select>
                    </div>
                    {/* ... El resto del formulario no cambia ... */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Venta</label>
                        <input type="date" name="fecha_venta" value={formData.fecha_venta} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-2/3">
                            <label className="block text-sm font-medium text-gray-700">Precio Final Pactado</label>
                            <input type="number" step="0.01" name="precio_final_pactado" value={formData.precio_final_pactado} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Moneda</label>
                            <select name="moneda_pactada" value={formData.moneda_pactada} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                                <option value="USD">USD</option>
                                <option value="MXN">MXN</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Crear Contrato</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}