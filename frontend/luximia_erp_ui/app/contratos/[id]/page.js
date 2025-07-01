// app/contratos/[id]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getContratoById, getPagosPorContrato, createPago, descargarEstadoDeCuentaPDF } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ReusableTable from '../../../components/ReusableTable';
import Modal from '../../../components/Modal';
import { formatCurrency } from '../../../utils/formatters';

export default function ContratoDetallePage() {
    const params = useParams();
    const { id: contratoId } = params;
    const { hasPermission } = useAuth();

    const [contrato, setContrato] = useState(null);
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ### CAMBIO: Estado inicial del formulario con todos los nuevos campos ###
    const [newPagoData, setNewPagoData] = useState({
        tipo: 'MENSUALIDAD',
        monto_pagado: '',
        moneda_pagada: 'MXN',
        tipo_cambio: '1.0',
        fecha_pago_mensualidad: new Date().toISOString().split('T')[0],
        fecha_ingreso_cuentas: '',
        instrumento_pago: 'TRANSFERENCIA INTERBANCARIA',
        banco_origen: '',
        num_cuenta_origen: '',
        titular_cuenta_origen: '',
        banco_destino: '',
        num_cuenta_destino: '',
        comentarios: ''
    });

    const fetchData = useCallback(async () => {
        if (!contratoId) return;
        setLoading(true);
        setError(null);
        try {
            const [contratoRes, pagosRes] = await Promise.all([
                getContratoById(contratoId),
                getPagosPorContrato(contratoId)
            ]);
            setContrato(contratoRes.data);
            setPagos(pagosRes.data);
        } catch (err) {
            setError('No se pudo cargar la información del contrato.');
        } finally {
            setLoading(false);
        }
    }, [contratoId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPagoData(prev => ({ ...prev, [name]: value }));
    };

    // ### CAMBIO: Lógica de envío actualizada ###
    const handleSubmitPago = async (e) => {
        e.preventDefault();
        setError(null);
        const dataToSend = { ...newPagoData, contrato: contratoId };

        // Convertimos a número los campos que lo necesiten
        dataToSend.monto_pagado = parseFloat(dataToSend.monto_pagado);
        dataToSend.tipo_cambio = parseFloat(dataToSend.tipo_cambio);

        // Si la fecha de ingreso no se especifica, no la enviamos
        if (!dataToSend.fecha_ingreso_cuentas) {
            delete dataToSend.fecha_ingreso_cuentas;
        }

        try {
            await createPago(dataToSend);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            setError('Error al registrar el pago. Revisa los campos.');
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

    const pagosColumns = [
        {
            header: 'Fecha Pago',
            render: (pago) => new Date(pago.fecha_pago_mensualidad + 'T06:00:00').toLocaleDateString('es-MX')
        },
        {
            header: 'Tipo',
            render: (pago) => {
                // Asignamos un color según el tipo de pago
                const TIPO_STYLES = {
                    'MENSUALIDAD': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    'ENGANCHE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    'PAGO FINAL': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    'OTRO': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                };
                const style = TIPO_STYLES[pago.tipo] || TIPO_STYLES['OTRO'];
                return (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${style}`}>
                        {pago.tipo}
                    </span>
                );
            }
        },
        {
            header: 'Monto Pagado',
            render: (pago) => (
                <span className="font-semibold">
                    {formatCurrency(pago.monto_pagado, pago.moneda_pagada)}
                </span>
            )
        },
        {
            header: 'Instrumento',
            render: (pago) => (
                <span className="px-2.5 py-1 text-xs text-gray-700 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-md">
                    {pago.instrumento_pago || 'N/A'}
                </span>
            )
        },
        {
            header: 'Valor en MXN',
            render: (pago) => formatCurrency(pago.valor_mxn, 'MXN')
        },
    ];

    if (loading) return <div className="p-8"><p>Cargando...</p></div>;

    // El cálculo del saldo pendiente ahora usa el valor que viene del backend
    const saldoPendienteMXN = contrato?.saldo_pendiente_mxn ? parseFloat(contrato.saldo_pendiente_mxn) : 0;

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Estado de Cuenta</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Contrato #{contrato?.id}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Descargar PDF</button>
                    {hasPermission('cxc.add_pago') && (
                        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Agregar Pago</button>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Cliente</h3><p className="text-xl font-semibold">{contrato?.cliente.nombre_completo}</p></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">UPE</h3><p className="text-xl font-semibold">{contrato?.upe.identificador} ({contrato?.upe.proyecto_nombre})</p></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Precio Pactado</h3><p className="text-xl font-semibold">{formatCurrency(contrato?.precio_final_pactado, contrato?.moneda_pactada)}</p></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-500">Saldo Pendiente</h3><p className="text-xl font-bold text-blue-600">{formatCurrency(saldoPendienteMXN, 'MXN')}</p></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Historial de Pagos</h2>
            <div className="flex-grow"><ReusableTable data={pagos} columns={pagosColumns} /></div>

            {/* ### CAMBIO: Modal con todos los nuevos campos del formulario ### */}
            <Modal title="Registrar Nuevo Pago" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmitPago} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    {/* Fila 1: Información Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
                            {/* ### CAMBIO: Añadido 'text-gray-900' ### */}
                            <select name="tipo" value={newPagoData.tipo} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                                <option value="MENSUALIDAD">Mensualidad</option>
                                <option value="ENGANCHE">Enganche</option>
                                <option value="PAGO FINAL">Pago Final</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                            <input type="date" name="fecha_pago_mensualidad" value={newPagoData.fecha_pago_mensualidad} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                    </div>

                    {/* Fila 2: Detalles del Monto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Monto Pagado</label>
                            <input type="number" step="0.01" name="monto_pagado" value={newPagoData.monto_pagado} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Moneda</label>
                            <select name="moneda_pagada" value={newPagoData.moneda_pagada} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                                <option value="MXN">MXN</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        {newPagoData.moneda_pagada === 'USD' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo de Cambio</label>
                                <input type="number" step="0.0001" name="tipo_cambio" value={newPagoData.tipo_cambio} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                            </div>
                        )}
                    </div>

                    {/* Fila 3: Detalles de la Transacción */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Instrumento de Pago</label>
                            <select name="instrumento_pago" value={newPagoData.instrumento_pago} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                                <option value="TRANSFERENCIA INTERBANCARIA">TRANSFERENCIA INTERBANCARIA</option>
                                <option value="EFECTIVO">EFECTIVO</option>
                                <option value="TARJETA DE CRÉDITO">TARJETA DE CRÉDITO</option>
                                <option value="TARJETA DE DÉBITO">TARJETA DE DÉBITO</option>
                                <option value="CHEQUE NOMINATIVO">CHEQUE NOMINATIVO</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha Ingreso a Cuentas</label>
                            <input type="date" name="fecha_ingreso_cuentas" value={newPagoData.fecha_ingreso_cuentas} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                    </div>

                    {/* Fila 4: Cuenta de Origen */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Banco Origen</label>
                                <input type="text" name="banco_origen" value={newPagoData.banco_origen} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cuenta Origen</label>
                                <input type="text" name="num_cuenta_origen" value={newPagoData.num_cuenta_origen} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Titular Origen</label>
                                <input type="text" name="titular_cuenta_origen" value={newPagoData.titular_cuenta_origen} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                            </div>
                        </div>
                    </div>

                    {/* Comentarios */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Comentarios</label>
                        <textarea name="comentarios" value={newPagoData.comentarios} onChange={handleInputChange} rows="2" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"></textarea>
                    </div>

                    {/* Botones */}
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Guardar Pago
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}