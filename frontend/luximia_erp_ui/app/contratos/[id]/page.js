//app/contratos/[id]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getContratoById, createPago, updatePago, deletePago, descargarEstadoDeCuentaPDF, getLatestTipoDeCambio } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ReusableTable from '../../../components/ReusableTable';
import Modal from '../../../components/Modal';
import { formatCurrency } from '../../../utils/formatters';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';

// Componente para las tarjetas de resumen
const InfoCard = ({ title, value, isCurrency = false, currencySymbol = 'USD', color = 'text-gray-900 dark:text-white' }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>
            {isCurrency ? formatCurrency(value, currencySymbol) : (value || 0)}
        </p>
    </div>
);

export default function ContratoDetallePage() {
    const params = useParams();
    const { id: contratoId } = params;
    const { hasPermission } = useAuth();

    const [contrato, setContrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPago, setCurrentPago] = useState(null);

    const [latestTipoCambio, setLatestTipoCambio] = useState('1.0');


    // Estado inicial del formulario para un nuevo pago
    const [newPagoData, setNewPagoData] = useState({
        concepto: 'ABONO',
        monto_pagado: '',
        moneda_pagada: 'USD',
        tipo_cambio: latestTipoCambio,
        fecha_pago: new Date().toISOString().split('T')[0],
        instrumento_pago: 'TRANSFERENCIA INTERBANCARIA',
        ordenante: '',
        banco_origen: '',
        num_cuenta_origen: '',
        banco_destino: '',
        cuenta_beneficiaria: '',
        comentarios: ''
    });

    const fetchData = useCallback(async () => {
        if (!contratoId) return;
        setLoading(true);
        setError(null);
        try {
            // Hacemos ambas llamadas al mismo tiempo para eficiencia
            const [contratoRes, tipoCambioRes] = await Promise.all([
                getContratoById(contratoId),
                getLatestTipoDeCambio()
            ]);

            setContrato(contratoRes.data);
            const valorTC = parseFloat(tipoCambioRes.data.valor);
            setLatestTipoCambio(valorTC); 

            setNewPagoData(prev => ({
                ...prev, ordenante: contratoRes.data.cliente.nombre_completo, tipo_cambio: valorTC}));
        } catch (err) {
            setError('No se pudo cargar la información del contrato.');
            setNewPagoData(prev => ({ ...prev, tipo_cambio: 18.0 }));
        } finally {
            setLoading(false);
        }
    }, [contratoId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPagoData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitPago = async (e) => {
        e.preventDefault();
        setError(null);

        const dataToSend = {
            ...newPagoData,
            contrato: contratoId,
            monto_pagado: parseFloat(newPagoData.monto_pagado) || 0,
            tipo_cambio: parseFloat(newPagoData.tipo_cambio) || 1.0,
        };

        if (!dataToSend.fecha_ingreso_cuentas) delete dataToSend.fecha_ingreso_cuentas;
        if (!dataToSend.ordenante) delete dataToSend.ordenante;

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
        setCurrentPago({ ...pago }); // Hacemos una copia para editar de forma segura
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
            await updatePago(currentPago.id, currentPago);
            setIsEditModalOpen(false);
            setCurrentPago(null);
            fetchData();
        } catch (err) {
            setError('No se pudo actualizar el pago.');
        }
    };

    const handleDeletePago = async (pagoId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.')) {
            try {
                await deletePago(pagoId);
                fetchData(); // Refresca todos los datos del contrato
            } catch (err) {
                setError('No se pudo eliminar el pago.');
            }
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await descargarEstadoDeCuentaPDF(contratoId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estado_de_cuenta_contrato_${contratoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setError('No se pudo generar el PDF.');
        }
    };

    const planPagosColumns = [
        { header: 'No.', render: (item, index) => <span className="text-gray-500">{index + 1}</span> },
        { header: 'Vencimiento', render: (item) => new Date(item.fecha_vencimiento + 'T06:00:00').toLocaleDateString('es-MX') },
        { header: 'Tipo', render: (item) => <span className="font-semibold">{item.tipo}</span> },
        { header: 'Monto Programado', render: (item) => <span className="font-semibold">{formatCurrency(item.monto_programado, contrato?.moneda_pactada)}</span> },
        { header: 'Estado', render: (item) => item.pagado ? <span className="text-green-500 font-bold">Pagado</span> : <span className="text-yellow-500 font-bold">Pendiente</span> },
    ];

    // En tu archivo: app/contratos/[id]/page.js

    const historialPagosColumns = [
        {
            header: 'Fecha Pago',
            render: (pago) => new Date(pago.fecha_pago + 'T06:00:00').toLocaleDateString('es-MX')
        },
        {
            header: 'Concepto',
            render: (pago) => pago.concepto
        },
        {
            header: 'Instrumento',
            render: (pago) => pago.instrumento_pago || '---'
        },
        {
            header: 'Monto Pagado',
            render: (pago) => <span className="font-semibold">{formatCurrency(pago.monto_pagado, pago.moneda_pagada)}</span>
        },
        {
            header: 'Tipo Cambio',
            render: (pago) => (pago.moneda_pagada === 'USD' ? parseFloat(pago.tipo_cambio).toFixed(4) : '1.00')
        },
        {
            header: 'Valor (MXN)',
            render: (pago) => formatCurrency(pago.valor_mxn, 'MXN')
        },
        {
            header: 'Saldo Restante',
            render: (pago) => (
                <span className="font-bold text-blue-500">
                    {formatCurrency(pago.saldo_despues_del_pago, 'MXN')}
                </span>
            )
        },
        {
            header: 'Ordenante',
            render: (pago) => pago.ordenante || '---'
        },
        // ### CAMPOS AÑADIDOS ###
        {
            header: 'Banco Origen',
            render: (pago) => pago.banco_origen || '---'
        },
        {
            header: 'Cuenta Origen',
            render: (pago) => pago.num_cuenta_origen || '---'
        },
        {
            header: 'Comentarios',
            render: (pago) => pago.comentarios || '---'
        },
        // ### FIN DE CAMPOS AÑADIDOS ###
        {
            header: 'Acciones',
            render: (pago) => (
                <div className="flex items-center space-x-4">
                    {hasPermission('cxc.change_pago') && (
                        <button onClick={() => handleEditClick(pago)} className="group">
                            <PencilSquareIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                    )}
                    {hasPermission('cxc.delete_pago') && (
                        <button onClick={() => handleDeletePago(pago.id)} className="group">
                            <TrashIcon className="h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return <div className="p-8">Cargando estado de cuenta...</div>;
    if (error && !contrato) return <div className="p-8 text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (!contrato) return <div className="p-8">No se encontró el contrato.</div>;

    // ### PASO DE DEPURACIÓN 1: AÑADE ESTA LÍNEA ###
    //console.log("Datos completos del contrato que se van a renderizar:", contrato);

    return (
        <div className="p-8 h-full flex flex-col space-y-8">
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Estado de Cuenta</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Contrato #{contrato.id} - {contrato.cliente.nombre_completo}</p>
                </div>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.add_pago') && <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Registrar Pago</button>}
                    <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Descargar PDF</button>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento de Pago</label>
                            <select name="instrumento_pago" value={newPagoData.instrumento_pago} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="TRANSFERENCIA INTERBANCARIA">TRANSFERENCIA INTERBANCARIA</option>
                                <option value="EFECTIVO">EFECTIVO</option>
                                <option value="TARJETA DE CRÉDITO">TARJETA DE CRÉDITO</option>
                            </select>
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
                                    <option value="ABONO">Abono a Capital</option>
                                    <option value="INTERES">Pago de Intereses</option>
                                    <option value="COMPLETO">Pago Completo</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento de Pago</label>
                                <select name="instrumento_pago" value={currentPago.instrumento_pago} onChange={handleEditFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="TRANSFERENCIA INTERBANCARIA">TRANSFERENCIA INTERBANCARIA</option>
                                    <option value="EFECTIVO">EFECTIVO</option>
                                    <option value="TARJETA DE CRÉDITO">TARJETA DE CRÉDITO</option>
                                </select>
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
        </div>
    );
}