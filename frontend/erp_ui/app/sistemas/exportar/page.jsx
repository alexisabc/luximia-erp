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
import { Download, Eye, FileSpreadsheet, Search, Calendar, Filter, XCircle, Settings2, FileText } from 'lucide-react';

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

    if (!hasPermission('contabilidad.view_contrato')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Acceso Restringido</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">No tienes permisos para acceder al módulo de reportes.</p>
            </div>
        );
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
        setPreviewData([]); // Limpiar datos anteriores
        try {
            const cfg = REPORTES[selectedReport];
            const filters = {};
            if (cfg.dateField) {
                if (startDate) filters[`${cfg.dateField}__gte`] = startDate;
                if (endDate) filters[`${cfg.dateField}__lte`] = endDate;
            }
            // Asegurarse de que la API devuelva una estructura manejable
            const res = await cfg.fetch(1, 50, filters);
            let data = [];

            if (Array.isArray(res.data)) {
                data = res.data;
            } else if (res.data && Array.isArray(res.data.results)) {
                data = res.data.results;
            } else if (res.data) {
                // Manejo de respuesta que pudiera ser un objeto único si la API cambia
                console.warn("Estructura de API inesperada para reporte:", res.data);
                data = [];
            }

            setPreviewData(data);
            setShowActiveFilter(data.some((row) => typeof row.activo !== 'undefined'));
        } catch (err) {
            console.error("Error al cargar vista previa:", err);
            setPreviewData([]);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedReport) return;

        // Verificar que haya columnas seleccionadas
        const selectedColumnIds = Object.keys(selectedColumns).filter(key => selectedColumns[key]);
        if (selectedColumnIds.length === 0) {
            alert('Por favor selecciona al menos una columna para exportar.');
            return;
        }

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

            // Verificación básica de que recibimos un blob o datos
            if (!res.data) throw new Error("No se recibieron datos del servidor");

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
            console.error("Error al exportar:", err);
            alert('Error al generar el reporte. Verifica la consola para más detalles.');
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-4 sm:p-6 lg:p-8 flex flex-col">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    Generador de Reportes
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Crea reportes personalizados y expórtalos a Excel.
                </p>
            </div>

            {/* Selection Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Report Selector - Enhanced Search */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Tipo de Reporte
                        </label>
                        <div className="relative group">
                            <FileSpreadsheet className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Escribe para buscar (ej. Pagos, Clientes...)"
                                value={reportInput}
                                onChange={(e) => {
                                    setReportInput(e.target.value);
                                    if (e.target.value === '') {
                                        setSelectedReport('');
                                    }
                                }}
                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm placeholder:text-gray-400"
                            />
                            {/* Clear button if input has text */}
                            {reportInput && (
                                <button
                                    onClick={() => {
                                        setReportInput('');
                                        setSelectedReport('');
                                        setSelectedColumns({});
                                        setPreviewData([]);
                                        setPreviewVisible(false);
                                    }}
                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <XCircle className="h-5 w-5" />
                                </button>
                            )}

                            {/* Custom Dropdown List */}
                            {reportInput && !selectedReport && (
                                <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95">
                                    {Object.entries(REPORTES)
                                        .filter(([, rep]) => rep.label.toLowerCase().includes(reportInput.toLowerCase()))
                                        .map(([key, rep]) => (
                                            <li
                                                key={key}
                                                onClick={() => {
                                                    setReportInput(rep.label);
                                                    setSelectedReport(key);
                                                    const cols = rep.columns;
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
                                                }}
                                                className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-between group"
                                            >
                                                <span className="font-medium">{rep.label}</span>
                                                <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">Seleccionar</span>
                                            </li>
                                        ))}
                                    {Object.entries(REPORTES).filter(([, rep]) => rep.label.toLowerCase().includes(reportInput.toLowerCase())).length === 0 && (
                                        <li className="px-4 py-3 text-gray-400 text-sm text-center">No se encontraron reportes.</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Date Filters (Conditional) */}
                    {selectedReport && REPORTES[selectedReport].dateField && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Rango de Fechas (Opcional)
                            </label>
                            <div className="flex gap-4">
                                <div className="relative w-full group">
                                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all [color-scheme:light] dark:[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                                        placeholder="Fecha Inicio"
                                    />
                                </div>
                                <div className="relative w-full group">
                                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all [color-scheme:light] dark:[color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                                        placeholder="Fecha Fin"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column Selection & Actions */}
                {selectedReport && (
                    <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" /> Columnas a incluir
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    {REPORTES[selectedReport].columns.map((col) => (
                                        <label key={col.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                name={col.id}
                                                checked={!!selectedColumns[col.id]}
                                                onChange={handleColumnChange}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 justify-end md:w-48">
                                <button
                                    onClick={handlePreview}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors border border-blue-200 dark:border-blue-800"
                                >
                                    <Eye className="w-4 h-4" /> Vista Previa
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    <Download className="w-4 h-4" /> Exportar Excel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            {previewVisible && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mt-8 animate-in fade-in slide-in-from-bottom-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Vista Previa de Datos (Primeros 50)</h3>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-grow md:flex-grow-0">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filtrar vista..."
                                    value={previewSearch}
                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 outline-none w-full md:w-64"
                                />
                            </div>

                            {showActiveFilter && (
                                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={onlyActive}
                                        onChange={() => setOnlyActive((prev) => !prev)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <span>Solo activos</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="overflow-auto max-h-[500px] custom-scrollbar">
                            {loadingPreview ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    Cargando vista previa...
                                </div>
                            ) : filteredPreview.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 backdrop-blur-sm z-10">
                                        <tr>
                                            {visibleColumns.map((col) => (
                                                <th key={col.id} className="px-6 py-4 font-semibold tracking-wider whitespace-nowrap">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                        {filteredPreview.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                                {visibleColumns.map((col) => (
                                                    <td key={col.id} className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                                        {getNestedValue(row, col.id) ?? '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    No se encontraron datos para mostrar.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
