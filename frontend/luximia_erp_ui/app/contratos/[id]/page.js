// app/contratos/[id]/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// 1. Importamos useParams junto a useRouter
import { useRouter, useParams } from 'next/navigation';
import { getContratoById, getPagosPorContrato, createPago, descargarEstadoDeCuentaPDF } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import ReusableTable from '../../../components/ReusableTable';
import Modal from '../../../components/Modal';
import { formatCurrency } from '../../../utils/formatters';

export default function ContratoDetallePage() { // 2. Quitamos { params } de aquí
    // 3. Usamos el hook para obtener los parámetros de la URL
    const params = useParams();
    const { id: contratoId } = params; // Y lo usamos exactamente igual que antes

    const { hasPermission } = useAuth();
    const router = useRouter();

    const [contrato, setContrato] = useState(null);
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPagoData, setNewPagoData] = useState({
        monto_pagado: '',
        moneda_pagada: 'MXN',
        tipo_cambio: '',
        fecha_pago: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        if (!contratoId) return;
        setLoading(true);
        setError(null);
        try {
            const contratoRes = await getContratoById(contratoId);
            setContrato(contratoRes.data);

            const pagosRes = await getPagosPorContrato(contratoId);
            setPagos(pagosRes.data);

        } catch (err) {
            console.error("Error al cargar los datos del contrato:", err);
            setError('No se pudo cargar la información del contrato. Intenta de nuevo más tarde.');
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

    const handleSubmitPago = async (e) => {
        e.preventDefault();

        // ### CAMBIO ###: Construimos el objeto de datos de forma más robusta.

        // 1. Empezamos con los datos que siempre son requeridos.
        const dataToSend = {
            contrato: contratoId,
            fecha_pago: newPagoData.fecha_pago,
            monto_pagado: parseFloat(newPagoData.monto_pagado),
            moneda_pagada: newPagoData.moneda_pagada,
        };

        // 2. Añadimos el tipo de cambio SOLO si la moneda es USD.
        if (dataToSend.moneda_pagada === 'USD') {
            // Validamos que el tipo de cambio no esté vacío para USD
            if (!newPagoData.tipo_cambio) {
                setError('Para pagos en USD, el tipo de cambio es obligatorio.');
                return; // Detenemos el envío del formulario
            }
            dataToSend.tipo_cambio = parseFloat(newPagoData.tipo_cambio);
        }

        // Si la moneda es MXN, no añadimos 'tipo_cambio', y Django usará el default=1.0

        try {
            await createPago(dataToSend);
            setIsModalOpen(false);
            fetchData(); // Recargamos los datos para ver el nuevo pago
            // Reseteamos el formulario
            setNewPagoData({
                monto_pagado: '',
                moneda_pagada: 'MXN',
                tipo_cambio: '',
                fecha_pago: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            // Capturamos errores de validación del backend si los hubiera
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).join(', ') : 'Error al registrar el pago.';
            setError(errorMessages);
            console.error("Error al crear el pago:", err);
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
            console.error('Error al descargar el PDF:', error);
            setError('No se pudo generar el PDF.');
        }
    };

    const pagosColumns = [
        { header: 'Fecha', render: (pago) => new Date(pago.fecha_pago + 'T00:00:00-06:00').toLocaleDateString('es-MX', { timeZone: 'America/Cancun' }) }, // Ajuste de zona horaria
        { header: 'Monto Pagado', render: (pago) => formatCurrency(pago.monto_pagado, pago.moneda_pagada) },
        { header: 'T.C.', render: (pago) => pago.tipo_cambio ? formatCurrency(pago.tipo_cambio, 'MXN') : 'N/A' },
        { header: 'Monto en MXN', render: (pago) => formatCurrency(pago.monto_en_mxn, 'MXN') }
    ];

    if (loading) return <div className="p-8"><p>Cargando...</p></div>;
    if (error) return <div className="p-8 text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (!contrato) return <div className="p-8"><p>No se encontró el contrato.</p></div>;

    const totalPagadoMXN = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto_en_mxn), 0);
    // Lógica de saldo correcta: usa el valor del contrato en MXN (ya calculado en el backend para el PDF)
    const saldoPendienteMXN = contrato.saldo_pendiente_mxn ? parseFloat(contrato.saldo_pendiente_mxn) : 0;

    return (
        <div className="p-8 h-full flex flex-col">
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                        Estado de Cuenta
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Contrato #{contrato.id}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                        Descargar PDF
                    </button>
                    {hasPermission('api.add_pago') && (
                        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            + Agregar Pago
                        </button>
                    )}
                </div>
            </div>

            {/* Tarjetas de Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</h3>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{contrato.cliente.nombre_completo}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">UPE</h3>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{contrato.upe.identificador} ({contrato.upe.proyecto_nombre})</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio Pactado</h3>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(contrato.precio_final_pactado, contrato.moneda_pactada)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Pendiente</h3>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(saldoPendienteMXN, 'MXN')}</p>
                </div>
            </div>

            {/* Tabla de Pagos */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Historial de Pagos</h2>
            <div className="flex-grow">
                <ReusableTable data={pagos} columns={pagosColumns} />
            </div>

            {/* Modal para Agregar Pago */}
            <Modal title="Registrar Nuevo Pago" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmitPago} className="space-y-4">
                    {/* ... (el formulario del modal no necesita cambios) ... */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                        <input type="date" name="fecha_pago" value={newPagoData.fecha_pago} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Monto Pagado</label>
                        <input type="number" step="0.01" name="monto_pagado" placeholder="25000.00" value={newPagoData.monto_pagado} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Moneda</label>
                        <select name="moneda_pagada" value={newPagoData.moneda_pagada} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900">
                            <option value="MXN">Pesos Mexicanos (MXN)</option>
                            <option value="USD">Dólares (USD)</option>
                        </select>
                    </div>
                    {newPagoData.moneda_pagada === 'USD' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Cambio (MXN por USD)</label>
                            <input type="number" step="0.0001" name="tipo_cambio" placeholder="17.50" value={newPagoData.tipo_cambio} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                    )}
                    <div className="pt-4 flex justify-end">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                            Guardar Pago
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}