'use client';

import React, { useState } from 'react';
import {
    exportProyectosExcel,
    exportClientesExcel,
    exportUpesExcel,
    exportContratosExcel,
    exportPlanesPagoExcel,
    exportPagosExcel,
    getProyectos,
    getClientes,
    getUPEs,
    getContratos,
    getPlanesPago,
    getPagos,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Download, Eye } from 'lucide-react';

const PROYECTO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre', label: 'Nombre' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'activo', label: 'Estado' },
];

const CLIENTE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'nombre_completo', label: 'Nombre Completo' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'activo', label: 'Estado' },
];

const UPE_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'proyecto__nombre', label: 'Proyecto' },
    { id: 'identificador', label: 'Identificador' },
    { id: 'valor_total', label: 'Valor Total' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'estado', label: 'Estado' },
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

const PLANPAGO_COLUMNAS_EXPORT = [
    { id: 'id', label: 'ID' },
    { id: 'cliente', label: 'Cliente' },
    { id: 'upe', label: 'UPE' },
    { id: 'fecha_programada', label: 'Fecha Programada' },
    { id: 'monto_programado', label: 'Monto Programado' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'forma_pago', label: 'Forma de Pago' },
];

const PAGO_COLUMNAS_EXPORT = [
    { id: 'fecha_pago', label: 'Fecha de Pago' },
    { id: 'concepto', label: 'Concepto' },
    { id: 'metodo_pago', label: 'Método' },
    { id: 'ordenante', label: 'Ordenante' },
    { id: 'monto_pagado', label: 'Monto Pagado' },
    { id: 'moneda_pagada', label: 'Moneda' },
    { id: 'tipo_cambio', label: 'Tipo de Cambio' },
    { id: 'valor_mxn', label: 'Valor (MXN)' },
    { id: 'banco_origen', label: 'Banco Origen' },
    { id: 'num_cuenta_origen', label: 'Cuenta Origen' },
    { id: 'banco_destino', label: 'Banco Destino' },
    { id: 'cuenta_beneficiaria', label: 'Cuenta Beneficiaria' },
    { id: 'comentarios', label: 'Comentarios' },
];

const REPORTES = {
    proyectos: {
        label: 'Proyectos',
        columns: PROYECTO_COLUMNAS_EXPORT,
        fn: exportProyectosExcel,
        fetch: getProyectos,
        filename: 'reporte_proyectos.xlsx',
    },
    clientes: {
        label: 'Clientes',
        columns: CLIENTE_COLUMNAS_EXPORT,
        fn: exportClientesExcel,
        fetch: getClientes,
        filename: 'reporte_clientes.xlsx',
    },
    upes: {
        label: 'UPEs',
        columns: UPE_COLUMNAS_EXPORT,
        fn: exportUpesExcel,
        fetch: getUPEs,
        filename: 'reporte_upes.xlsx',
    },
    contratos: {
        label: 'Contratos',
        columns: CONTRATO_COLUMNAS_EXPORT,
        fn: exportContratosExcel,
        fetch: getContratos,
        filename: 'reporte_contratos.xlsx',
        dateField: 'fecha_venta',
    },
    planes_pago: {
        label: 'Planes de Pago',
        columns: PLANPAGO_COLUMNAS_EXPORT,
        fn: exportPlanesPagoExcel,
        fetch: getPlanesPago,
        filename: 'reporte_planes_pago.xlsx',
        dateField: 'fecha_programada',
    },
    pagos: {
        label: 'Pagos',
        columns: PAGO_COLUMNAS_EXPORT,
        fn: exportPagosExcel,
        fetch: getPagos,
        filename: 'reporte_pagos.xlsx',
        dateField: 'fecha_pago',
    },
};

