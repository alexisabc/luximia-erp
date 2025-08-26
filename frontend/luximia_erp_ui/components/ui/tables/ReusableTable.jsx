// components/ui/ReusableTable.jsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, SquarePen, Trash, XCircle } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/tables/shadcn-table-base';
import Overlay from '@/components/loaders/Overlay';
import Pagination from '@/components/ui/Pagination';

export default function ReusableTable({
    data = [],
    columns,
    actions = {},
    search = true,
    filterFunction,
    pagination,
    pageSize,
    currentPage,
    totalCount,
    onPageChange,
    loading = false,
    isPaginating = false,
}) {
    const [query, setQuery] = useState('');

    const defaultFilter = (row, q) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(q.toLowerCase())
        );

    const filteredData = query
        ? data.filter((row) => (filterFunction || defaultFilter)(row, query))
        : data;

    const finalColumns = [...columns];
    if (Object.keys(actions).length > 0) {
        finalColumns.push({
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center justify-center space-x-4">
                    {actions.onView && (
                        <Link href={`${actions.viewPath}/${row.id}`} className="text-gray-400 hover:text-blue-500" title="Ver Detalle">
                            <Eye className="h-6 w-6" />
                        </Link>
                    )}
                    {actions.onEdit && (
                        <button onClick={() => actions.onEdit(row)} className="group" title="Editar">
                            <SquarePen className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        </button>
                    )}
                    {actions.onDelete && (
                        <button onClick={() => actions.onDelete(row.id)} className="group" title="Eliminar">
                            <Trash className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                        </button>
                    )}
                    {actions.onHardDelete && (
                        <button onClick={() => actions.onHardDelete(row.id)} className="group" title="Eliminar Definitivamente">
                            <XCircle className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                        </button>
                    )}
                </div>
            ),
        });
    }

    const paginationProps =
        pagination ||
        (pageSize && currentPage != null && totalCount != null && onPageChange
            ? { pageSize, currentPage, totalCount, onPageChange }
            : null);

    return (
        <div className="relative bg-white dark:bg-gray-800 shadow-lg rounded-xl">
            {search && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full p-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                    />
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-700">
                        {finalColumns.map((col, index) => (
                            <TableHead key={index} className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center">
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length > 0 ? (
                        filteredData.map((row, rowIndex) => (
                            <TableRow key={row.id || rowIndex}>
                                {finalColumns.map((col, colIndex) => (
                                    <TableCell key={`${row.id || rowIndex}-${colIndex}`} className="p-4 whitespace-nowrap text-center">
                                        <div className="text-gray-900 dark:text-white">
                                            {col.render ? col.render(row, rowIndex) : (row[col.accessor] || 'N/A')}
                                        </div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={finalColumns.length} className="text-center p-8 text-gray-500 dark:text-gray-400">
                                No hay datos para mostrar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            {paginationProps && (
                <Pagination {...paginationProps} />
            )}
            <Overlay show={loading || isPaginating} />
        </div>
    );
}