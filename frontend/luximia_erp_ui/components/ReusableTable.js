// components/ReusableTable.js
'use client';

import React from 'react';
import Link from 'next/link';
import { EyeIcon, PencilSquareIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function ReusableTable({ data, columns, actions = {} }) {
    if (!data) {
        return <p className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando datos...</p>;
    }

    const finalColumns = [...columns];
    if (Object.keys(actions).length > 0) {
        finalColumns.push({
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center justify-center space-x-4"> {/* <-- CAMBIO: justify-center */}
                    {actions.onView && (
                        <Link href={`${actions.viewPath}/${row.id}`} className="text-gray-400 hover:text-blue-500" title="Ver Detalle">
                            <EyeIcon className="h-6 w-6" />
                        </Link>
                    )}
                    {actions.onEdit && (
                        <button onClick={() => actions.onEdit(row)} className="group" title="Editar">
                            <PencilSquareIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        </button>
                    )}
                    {actions.onDelete && (
                        <button onClick={() => actions.onDelete(row.id)} className="group" title="Eliminar">
                            <TrashIcon className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                        </button>
                    )}
                    {actions.onHardDelete && (
                        <button onClick={() => actions.onHardDelete(row.id)} className="group" title="Eliminar Definitivamente">
                            <XCircleIcon className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                        </button>
                    )}
                </div>
            )
        });
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {finalColumns.map((col, index) => (
                                <th key={index} className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr key={row.id || rowIndex}>
                                    {finalColumns.map((col, colIndex) => (
                                        <td key={`${row.id || rowIndex}-${colIndex}`} className="p-4 whitespace-nowrap text-center"> {/* <-- CAMBIO: text-center */}
                                            <div className="text-gray-900 dark:text-white">
                                                {col.render ? col.render(row, rowIndex) : (row[col.accessor] || 'N/A')}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={finalColumns.length} className="text-center p-8 text-gray-500 dark:text-gray-400">
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