function getNestedValue(obj, path) {
    return path.split('__').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export default function ReportesPage() {
    const { hasPermission } = useAuth();
    const [selectedReport, setSelectedReport] = useState('');
    const [selectedColumns, setSelectedColumns] = useState({});
    const [reportInput, setReportInput] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewSearch, setPreviewSearch] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [onlyActive, setOnlyActive] = useState(false);
    const [showActiveFilter, setShowActiveFilter] = useState(false);
    const [filterField, setFilterField] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!hasPermission('cxc.can_export')) {
        return <div className="p-8">Sin permiso para exportar reportes.</div>;
    }

    const handleReportChange = (e) => {
        const value = e.target.value;
        setReportInput(value);
        const match = Object.entries(REPORTES).find(([, rep]) => rep.label === value);
        const key = match ? match[0] : '';
        setSelectedReport(key);
        if (key) {
            const cols = REPORTES[key].columns;
            const initial = {};
            cols.forEach((c) => (initial[c.id] = true));
            setSelectedColumns(initial);
            setPreviewData([]);
            setPreviewVisible(false);
            setPreviewSearch('');
            setOnlyActive(false);
            setShowActiveFilter(false);
            setFilterField('');
            setFilterValue('');
            setStartDate('');
            setEndDate('');
        } else {
            setSelectedColumns({});
            setPreviewData([]);
            setPreviewVisible(false);
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns((prev) => ({ ...prev, [name]: checked }));
    };

    const handlePreview = async () => {
        if (!selectedReport) return;
        setLoadingPreview(true);
        setPreviewVisible(true);
        try {
            const cfg = REPORTES[selectedReport];
            const filters = {};
            if (cfg.dateField) {
                if (startDate) filters[`${cfg.dateField}__gte`] = startDate;
                if (endDate) filters[`${cfg.dateField}__lte`] = endDate;
            }
            const res = await cfg.fetch(1, 50, filters);
            const data = res.data.results || res.data;
            setPreviewData(data);
            setShowActiveFilter(data.some((row) => typeof row.activo !== 'undefined'));
        } catch (err) {
            setPreviewData([]);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedReport) return;
        const cfg = REPORTES[selectedReport];
        const columnsToExport = cfg.columns
            .filter((c) => selectedColumns[c.id])
            .map((c) => c.id);
        const filters = {};
        if (cfg.dateField) {
            if (startDate) filters[`${cfg.dateField}__gte`] = startDate;
            if (endDate) filters[`${cfg.dateField}__lte`] = endDate;
        }
        try {
            const res = await cfg.fn(columnsToExport, filters);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = cfg.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // eslint-disable-next-line no-alert
            alert('Error al generar el reporte');
        }
    };

    const visibleColumns = REPORTES[selectedReport]?.columns.filter((c) => selectedColumns[c.id]) || [];

    const filteredPreview = previewData
        .filter((row) => (!onlyActive || row.activo))
        .filter((row) => {
            if (filterField && filterValue) {
                const val = getNestedValue(row, filterField);
                return val ? val.toString().toLowerCase().includes(filterValue.toLowerCase()) : false;
            }
            return true;
        })
        .filter((row) => {
            if (!previewSearch) return true;
            return Object.values(row).some((val) =>
                val ? val.toString().toLowerCase().includes(previewSearch.toLowerCase()) : false,
            );
        })
        .slice(0, 10);

    return (
        <div className="p-8 h-full flex flex-col space-y-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Reportes</h1>
            <input
                list="report-options"
                type="text"
                placeholder="Buscar y seleccionar reporte..."
                value={reportInput}
                onChange={handleReportChange}
                className="px-3 py-2 border rounded-md max-w-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <datalist id="report-options">
                {Object.entries(REPORTES).map(([key, rep]) => (
                    <option key={key} value={rep.label} />
                ))}
            </datalist>

            {selectedReport && (
                <>
                    {REPORTES[selectedReport].dateField && (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border rounded-md max-w-sm dark:bg-gray-800 dark:border-gray-700"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border rounded-md max-w-sm dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2 mt-2">
                        <button
                            onClick={handlePreview}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                            title="Vista previa"
                        >
                            <Eye className="h-6 w-6" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                            title="Descargar"
                        >
                            <Download className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {REPORTES[selectedReport].columns.map((col) => (
                            <label key={col.id} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name={col.id}
                                    checked={!!selectedColumns[col.id]}
                                    onChange={handleColumnChange}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                            </label>
                        ))}
                    </div>

                    {previewVisible && (
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={previewSearch}
                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                    className="flex-1 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                                <select
                                    value={filterField}
                                    onChange={(e) => setFilterField(e.target.value)}
                                    className="px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Campo...</option>
                                    {REPORTES[selectedReport].columns.map((col) => (
                                        <option key={col.id} value={col.id}>
                                            {col.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Valor"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className="px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                                {showActiveFilter && (
                                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={onlyActive}
                                            onChange={() => setOnlyActive((prev) => !prev)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Solo activos</span>
                                    </label>
                                )}
                            </div>

                            <div className="overflow-auto border rounded max-h-64 dark:border-gray-700">
                                {loadingPreview ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                {visibleColumns.map((col) => (
                                                    <th
                                                        key={col.id}
                                                        className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300"
                                                    >
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredPreview.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    {visibleColumns.map((col) => (
                                                        <td
                                                            key={col.id}
                                                            className="px-2 py-1 text-gray-700 dark:text-gray-300"
                                                        >
                                                            {getNestedValue(row, col.id) ?? ''}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
