// components/ReusableTable.js
'use client';

import React from 'react';

export default function ReusableTable({ data, columns }) {
    if (!data) {
        return <p className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando datos...</p>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="hidden md:table-header-group bg-gray-50 dark:bg-gray-700">
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                            {columns.map((col, index) => (
                                <th key={index} className={`p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap ${col.header === 'Acciones' ? 'text-right' : ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 md:divide-y-0">
                        {data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.id} className="block mb-4 p-4 rounded-lg bg-white shadow-md md:table-row md:mb-0 md:p-0 md:shadow-none md:rounded-none dark:bg-gray-800">
                                    {columns.map((col, index) => (
                                        <td key={`${row.id}-${index}`} className="block p-2 text-right border-b md:table-cell md:text-left md:p-4 md:border-b-0 dark:border-gray-700" data-label={col.header}>
                                            <span className="md:hidden float-left font-bold text-gray-600 dark:text-gray-400 uppercase text-xs">{col.header}</span>
                                            <div className="text-gray-900 dark:text-white mt-1 md:mt-0">
                                                {col.render ? col.render(row) : (row[col.accessor] || 'N/A')}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center p-8 text-gray-500 dark:text-gray-400">
                                    No hay datos para mostrar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}