//components/ui/modals/Export.jsx
import React from 'react';
import Modal from '@/components/ui/modals';

/**
 * ExportModal
 *
 * Modal reutilizable para seleccionar columnas a exportar y, opcionalmente,
 * previsualizar datos antes de descargar el reporte. Para mantener la
 * compatibilidad hacia atrás, todas las características avanzadas son
 * opcionales y se activan únicamente cuando se proporciona la información
 * correspondiente.
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
    onSearchChange = () => {},
    loading = false,
    withPreview = false,
    showActiveFilter = false,
    onlyActive = false,
    onToggleActive = () => {},
}) {
    // Obtiene las columnas visibles (seleccionadas)
    const visibleColumns = columns.filter((c) => selectedColumns[c.id]);

    const getNestedValue = (obj, path) =>
        path.split('__').reduce((acc, part) => (acc ? acc[part] : undefined), obj);

    return (
        <Modal title="Seleccionar Columnas para Exportar" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4 p-2 max-h-[70vh] overflow-y-auto">
                {withPreview && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="flex-1 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                            {showActiveFilter && (
                                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={onlyActive}
                                        onChange={onToggleActive}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Solo activos</span>
                                </label>
                            )}
                        </div>
                        <div className="overflow-auto border rounded max-h-64 dark:border-gray-700">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    Cargando...
                                </div>
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
                                        {data.map((row, idx) => (
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {columns.map((col) => (
                        <label key={col.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name={col.id}
                                checked={!!selectedColumns[col.id]}
                                onChange={onColumnChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{col.label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="pt-5 mt-4 flex justify-end bg-gray-50 dark:bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                    Cancelar
                </button>
                <button
                    onClick={onDownload}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Descargar Excel
                </button>
            </div>
        </Modal>
    );
}