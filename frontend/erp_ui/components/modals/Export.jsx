import React from 'react';
import Modal from '@/components/modals';
import { Download, Search, CheckSquare } from 'lucide-react';

/**
 * ExportModal
 *
 * Modal reutilizable para seleccionar columnas a exportar y, opcionalmente,
 * previsualizar datos antes de descargar el reporte.
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
}) {
    // Obtiene las columnas visibles (seleccionadas)
    const visibleColumns = columns.filter((c) => selectedColumns[c.id]);

    const getNestedValue = (obj, path) =>
        path.split('__').reduce((acc, part) => (acc ? acc[part] : undefined), obj);

    return (
        <Modal title="Exportar Datos" isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl">
            <div className="space-y-6">

                {withPreview && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar en vista previa..."
                                    value={searchValue}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            {showActiveFilter && (
                                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={onlyActive}
                                        onChange={onToggleActive}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0"
                                    />
                                    <span>Solo activos</span>
                                </label>
                            )}
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    Cargando vista previa...
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                                    <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10">
                                        <tr>
                                            {visibleColumns.map((col) => (
                                                <th
                                                    key={col.id}
                                                    className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800"
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {data.length > 0 ? data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                                {visibleColumns.map((col) => (
                                                    <td
                                                        key={col.id}
                                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                                    >
                                                        {getNestedValue(row, col.id) ?? '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No hay datos para mostrar
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Columnas a Exportar</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {columns.map((col) => (
                            <label key={col.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                <input
                                    type="checkbox"
                                    name={col.id}
                                    checked={!!selectedColumns[col.id]}
                                    onChange={onColumnChange}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300">{col.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 transition-all duration-200"
                    >
                        <Download className="w-4 h-4" />
                        Descargar Excel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
