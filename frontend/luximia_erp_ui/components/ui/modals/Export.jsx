//components/ui/modals/Export.jsx
import React from 'react';
import Modal from '.';

export default function ExportModal({ isOpen, onClose, columns, selectedColumns, onColumnChange, onDownload }) {
    return (
        <Modal title="Seleccionar Columnas para Exportar" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4 p-2 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {columns.map(col => (
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
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                    Cancelar
                </button>
                <button onClick={onDownload} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                    Descargar Excel
                </button>
            </div>
        </Modal>
    );
}