/**
 * DataTable Organism - Tabla de datos reutilizable
 * 
 * Organismo complejo que combina SearchBar, Table, Pagination
 * Mobile First con diseño responsive (cards en móvil, tabla en desktop)
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, SquarePen, Trash, XCircle, Search } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import SearchBar from '@/components/molecules/SearchBar';
import Overlay from '@/components/loaders/Overlay';
import Pagination from '@/components/ui/Pagination';
import useDebounce from '@/hooks/useDebounce';

export default function DataTable({
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
    onSearch,
    mobileCardView = true, // Nueva prop para habilitar vista de cards en móvil
}) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    // Efecto para búsqueda del lado del servidor
    React.useEffect(() => {
        if (onSearch) {
            onSearch(debouncedQuery);
        }
    }, [debouncedQuery, onSearch]);

    const defaultFilter = (row, q) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(q.toLowerCase())
        );

    // Filtrado de datos
    const filteredData = onSearch
        ? (data || [])
        : (query
            ? (data || []).filter((row) => (filterFunction || defaultFilter)(row, query))
            : (data || []));

    // Columnas finales con acciones
    const finalColumns = [...columns];
    if (Object.keys(actions).length > 0) {
        finalColumns.push({
            header: 'Acciones',
            render: (row) => <ActionButtons row={row} actions={actions} />,
        });
    }

    const paginationProps =
        pagination ||
        (pageSize && currentPage != null && totalCount != null && onPageChange
            ? { pageSize, currentPage, totalCount, onPageChange }
            : null);

    return (
        <div className="relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden transition-all duration-300">

            {/* Search Bar */}
            {search && (
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800/50 bg-white/40 dark:bg-gray-800/40">
                    <SearchBar
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClear={() => setQuery('')}
                        placeholder="Buscar..."
                        fullWidth
                    />
                </div>
            )}

            {/* Mobile Card View */}
            {mobileCardView && (
                <div className="lg:hidden">
                    {filteredData.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredData.map((row, index) => (
                                <MobileCard
                                    key={row.id || index}
                                    row={row}
                                    columns={columns}
                                    actions={actions}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}

            {/* Desktop Table View */}
            <div className={mobileCardView ? 'hidden lg:block overflow-x-auto' : 'overflow-x-auto'}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                            {finalColumns.map((col, index) => (
                                <TableHead
                                    key={index}
                                    className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center first:pl-6 last:pr-6 whitespace-nowrap"
                                >
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
                                        <TableCell
                                            key={`${row.id || rowIndex}-${colIndex}`}
                                            className="p-4 whitespace-nowrap text-center first:pl-6 last:pr-6"
                                        >
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
                                <TableCell colSpan={finalColumns.length}>
                                    <EmptyState />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {paginationProps && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-white/40 dark:bg-gray-800/40">
                    <Pagination {...paginationProps} />
                </div>
            )}

            {/* Loading Overlay */}
            <Overlay show={loading || isPaginating} />
        </div>
    );
}

// Componente para vista de tarjeta en móvil
function MobileCard({ row, columns, actions }) {
    return (
        <div className="p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors duration-150">
            <div className="space-y-3">
                {columns.map((col, index) => (
                    <div key={index} className="flex justify-between items-start gap-4">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                            {col.header}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right flex-1">
                            {col.cell
                                ? col.cell(row)
                                : col.render
                                    ? col.render(row)
                                    : (row[col.accessorKey] || row[col.accessor] || 'N/A')}
                        </span>
                    </div>
                ))}

                {/* Acciones en móvil */}
                {Object.keys(actions).length > 0 && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                        <ActionButtons row={row} actions={actions} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente de botones de acción
function ActionButtons({ row, actions }) {
    return (
        <div className="flex items-center justify-center flex-wrap gap-2">
            {/* Custom Actions */}
            {actions.custom && actions.custom.map((action, idx) => {
                if (action.shouldShow && !action.shouldShow(row)) return null;
                const Icon = action.icon;
                return (
                    <button
                        key={idx}
                        onClick={() => action.onClick(row)}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title={action.tooltip || action.label}
                        aria-label={action.tooltip || action.label}
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                );
            })}

            {actions.onView && (
                <Link
                    href={`${actions.viewPath}/${row.id}`}
                    className="p-2 rounded-lg text-sky-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Ver Detalle"
                    aria-label="Ver Detalle"
                >
                    <Eye className="h-5 w-5" />
                </Link>
            )}

            {actions.onEdit && (
                <button
                    onClick={() => actions.onEdit(row)}
                    className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Editar"
                    aria-label="Editar"
                >
                    <SquarePen className="h-5 w-5" />
                </button>
            )}

            {actions.onDelete && (
                <button
                    onClick={() => actions.onDelete(row.id)}
                    className="p-2 rounded-lg text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Desactivar"
                    aria-label="Desactivar"
                >
                    <Trash className="h-5 w-5" />
                </button>
            )}

            {actions.onHardDelete && (
                <button
                    onClick={() => actions.onHardDelete(row.id)}
                    className="p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Eliminar Definitivamente"
                    aria-label="Eliminar Definitivamente"
                >
                    <XCircle className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

// Estado vacío
function EmptyState() {
    return (
        <div className="text-center py-12 sm:py-16 text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center justify-center space-y-2">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm sm:text-base">No se encontraron resultados.</p>
            </div>
        </div>
    );
}
