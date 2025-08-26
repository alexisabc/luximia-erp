// app/(operaciones)/contratos/[id]/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getContratoById, createPago, updatePago, deletePago, descargarEstadoDeCuentaPDF, descargarEstadoDeCuentaExcel } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ReusableTable from '@/components/ui/tables/ReusableTable';
import FormModal from '@/components/ui/modals/Form'; // Asumo que tienes un FormModal
import ConfirmationModal from '@/components/ui/modals/Confirmation'; // Asumo que tienes este modal
import ExportModal from '@/components/ui/modals/Export'; // Asumo que tienes este modal
import { formatCurrency } from '@/utils/formatters';
import { SquarePen, Trash, FileDown, Download } from 'lucide-react';
import Overlay from '@/components/loaders/Overlay';
import MetodoPagoSelect from '@/components/ui/MetodoPagoSelect';

// Componente para las tarjetas de resumen
const InfoCard = ({ title, value, isCurrency = false, currencySymbol = 'USD', color = 'text-gray-900 dark:text-white' }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>
            {isCurrency ? formatCurrency(value, currencySymbol) : (value || 0)}
        </p>
    </div>
);

// Aquí definimos los campos del formulario de pago
const PAGO_FORM_FIELDS = [
    { name: 'monto_pagado', label: 'Monto Pagado', type: 'number', step: '0.01', required: true, span: 2 },
    { name: 'moneda_pagada', label: 'Moneda', type: 'select', options: ['USD', 'MXN'], required: true, span: 1 },
    { name: 'tipo_cambio', label: 'Tipo de Cambio', type: 'number', step: '0.0001', hidden: (data) => data.moneda_pagada !== 'USD', span: 1 },
    { name: 'fecha_pago', label: 'Fecha del Pago', type: 'date', required: true, span: 2 },
    { name: 'fecha_ingreso_cuentas', label: 'Fecha Ingreso a Cuentas', type: 'date', span: 2 },
    { name: 'concepto', label: 'Concepto del Pago', type: 'select', options: ['ABONO', 'INTERES', 'COMPLETO'], required: true, span: 2 },
    { name: 'metodo_pago', label: 'Método de Pago', type: 'component', component: MetodoPagoSelect, span: 2 },
    { name: 'ordenante', label: 'Ordenante (Quién Paga)', type: 'text', span: 4 },
    { name: 'banco_origen', label: 'Banco Origen', type: 'text', span: 1 },
    { name: 'num_cuenta_origen', label: 'Cuenta Origen', type: 'text', span: 1 },
    { name: 'banco_destino', label: 'Banco Destino', type: 'text', span: 1 },
    { name: 'cuenta_beneficiaria', label: 'Cuenta Beneficiaria', type: 'text', span: 1 },
    { name: 'comentarios', label: 'Comentarios', type: 'textarea', span: 4 },
];

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
    const contratoId = parseInt(params.id, 10);
    const { hasPermission } = useAuth();

    const [contrato, setContrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [editingPago, setEditingPago] = useState(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pagoToDelete, setPagoToDelete] = useState(null);

    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    // Inicializa con todas las columnas seleccionadas por defecto
    const [selectedExcelColumns, setSelectedExcelColumns] = useState(() => {
        const allCols = {};
        COLUMNAS_EXPORTABLES.planDePagos.forEach(c => allCols[`plan_${c.id}`] = true);
        COLUMNAS_EXPORTABLES.historialPagos.forEach(c => allCols[`pago_${c.id}`] = true);
        return allCols;
    });

    const [selectedPdfColumns, setSelectedPdfColumns] = useState(() => {
        const allCols = {};
        COLUMNAS_PDF.forEach(c => allCols[c.id] = true);
        return allCols;
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getContratoById(contratoId);
            setContrato(res.data);
            const latestTipoCambio = res.data.tipo_cambio_actual; // Asumo que el backend provee el tipo de cambio actual
            setFormData(prev => ({
                ...prev,
                tipo_cambio: latestTipoCambio,
                ordenante: res.data.cliente?.nombre_completo || '',
                concepto: 'ABONO',
                moneda_pagada: 'USD',
                fecha_pago: new Date().toISOString().split('T')[0],
            }));
        } catch (err) {
            setError('No se pudo cargar el contrato.');
        } finally {
            setLoading(false);
        }
    }, [contratoId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateClick = () => {
        setEditingPago(null);
        setIsFormModalOpen(true);
    };

    const handleEditClick = (pago) => {
        setEditingPago(pago);
        setFormData({ ...pago, metodo_pago: pago.metodo_pago?.id || '' });
        setIsFormModalOpen(true);
    };

    const handlePagoSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const dataToSend = {
            ...formData,
            contrato: contratoId,
            monto_pagado: parseFloat(formData.monto_pagado) || 0,
            tipo_cambio: parseFloat(formData.tipo_cambio) || 1.0,
            metodo_pago: formData.metodo_pago || null,
        };
        try {
            if (editingPago) {
                await updatePago(editingPago.id, dataToSend);
            } else {
                await createPago(dataToSend);
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessages = errorData ? Object.values(errorData).flat().join(', ') : 'Error al guardar el pago.';
            setError(errorMessages);
        }
    };

    const handleDeleteClick = (pagoId) => {
        setPagoToDelete(pagoId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!pagoToDelete) return;
        try {
            await deletePago(pagoToDelete);
            fetchData();
        } catch (err) {
            setError('No se pudo eliminar el pago.');
        } finally {
            setIsConfirmModalOpen(false);
            setPagoToDelete(null);
        }
    };

    const handleDownloadPDF = async (columns) => {
        try {
            const response = await descargarEstadoDeCuentaPDF(contratoId, columns);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estado_de_cuenta_contrato_${contratoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsPdfModalOpen(false);
        } catch (error) {
            setError('No se pudo generar el PDF.');
        }
    };

    const handleDownloadExcel = async (planCols, pagoCols) => {
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

    if (loading) return <Overlay show />;
    if (error && !contrato) return <div className="p-8 text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (!contrato) return <div className="p-8">No se encontró el contrato.</div>;

    return (
        <div className="p-8 h-full flex flex-col space-y-8">
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Estado de Cuenta</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Contrato #{contrato.id} - {contrato.cliente?.nombre_completo || 'Cliente no disponible'}</p>
                </div>
                <div className="flex items-center space-x-3">
                    {hasPermission('cxc.add_pago') && <button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">+ Registrar Pago</button>}
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

            <FormModal
                title={editingPago ? 'Editar Pago' : 'Registrar Nuevo Pago'}
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setEditingPago(null); setFormData({}); }}
                onSubmit={handlePagoSubmit}
                fields={PAGO_FORM_FIELDS}
                formData={formData}
                onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                message="¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer."
            />

            <ExportModal
                title="Seleccionar Columnas para PDF"
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                onConfirm={() => handleDownloadPDF(Object.keys(selectedPdfColumns).filter(key => selectedPdfColumns[key]))}
                columns={COLUMNAS_PDF}
                selectedColumns={selectedPdfColumns}
                onColumnSelectionChange={(e) => setSelectedPdfColumns(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                buttonText="Descargar PDF"
                buttonColor="bg-red-600 hover:bg-red-700"
            />

            <ExportModal
                title="Seleccionar Columnas para Excel"
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onConfirm={() => handleDownloadExcel(
                    COLUMNAS_EXPORTABLES.planDePagos.filter(c => selectedExcelColumns[`plan_${c.id}`]).map(c => c.id),
                    COLUMNAS_EXPORTABLES.historialPagos.filter(c => selectedExcelColumns[`pago_${c.id}`]).map(c => c.id)
                )}
                columns={[
                    { title: "Plan de Pagos", options: COLUMNAS_EXPORTABLES.planDePagos, prefix: "plan" },
                    { title: "Historial de Pagos", options: COLUMNAS_EXPORTABLES.historialPagos, prefix: "pago" }
                ]}
                selectedColumns={selectedExcelColumns}
                onColumnSelectionChange={(e) => setSelectedExcelColumns(prev => ({ ...prev, [e.target.name]: e.target.checked }))}
                buttonText="Descargar Excel"
                buttonColor="bg-green-600 hover:bg-green-700"
            />
        </div>
    );
}