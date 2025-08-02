//app/contratos/[id]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getContratoById, createPago, updatePago, deletePago, descargarEstadoDeCuentaPDF, getLatestTipoDeCambio, descargarEstadoDeCuentaExcel } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ReusableTable from '../../../components/ReusableTable';
import Modal from '../../../components/Modal';
import { formatCurrency } from '../../../utils/formatters';
import { SquarePen, Trash, FileDown, Download } from 'lucide-react';
import Loader from '../../../components/Loader';
import MetodoPagoSelect from '../../../components/MetodoPagoSelect';

// Componente para las tarjetas de resumen
const InfoCard = ({ title, value, isCurrency = false, currencySymbol = 'USD', color = 'text-gray-900 dark:text-white' }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>
            {isCurrency ? formatCurrency(value, currencySymbol) : (value || 0)}
        </p>
    </div>
);

const COLUMNAS_EXPORTABLES = {
    planDePagos: [
        { id: 'id', label: 'No.' }, { id: 'fecha_vencimiento', label: 'Fecha de Vencimiento' },
        { id: 'tipo', label: 'Tipo' }, { id: 'monto_programado', label: 'Monto Programado' },
        { id: 'pagado', label: 'Estado' },
    ],
    historialPagos: [
        { id: 'fecha_pago', label: 'Fecha de Pago' }, { id: 'concepto', label: 'Concepto' },
        { id: 'metodo_pago', label: 'Método' }, { id: 'ordenante', label: 'Ordenante' },
        { id: 'monto_pagado', label: 'Monto Pagado' }, { id: 'moneda_pagada', label: 'Moneda' },
        { id: 'tipo_cambio', label: 'Tipo de Cambio' }, { id: 'valor_mxn', label: 'Valor (MXN)' },
        { id: 'banco_origen', label: 'Banco Origen' }, { id: 'num_cuenta_origen', label: 'Cuenta Origen' },
        { id: 'banco_destino', label: 'Banco Destino' }, { id: 'cuenta_beneficiaria', label: 'Cuenta Beneficiaria' },
        { id: 'comentarios', label: 'Comentarios' },
    ]
};

const COLUMNAS_PDF = [
    { id: 'fecha_pago', label: 'Fecha de Pago' },
    { id: 'concepto', label: 'Concepto' },
    { id: 'metodo_pago', label: 'Método' },
    { id: 'monto_pagado', label: 'Monto Pagado' },
    { id: 'valor_mxn', label: 'Valor (MXN)' },
];

