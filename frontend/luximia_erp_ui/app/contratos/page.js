// app/contratos/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getContratos, createContrato, getClientes, getUPEsDisponibles, exportContratosExcel } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import ReusableTable from '../../components/ReusableTable';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';
import { formatCurrency } from '../../utils/formatters';
import ExportModal from '../../components/ExportModal';
import { TableCellsIcon } from '@heroicons/react/24/solid';

// ### 2. Define las columnas para la tabla y la exportación ###
const CONTRATO_COLUMNAS_DISPLAY = [
    { header: 'Cliente', render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.cliente.nombre_completo}</span> },
    { header: 'UPE Vendida', render: (row) => <span className="text-gray-600 dark:text-gray-400">{`${row.upe.proyecto_nombre} - ${row.upe.identificador}`}</span> },
    { header: 'Fecha Venta', render: (row) => new Date(row.fecha_venta + 'T06:00:00').toLocaleDateString('es-MX') },
    { header: 'Precio Pactado', render: (row) => <div className="text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(row.precio_final_pactado, row.moneda_pactada)}</div> },
    { header: 'Estado', render: (row) => <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${row.estado === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{row.estado}</span> },
];

const CONTRATO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID Contrato' },
    { id: 'cliente__nombre_completo', label: 'Cliente' },
    { id: 'upe__proyecto__nombre', label: 'Proyecto' },
    { id: 'upe__identificador', label: 'UPE' },
    { id: 'fecha_venta', label: 'Fecha de Venta' },
    { id: 'precio_final_pactado', label: 'Precio Pactado' },
    { id: 'moneda_pactada', label: 'Moneda' },
    { id: 'estado', label: 'Estado' },
];

export default function ContratosPage() {
    const { hasPermission } = useAuth();
    const [pageData, setPageData] = useState({ results: [], count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [clientes, setClientes] = useState([]);
    const [upesDisponibles, setUpesDisponibles] = useState([]);
    const [error, setError] = useState(null);
    const { ref, pageSize } = useResponsivePageSize(57);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        upe: '',
        cliente: '',
        fecha_venta: new Date().toISOString().split('T')[0],
        precio_final_pactado: '',
        moneda_pactada: 'USD',
        monto_enganche: '',
        numero_mensualidades: '',
        tasa_interes_mensual: '0.03'
    });

    // ### 3. Añade los estados y manejadores para la exportación ###
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        CONTRATO_COLUMNAS_EXPORT.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleExport = async () => {
        const columnsToExport = CONTRATO_COLUMNAS_EXPORT
            .filter(c => selectedColumns[c.id])
            .map(c => c.id);

        try {
            const response = await exportContratosExcel(columnsToExport);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_contratos.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExportModalOpen(false);
        } catch (err) {
            setError('No se pudo exportar el archivo.');
        }
    };


    const fetchData = useCallback(async (page, size) => {
        if (!size || size <= 0) return;
        setError(null);
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
            setError('No se pudieron cargar los datos.');
        }
    }, []);

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
        setFormData({
            upe: '', cliente: '', fecha_venta: new Date().toISOString().split('T')[0],
            precio_final_pactado: '', moneda_pactada: 'USD', monto_enganche: '',
            numero_mensualidades: '', tasa_interes_mensual: '0.03'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createContrato(formData);
            setIsModalOpen(false);
            fetchData(1, pageSize);
        } catch (err) {
            setError('Error al crear el contrato. Revisa los campos.');
        }
    };


    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Contratos</h1>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.add_contrato') && <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Nuevo Contrato</button>}
                    {/* Botón de Exportar */}
                    <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg" title="Exportar a Excel"><TableCellsIcon className="h-6 w-6" /></button>
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div ref={ref} className="flex-grow min-h-0">
                {/* ### 4. Usa ReusableTable con la prop 'actions' ### */}
                <ReusableTable
                    data={pageData.results}
                    columns={CONTRATO_COLUMNAS_DISPLAY}
                    actions={{
                        onView: true,
                        viewPath: '/contratos'
                    }}
                />
            </div>

            <div className="flex-shrink-0 flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">Total: {pageData.count} registros</span>
                {/* Paginación */}
            </div>

            <Modal title="Crear Nuevo Contrato" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* --- Datos Generales --- */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 border-b dark:border-gray-600 pb-2">Datos Generales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Cliente</label>
                                <select name="cliente" value={formData.cliente} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900">
                                    <option value="" disabled>Seleccione un cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">UPE Disponible</label>
                                <select name="upe" value={formData.upe} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900">
                                    <option value="" disabled>Seleccione una UPE</option>
                                    {upesDisponibles.map(u => <option key={u.id} value={u.id}>{`${u.proyecto_nombre} - ${u.identificador}`}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Fecha de Venta</label>
                            <input type="date" name="fecha_venta" value={formData.fecha_venta} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" />
                        </div>
                    </div>

                    {/* --- Términos Financieros --- */}
                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 border-b dark:border-gray-600 pb-2">Términos Financieros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Precio Final Pactado</label>
                                <input type="number" step="0.01" name="precio_final_pactado" value={formData.precio_final_pactado} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Moneda</label>
                                <select name="moneda_pactada" value={formData.moneda_pactada} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900">
                                    <option value="USD">USD</option>
                                    <option value="MXN">MXN</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Monto de Enganche</label>
                                <input type="number" step="0.01" name="monto_enganche" value={formData.monto_enganche} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">No. de Mensualidades</label>
                                <input type="number" name="numero_mensualidades" value={formData.numero_mensualidades} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Crear Contrato y Plan de Pagos
                        </button>
                    </div>
                </form>
            </Modal>
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                columns={CONTRATO_COLUMNAS_EXPORT}
                selectedColumns={selectedColumns}
                onColumnChange={handleColumnChange}
                onDownload={handleExport}
            />
        </div>
    );
}