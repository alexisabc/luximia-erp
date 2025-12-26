import React, { useMemo } from 'react';
import Modal from '@/components/modals';
import { Download, Search, CheckSquare, FileSpreadsheet, ListChecks, Square } from 'lucide-react';

/**
 * ExportModal
 *
 * Modal reutilizable mejorado para seleccionar columnas y exportar datos.
 * Soporta selección masiva y vista previa filtrada.
 */
export default function ExportModal({
    isOpen,
    onClose,
    columns,
    selectedColumns,
    onColumnChange,
    onDownload,
    data = [],
    searchValue = '',
    onSearchChange = () => { },
    loading = false,
    withPreview = false,
    showActiveFilter = false,
    onlyActive = false,
    onToggleActive = () => { },
    onSelectAll, // Nuevo prop opcional: (boolean) => void
}) {
    // Memorizar columnas visibles
    const visibleColumns = useMemo(() =>
        columns.filter((c) => selectedColumns[c.id]),
        [columns, selectedColumns]
    );

    const getNestedValue = (obj, path) =>
        path.split('__').reduce((acc, part) => (acc ? acc[part] : undefined), obj);

    // Determinar estado de selección global
    const allSelected = columns.every(c => selectedColumns[c.id]);
    const someSelected = columns.some(c => selectedColumns[c.id]);

    return (
        <Modal
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold">Exportar Datos</span>
                        <span className="text-xs text-gray-500 font-normal">Selecciona las columnas y descarga tu reporte</span>
                    </div>
                </div>
            }
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-4xl" // Ancho optimizado
        >
            <div className="flex flex-col h-full max-h-[80vh]">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-6">

                    {/* Sección 1: Selección de Columnas */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-blue-500" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Columnas Disponibles ({columns.length})
                                </h3>
                            </div>

                            {/* Botones de Selección Masiva */}
                            {onSelectAll && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAll(true)}
                                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        Seleccionar todas
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => onSelectAll(false)}
                                        className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Ninguna
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            {columns.map((col) => (
                                <label
                                    key={col.id}
                                    className={`
                                        flex items-center space-x-3 cursor-pointer p-2 rounded-lg border transition-all select-none
                                        ${selectedColumns[col.id]
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'}
                                    `}
                                >
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            name={col.id}
                                            checked={!!selectedColumns[col.id]}
                                            onChange={onColumnChange}
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-500"
                                        />
                                        <CheckSquare className="pointer-events-none absolute h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                                    </div>
                                    <span className={`text-xs font-medium truncate ${selectedColumns[col.id] ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`} title={col.label}>
                                        {col.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Sección 2: Vista Previa (Opcional) */}
                    {withPreview && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vista Previa de Datos</h3>
                            </div>

                            {/* Eliminar barra de búsqueda/filtros según solicitud */}

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm max-h-[300px] overflow-auto custom-scrollbar bg-white dark:bg-gray-900">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                                        <p className="text-xs text-gray-500">Generando vista previa...</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                {visibleColumns.map((col) => (
                                                    <th key={col.id} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap bg-gray-50 dark:bg-gray-800">
                                                        {col.label}
                                                    </th>
                                                ))}
                                                {visibleColumns.length === 0 && (
                                                    <th className="px-3 py-2 text-center text-gray-400 italic">Selecciona columnas</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                            {data.length > 0 ? data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                    {visibleColumns.map((col) => (
                                                        <td key={col.id} className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono text-[11px]">
                                                            {getNestedValue(row, col.id) ?? '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={visibleColumns.length || 1} className="px-4 py-8 text-center text-gray-400">
                                                        No se encontraron datos para la vista previa
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer de Acciones Sticky */}
                <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={loading || !someSelected}
                        className={`
                            flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-200
                            ${!someSelected
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5'}
                        `}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Exportando...' : 'Descargar Excel'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
