'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    FileCode,
    Download,
    Calendar,
    Search,
    Receipt
} from 'lucide-react';
import { toast } from 'sonner';

import ImportModal from '@/components/modals/Import';
import ExportModal from '@/components/modals/Export';
import ReusableTable from '@/components/tables/ReusableTable';
import ActionButtons from '@/components/common/ActionButtons';
import { Badge } from '@/components/ui/badge';

import {
    getFacturas,
    exportarFacturasExcel,
    importarFacturas,
    descargarPlantillaFacturas
} from '@/services/contabilidad';

const exportColumns = [
    { id: 'uuid', label: 'UUID' },
    { id: 'serie', label: 'Serie' },
    { id: 'folio', label: 'Folio' },
    { id: 'receptor_nombre', label: 'Receptor' },
    { id: 'receptor_rfc', label: 'RFC' },
    { id: 'total', label: 'Total' },
    { id: 'estado_sat', label: 'Estado' },
];

export default function FacturacionPage() {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Modal states
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Export state
    const [selectedColumns, setSelectedColumns] = useState(() =>
        exportColumns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
    );

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const handleColumnChange = (e) => {
        const { name, checked } = e.target;
        setSelectedColumns(prev => ({ ...prev, [name]: checked }));
    };

    const handleSelectAll = (checked) => {
        const newSelection = {};
        exportColumns.forEach(c => { newSelection[c.id] = checked; });
        setSelectedColumns(newSelection);
    };

    const fetchFacturas = useCallback(async (page = 1, searchQuery = '', active = false) => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
                search: searchQuery,
                show_inactive: active
            };
            const response = await getFacturas(params);

            if (response.data.results) {
                setFacturas(response.data.results);
                setTotalItems(response.data.count);
            } else {
                setFacturas(response.data);
                setTotalItems(response.data.length);
            }
        } catch (error) {
            console.error("Error fetching facturas:", error);
            toast.error("Error al cargar facturas");
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchFacturas(currentPage, search, showInactive);
    }, [fetchFacturas, currentPage, search, showInactive]);

    const handleSearch = (query) => {
        setSearch(query);
        setCurrentPage(1);
    };

    const handleToggleInactive = () => {
        setShowInactive(prev => !prev);
        setCurrentPage(1);
    };

    const handleCreate = () => {
        toast.info("Para crear facturas, utilice el módulo de Ventas o espere la integración manual.");
    };

    const handleImportXML = () => {
        setIsImportModalOpen(true);
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const columns = [
        {
            header: 'Folio Fiscal / Datos',
            accessorKey: 'uuid',
            cell: (row) => (
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                        <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {row.serie ? `${row.serie}-` : ''}{row.folio || 'S/N'}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 truncate w-32" title={row.uuid}>
                            {row.uuid || 'Sin Timbrar'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(row.fecha_emision).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Receptor',
            accessorKey: 'receptor_nombre',
            cell: (row) => (
                <div className="text-sm">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{row.receptor_nombre}</p>
                    <p className="text-xs text-gray-500">{row.receptor_rfc}</p>
                </div>
            )
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (row) => (
                <div className="font-bold text-gray-900 dark:text-gray-100 text-right">
                    ${parseFloat(row.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-gray-500 ml-1">{row.moneda_codigo}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado_sat',
            cell: (row) => {
                const colors = {
                    'VIGENTE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'CANCELADO': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    'PENDIENTE': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                };
                return (
                    <Badge className={`${colors[row.estado_sat] || 'bg-gray-100 text-gray-700'} border-0`}>
                        {row.estado_sat}
                    </Badge>
                );
            }
        },
        {
            header: 'Archivos',
            id: 'actions',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.xml_archivo && (
                        <a href={row.xml_archivo} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded text-orange-600" title="Descargar XML">
                            <FileCode className="w-4 h-4" />
                        </a>
                    )}
                    {row.pdf_archivo && (
                        <a href={row.pdf_archivo} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded text-red-600" title="Descargar PDF">
                            <FileText className="w-4 h-4" />
                        </a>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                        Facturación Fiscal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Consulta y gestión de CFDIs emitidos.
                    </p>
                </div>
                <ActionButtons
                    // Visual Toggle
                    showInactive={showInactive}
                    onToggleInactive={handleToggleInactive}
                    canToggleInactive={true}

                    onCreate={handleCreate}
                    canCreate={true}
                    onImport={handleImportXML}
                    canImport={true}

                    onExport={handleExport}
                    canExport={true}
                />
            </div>

            <div className="flex-grow min-h-0 relative">
                <ReusableTable
                    data={facturas}
                    columns={columns}
                    loading={loading}
                    onSearch={handleSearch}
                    search={true}
                    pagination={{
                        currentPage,
                        totalCount: totalItems,
                        pageSize,
                        onPageChange: setCurrentPage
                    }}
                />
            </div>
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={importarFacturas}
                templateUrl={null}
                onDownloadTemplate={descargarPlantillaFacturas}
                title="Importar Facturas (Excel)"
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onDownload={exportarFacturasExcel}
                totalRecords={totalItems}
                filters={{ search, show_inactive: showInactive }}
                columns={exportColumns}
                selectedColumns={selectedColumns}
                onSelectAll={handleSelectAll}
                onColumnChange={handleColumnChange}
                filename="facturas_export.xlsx"
                data={facturas}
                withPreview={true}
            />
        </div>
    );
}
