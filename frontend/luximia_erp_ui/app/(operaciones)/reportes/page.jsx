'use client';

import React, { useState } from 'react';
import {
    exportProyectosExcel,
    exportClientesExcel,
    exportUpesExcel,
    exportContratosExcel,
    getProyectos,
    getClientes,
    getUPEs,
    getContratos,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ExportModal from '@/components/ui/modals/Export';
import { Download } from 'lucide-react';

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
    },
};

export default function ReportesPage() {
    const { hasPermission } = useAuth();
    const [current, setCurrent] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState({});
    const [reportSearch, setReportSearch] = useState('');
    const [previewData, setPreviewData] = useState([]);
    const [previewSearch, setPreviewSearch] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [onlyActive, setOnlyActive] = useState(false);
    const [showActiveFilter, setShowActiveFilter] = useState(false);

    if (!hasPermission('cxc.can_export')) {
        return <div className="p-8">Sin permiso para exportar reportes.</div>;
    }

    const openModal = async (key) => {
        const cols = REPORTES[key].columns;
        const initial = {};
        cols.forEach((c) => (initial[c.id] = true));
        setSelectedColumns(initial);
        setPreviewData([]);
        setPreviewSearch('');
        setOnlyActive(false);
        setShowActiveFilter(false);
        setCurrent(key);
        setLoadingPreview(true);
        try {
            const res = await REPORTES[key].fetch(1, 50);
            const data = res.data.results || res.data;
            setPreviewData(data);
            setShowActiveFilter(data.some((row) => typeof row.activo !== 'undefined'));
        } catch (err) {
            setPreviewData([]);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleDownload = async () => {
        const cfg = REPORTES[current];
        const columnsToExport = cfg.columns.filter(c => selectedColumns[c.id]).map(c => c.id);
        try {
            const res = await cfg.fn(columnsToExport);
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
        } finally {
            setCurrent(null);
        }
    };

    const filteredPreview = previewData
        .filter((row) => (!onlyActive || row.activo))
        .filter((row) => {
            if (!previewSearch) return true;
            return Object.values(row).some((val) =>
                val ? val.toString().toLowerCase().includes(previewSearch.toLowerCase()) : false,
            );
        })
        .slice(0, 10);

    const filteredReports = Object.entries(REPORTES).filter(([_, rep]) =>
        rep.label.toLowerCase().includes(reportSearch.toLowerCase()),
    );

    return (
        <div className="p-8 h-full flex flex-col space-y-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Reportes</h1>
            <input
                type="text"
                placeholder="Buscar reporte..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="mb-2 px-3 py-2 border rounded-md max-w-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <div className="space-y-4">
                {filteredReports.map(([key, rep]) => (
                    <div
                        key={key}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center"
                    >
                        <span className="font-medium">{rep.label}</span>
                        <button
                            onClick={() => openModal(key)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg"
                            title="Descargar"
                        >
                            <Download className="h-6 w-6" />
                        </button>
                    </div>
                ))}
            </div>
            {current && (
                <ExportModal
                    isOpen={true}
                    onClose={() => setCurrent(null)}
                    columns={REPORTES[current].columns}
                    selectedColumns={selectedColumns}
                    onColumnChange={handleColumnChange}
                    onDownload={handleDownload}
                    data={filteredPreview}
                    searchValue={previewSearch}
                    onSearchChange={setPreviewSearch}
                    loading={loadingPreview}
                    withPreview
                    showActiveFilter={showActiveFilter}
                    onlyActive={onlyActive}
                    onToggleActive={() => setOnlyActive((prev) => !prev)}
                />
            )}
        </div>
    );
}
