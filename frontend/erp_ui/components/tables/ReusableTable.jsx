// components/ui/ReusableTable.jsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, SquarePen, Trash, XCircle, Search } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Overlay from '@/components/loaders/Overlay';
import Pagination from '@/components/ui/Pagination';
import useDebounce from '@/hooks/useDebounce'; // Asegúrate de importar esto

export default function ReusableTable({
    data = [], // Valor por defecto
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
    onSearch, // Nueva prop para búsqueda del lado del servidor
}) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    // Efecto para activar la búsqueda del lado del servidor cuando cambia el query debounced
    React.useEffect(() => {
        if (onSearch) {
            onSearch(debouncedQuery);
        }
    }, [debouncedQuery, onSearch]);

    const defaultFilter = (row, q) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(q.toLowerCase())
        );

    // Si hay onSearch, usamos 'data' directamente (el padre ya filtró).
    // Si no, filtramos localmente.
    const filteredData = onSearch
        ? (data || [])
        : (query
            ? (data || []).filter((row) => (filterFunction || defaultFilter)(row, query))
            : (data || []));

    const finalColumns = [...columns];
    if (Object.keys(actions).length > 0) {
        finalColumns.push({
            header: 'Acciones',
            render: (row) => (
                <div className="flex items-center justify-center space-x-2">
                    {/* Custom Actions */}
                    {actions.custom && actions.custom.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => action.onClick(row)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                title={action.tooltip || action.label}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        );
                    })}

                    {actions.onView && (
                        <Link href={`${actions.viewPath}/${row.id}`} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200" title="Ver Detalle">
                            <Eye className="h-5 w-5" />
                        </Link>
                    )}
                    {actions.onEdit && (
                        <button onClick={() => actions.onEdit(row)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200" title="Editar">
                            <SquarePen className="h-5 w-5" />
                        </button>
                    )}
                    {actions.onDelete && (
                        <button onClick={() => actions.onDelete(row.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200" title="Eliminar">
                            <Trash className="h-5 w-5" />
                        </button>
                    )}
                    {actions.onHardDelete && (
                        <button onClick={() => actions.onHardDelete(row.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200" title="Eliminar Definitivamente">
                            <XCircle className="h-5 w-5" />
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
        <div className="relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden transition-all duration-300">
            {search && (
                <div className="p-5 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-white/40 dark:bg-gray-800/40">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200/60 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none"
                        />
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                            {finalColumns.map((col, index) => (
                                <TableHead key={index} className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center first:pl-6 last:pr-6 whitespace-nowrap">
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIndex) => (
                                <TableRow
                                    key={row.id || rowIndex}
                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-gray-100 dark:border-gray-800/50 transition-colors duration-150 group"
                                >
                                    {finalColumns.map((col, colIndex) => (
                                        <TableCell key={`${row.id || rowIndex}-${colIndex}`} className="p-4 whitespace-nowrap text-center first:pl-6 last:pr-6">
                                            <div className="text-gray-700 dark:text-gray-300 font-medium text-sm group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                                                {col.cell
                                                    ? col.cell(row, rowIndex)
                                                    : col.render
                                                        ? col.render(row, rowIndex)
                                                        : (row[col.accessorKey] || row[col.accessor] || 'N/A')}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={finalColumns.length} className="text-center py-16 text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                        <p>No se encontraron resultados.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {paginationProps && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-white/40 dark:bg-gray-800/40">
                    <Pagination {...paginationProps} />
                </div>
            )}
            <Overlay show={loading || isPaginating} />
        </div>
    );
}