export default function ContratoDetallePage() {
    const params = useParams();
    const { id: contratoId } = params;
    const { hasPermission } = useAuth();

    const [contrato, setContrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedPdfColumns, setSelectedPdfColumns] = useState(() => {
        const allCols = {};
        COLUMNAS_PDF.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const [currentPago, setCurrentPago] = useState(null);
    const [latestTipoCambio, setLatestTipoCambio] = useState('1.0');

    const [newPagoData, setNewPagoData] = useState({
        concepto: 'ABONO', monto_pagado: '', moneda_pagada: 'USD', tipo_cambio: '1.0',
        fecha_pago: new Date().toISOString().split('T')[0], metodo_pago: '',
        ordenante: '', banco_origen: '', num_cuenta_origen: '', banco_destino: '',
        cuenta_beneficiaria: '', comentarios: ''
    });

    const [selectedColumns, setSelectedColumns] = useState(() => {
        const allCols = {};
        COLUMNAS_EXPORTABLES.planDePagos.forEach(c => allCols[`plan_${c.id}`] = true);
        COLUMNAS_EXPORTABLES.historialPagos.forEach(c => allCols[`pago_${c.id}`] = true);
        return allCols;
    });

    const fetchData = useCallback(async () => {
        if (!contratoId) return;
        setLoading(true);
        setError(null);
        try {
            const [contratoRes, tipoCambioRes] = await Promise.all([
                getContratoById(contratoId),
                getLatestTipoDeCambio()
            ]);

            setContrato(contratoRes.data);
            const valorTC = parseFloat(tipoCambioRes.data.valor);
            setLatestTipoCambio(valorTC);

            setNewPagoData(prev => ({
                ...prev,
                ordenante: contratoRes.data.cliente.nombre_completo,
                tipo_cambio: valorTC
            }));
        } catch (err) {
            setError('No se pudo cargar la información del contrato.');
            setNewPagoData(prev => ({ ...prev, tipo_cambio: 18.0 }));
        } finally {
            setLoading(false);
        }
    }, [contratoId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateClick = () => {
        setNewPagoData({
            concepto: 'ABONO',
            monto_pagado: '',
            moneda_pagada: 'USD',
            tipo_cambio: latestTipoCambio, // <-- Usa el estado más reciente
            fecha_pago: new Date().toISOString().split('T')[0],
            metodo_pago: '',
            ordenante: contrato?.cliente?.nombre_completo || '', // <-- Más seguro
            banco_origen: '',
            num_cuenta_origen: '',
            banco_destino: '',
            cuenta_beneficiaria: '',
            comentarios: ''
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPagoData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitPago = async (e) => {
        e.preventDefault();
        setError(null);
        const dataToSend = {
            ...newPagoData, contrato: contratoId,
            monto_pagado: parseFloat(newPagoData.monto_pagado) || 0,
            tipo_cambio: parseFloat(newPagoData.tipo_cambio) || 1.0,
            metodo_pago: newPagoData.metodo_pago || null,
        };
        try {
            await createPago(dataToSend);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).flat().join(', ') : 'Error al registrar el pago.';
            setError(errorMessages);
        }
    };

    const handleEditClick = (pago) => {
        setCurrentPago({ ...pago, metodo_pago: pago.metodo_pago?.id || '' });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setCurrentPago(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await updatePago(currentPago.id, { ...currentPago, metodo_pago: currentPago.metodo_pago || null });
            setIsEditModalOpen(false);
            setCurrentPago(null);
            fetchData();
        } catch (err) {
            setError('No se pudo actualizar el pago.');
        }
    };

    const handleDeletePago = async (pagoId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este pago?')) {
            try {
                await deletePago(pagoId);
                fetchData();
            } catch (err) {
                setError('No se pudo eliminar el pago.');
            }
        }
    };

    const handlePdfColumnSelectionChange = (e) => {
        const { name, checked } = e.target;
        setSelectedPdfColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleDownloadPDF = async () => {
        // 1. Filtra las columnas seleccionadas del estado 'selectedPdfColumns'
        const pagoCols = COLUMNAS_PDF
            .filter(c => selectedPdfColumns[c.id])
            .map(c => c.id);

        try {
            // 2. Pasa las columnas seleccionadas a la función del API
            const response = await descargarEstadoDeCuentaPDF(contratoId, pagoCols);

            // 3. El resto de la lógica para crear y descargar el archivo es la misma
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estado_de_cuenta_contrato_${contratoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            // 4. (Opcional) Cierra el modal después de la descarga
            setIsPdfModalOpen(false);

        } catch (error) {
            setError('No se pudo generar el PDF.');
        }
    };


    const handleColumnSelectionChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleDownloadExcel = async () => {
        const planCols = COLUMNAS_EXPORTABLES.planDePagos.filter(c => selectedColumns[`plan_${c.id}`]).map(c => c.id);
        const pagoCols = COLUMNAS_EXPORTABLES.historialPagos.filter(c => selectedColumns[`pago_${c.id}`]).map(c => c.id);
        try {
            const response = await descargarEstadoDeCuentaExcel(contratoId, planCols, pagoCols);
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estado_de_cuenta_contrato_${contratoId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsExcelModalOpen(false);
        } catch (error) {
            setError('No se pudo generar el archivo Excel.');
        }
    };

    const planPagosColumns = [
        { header: 'No.', render: (item, index) => <span className="text-gray-500">{index + 1}</span> },
        { header: 'Vencimiento', render: (item) => new Date(item.fecha_vencimiento + 'T00:00:00-06:00').toLocaleDateString('es-MX') },
        { header: 'Tipo', render: (item) => <span className="font-semibold">{item.tipo}</span> },
        { header: 'Monto Programado', render: (item) => <span className="font-semibold">{formatCurrency(item.monto_programado, contrato?.moneda_pactada)}</span> },
        { header: 'Estado', render: (item) => item.pagado ? <span className="text-green-500 font-bold">Pagado</span> : <span className="text-yellow-500 font-bold">Pendiente</span> },
    ];

    const historialPagosColumns = [
        { header: 'Fecha Pago', render: (pago) => new Date(pago.fecha_pago + 'T00:00:00-06:00').toLocaleDateString('es-MX') },
        { header: 'Concepto', render: (pago) => pago.concepto },
        { header: 'Método', render: (pago) => pago.metodo_pago ? pago.metodo_pago.nombre : '---' },
        { header: 'Monto Pagado', render: (pago) => <span className="font-semibold">{formatCurrency(pago.monto_pagado, pago.moneda_pagada)}</span> },
        { header: 'Tipo Cambio', render: (pago) => (pago.moneda_pagada === 'USD' ? parseFloat(pago.tipo_cambio).toFixed(4) : '1.00') },
        { header: 'Valor (MXN)', render: (pago) => formatCurrency(pago.valor_mxn, 'MXN') },
        { header: 'Saldo Restante', render: (pago) => <span className="font-bold text-blue-400">{formatCurrency(pago.saldo_despues_del_pago, 'MXN')}</span> },
        { header: 'Ordenante', render: (pago) => pago.ordenante || '---' },
        { header: 'Comentarios', render: (pago) => pago.comentarios || '---' },
        {
            header: 'Acciones', render: (pago) => (
                <div className="flex items-center justify-end space-x-4">
                    {hasPermission('cxc.change_pago') && (
                        <button onClick={() => handleEditClick(pago)} className="group"><SquarePen className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" /></button>
                    )}
                    {hasPermission('cxc.delete_pago') && (
                        <button onClick={() => handleDeletePago(pago.id)} className="group"><Trash className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" /></button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return <Loader className="p-8" />;
    if (error && !contrato) return <div className="p-8 text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (!contrato) return <div className="p-8">No se encontró el contrato.</div>;



    return (
        <div className="p-8 h-full flex flex-col space-y-8">
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Estado de Cuenta</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Contrato #{contrato.id} - {contrato.cliente.nombre_completo}</p>
                </div>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.add_pago') && <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Registrar Pago</button>}
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-lg"
                        title="Descargar Estado de Cuenta en PDF"
                    >
                        <FileDown className="h-6 w-6" />
                    </button>
                    <button onClick={() => setIsExcelModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg" title="Descargar Excel"><Download className="h-6 w-6" /></button>
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Resumen Financiero</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <InfoCard title="Precio de Venta" value={contrato.precio_final_pactado} isCurrency={true} currencySymbol={contrato.moneda_pactada} />
                    <InfoCard title="Total Pagado" value={contrato.total_pagado} isCurrency={true} currencySymbol={contrato.moneda_pactada} color="text-green-500" />
                    <InfoCard title="Adeudo Capital" value={contrato.adeudo} isCurrency={true} currencySymbol={contrato.moneda_pactada} />
                    <InfoCard title="Intereses Generados" value={contrato.intereses_generados} isCurrency={true} currencySymbol={contrato.moneda_pactada} color="text-yellow-500" />
                    <InfoCard title="Adeudo al Corte" value={contrato.adeudo_al_corte} isCurrency={true} currencySymbol={contrato.moneda_pactada} color="text-red-500" />
                </div>
            </div>

            <div className="flex flex-col space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex-shrink-0">Plan de Pagos Programado</h2>
                    <ReusableTable data={contrato.plan_de_pagos || []} columns={planPagosColumns} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex-shrink-0">Historial de Transacciones</h2>
                    <div className="flex-grow overflow-y-auto"><ReusableTable data={contrato.historial_con_saldo || []} columns={historialPagosColumns} /></div>
                </div>
            </div>

            <Modal title="Registrar Nuevo Pago" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmitPago}>
                    <div className="p-1 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {/* --- Fila 1 --- */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Pagado</label>
                            <input type="number" step="0.01" name="monto_pagado" value={newPagoData.monto_pagado} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label>
                            <select name="moneda_pagada" value={newPagoData.moneda_pagada} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="USD">USD</option>
                                <option value="MXN">MXN</option>
                            </select>
                        </div>
                        {newPagoData.moneda_pagada === 'USD' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cambio</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*[.,]?[0-9]*"
                                    name="tipo_cambio"
                                    value={newPagoData.tipo_cambio}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        )}

                        {/* --- Fila 2 --- */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Pago</label>
                            <input type="date" name="fecha_pago" value={newPagoData.fecha_pago} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Ingreso a Cuentas</label>
                            <input type="date" name="fecha_ingreso_cuentas" value={newPagoData.fecha_ingreso_cuentas || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>

                        {/* --- Fila 3 --- */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto del Pago</label>
                            <select name="concepto" value={newPagoData.concepto} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="ABONO">Abono a Capital</option>
                                <option value="INTERES">Pago de Intereses</option>
                                <option value="COMPLETO">Pago Completo</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                            <MetodoPagoSelect name="metodo_pago" value={newPagoData.metodo_pago} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>

                        {/* --- Fila 4 --- */}
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ordenante (Quién Paga)</label>
                            <input type="text" name="ordenante" value={newPagoData.ordenante || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>

                        {/* --- Fila 5 --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banco Origen</label>
                            <input type="text" name="banco_origen" value={newPagoData.banco_origen || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta Origen</label>
                            <input type="text" name="num_cuenta_origen" value={newPagoData.num_cuenta_origen || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banco Destino</label>
                            <input type="text" name="banco_destino" value={newPagoData.banco_destino || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta Beneficiaria</label>
                            <input type="text" name="cuenta_beneficiaria" value={newPagoData.cuenta_beneficiaria || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>

                        {/* --- Fila 6 --- */}
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</label>
                            <textarea name="comentarios" value={newPagoData.comentarios || ''} onChange={handleInputChange} rows="2" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                        </div>
                    </div>

                    {/* --- Botones de Acción --- */}
                    <div className="pt-5 flex justify-end bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Pago</button>
                    </div>
                </form>
            </Modal>
            {currentPago && (
                <Modal title={`Editar Pago #${currentPago.id}`} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="p-1 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                            {/* --- Fila 1 --- */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Pagado</label>
                                <input type="number" step="0.01" name="monto_pagado" value={currentPago.monto_pagado} onChange={handleEditFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label>
                                <select name="moneda_pagada" value={currentPago.moneda_pagada} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="USD">USD</option>
                                    <option value="MXN">MXN</option>
                                </select>
                            </div>
                            {currentPago.moneda_pagada === 'USD' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cambio</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9]*[.,]?[0-9]*"
                                        name="tipo_cambio"
                                        value={currentPago.tipo_cambio}
                                        onChange={handleEditFormChange}
                                        required
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            )}

                            {/* --- Fila 2 --- */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del Pago</label>
                                <input type="date" name="fecha_pago" value={currentPago.fecha_pago} onChange={handleEditFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Ingreso a Cuentas</label>
                                <input type="date" name="fecha_ingreso_cuentas" value={currentPago.fecha_ingreso_cuentas || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>

                            {/* --- Fila 3 --- */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto del Pago</label>
                                <select name="concepto" value={currentPago.concepto} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="APARTADO">APARTADO</option>
                                    <option value="DEVOLUCIÓN">DEVOLUCIÓN</option>
                                    <option value="DESCUENTO">DESCUENTO</option>
                                    <option value="PAGO">PAGO</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                                <MetodoPagoSelect name="metodo_pago" value={currentPago.metodo_pago} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>

                            {/* --- Fila 4 --- */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ordenante (Quién Paga)</label>
                                <input type="text" name="ordenante" value={currentPago.ordenante || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>

                            {/* --- Fila 5 --- */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banco Origen</label>
                                <input type="text" name="banco_origen" value={currentPago.banco_origen || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta Origen</label>
                                <input type="text" name="num_cuenta_origen" value={currentPago.num_cuenta_origen || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Banco Destino</label>
                                <input type="text" name="banco_destino" value={currentPago.banco_destino || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta Beneficiaria</label>
                                <input type="text" name="cuenta_beneficiaria" value={currentPago.cuenta_beneficiaria || ''} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>

                            {/* --- Fila 6 --- */}
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</label>
                                <textarea name="comentarios" value={currentPago.comentarios || ''} onChange={handleEditFormChange} rows="2" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                            </div>
                        </div>

                        {/* --- Botones de Acción --- */}
                        <div className="pt-5 flex justify-end bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                        </div>
                    </form>
                </Modal>
            )}
            <Modal title="Seleccionar Columnas para PDF" isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)}>
                <div className="space-y-4 p-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Columnas del Historial de Transacciones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {COLUMNAS_PDF.map(col => (
                            <label key={col.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name={col.id}
                                    checked={selectedPdfColumns[col.id]}
                                    onChange={handlePdfColumnSelectionChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="pt-5 mt-4 flex justify-end bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <button type="button" onClick={() => setIsPdfModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                        Cancelar
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                        Descargar PDF
                    </button>
                </div>
            </Modal>
            <Modal title="Seleccionar Columnas para Exportar a Excel" isOpen={isExcelModalOpen} onClose={() => setIsExcelModalOpen(false)}>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Columnas del Plan de Pagos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {COLUMNAS_EXPORTABLES.planDePagos.map(col => (
                                <label key={`plan_${col.id}`} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name={`plan_${col.id}`}
                                        checked={selectedColumns[`plan_${col.id}`]}
                                        onChange={handleColumnSelectionChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <hr className="dark:border-gray-700" />
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Columnas del Historial de Transacciones</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {COLUMNAS_EXPORTABLES.historialPagos.map(col => (
                                <label key={`pago_${col.id}`} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name={`pago_${col.id}`}
                                        checked={selectedColumns[`pago_${col.id}`]}
                                        onChange={handleColumnSelectionChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="pt-5 mt-4 flex justify-end bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <button type="button" onClick={() => setIsExcelModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                        Cancelar
                    </button>
                    <button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                        Descargar Excel
                    </button>
                </div>
            </Modal>
        </div>
    );
}