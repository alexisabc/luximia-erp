/**
 * ListTemplate - Plantilla para páginas de listado
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Template optimizado para listas con filtros, búsqueda y paginación
 */
'use client';

import React from 'react';
import Button from '@/components/atoms/Button';
import SearchBar from '@/components/molecules/SearchBar';
import { Plus, Filter, Download } from 'lucide-react';

/**
 * @typedef {Object} ListTemplateProps
 * @property {string} title - Título de la lista
 * @property {string} [description] - Descripción opcional
 * @property {React.ReactNode} children - Contenido de la lista
 * @property {Function} [onSearch] - Callback de búsqueda
 * @property {Function} [onCreate] - Callback para crear nuevo
 * @property {Function} [onExport] - Callback para exportar
 * @property {React.ReactNode} [filters] - Componente de filtros
 * @property {React.ReactNode} [stats] - Estadísticas/KPIs
 * @property {React.ReactNode} [actions] - Acciones adicionales
 * @property {boolean} [showSearch=true] - Mostrar búsqueda
 * @property {string} [createLabel='Crear nuevo'] - Texto del botón crear
 * @property {string} [className=''] - Clases adicionales
 */

const ListTemplate = ({
    title,
    description,
    children,
    onSearch,
    onCreate,
    onExport,
    filters,
    stats,
    actions,
    showSearch = true,
    createLabel = 'Crear nuevo',
    className = '',
}) => {
    const [showFilters, setShowFilters] = React.useState(false);

    return (
        <div className={`container-responsive spacing-responsive ${className}`}>
            {/* Header */}
            <header className="mb-6 sm:mb-8">
                <div className="flex flex-col gap-4">
                    {/* Title & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="heading-responsive">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Primary Actions */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {actions}
                            {onExport && (
                                <Button
                                    variant="outline"
                                    size="md"
                                    icon={Download}
                                    onClick={onExport}
                                    className="flex-1 sm:flex-none"
                                >
                                    <span className="hidden sm:inline">Exportar</span>
                                </Button>
                            )}
                            {onCreate && (
                                <Button
                                    variant="primary"
                                    size="md"
                                    icon={Plus}
                                    onClick={onCreate}
                                    className="flex-1 sm:flex-none"
                                >
                                    {createLabel}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        {showSearch && (
                            <div className="flex-1">
                                <SearchBar
                                    placeholder="Buscar..."
                                    onSubmit={onSearch}
                                />
                            </div>
                        )}

                        {/* Filter Toggle */}
                        {filters && (
                            <Button
                                variant="outline"
                                size="md"
                                icon={Filter}
                                onClick={() => setShowFilters(!showFilters)}
                                className={showFilters ? 'bg-primary/10' : ''}
                            >
                                Filtros
                            </Button>
                        )}
                    </div>

                    {/* Filters Panel */}
                    {filters && showFilters && (
                        <div className="
                            p-4 sm:p-6
                            bg-gray-50 dark:bg-gray-800/50
                            rounded-lg
                            border border-gray-200 dark:border-gray-700
                            animate-in slide-in-from-top duration-300
                        ">
                            {filters}
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Section */}
            {stats && (
                <section className="mb-6 sm:mb-8" aria-label="Estadísticas">
                    {stats}
                </section>
            )}

            {/* List Content */}
            <section>
                {children}
            </section>
        </div>
    );
};

ListTemplate.displayName = 'ListTemplate';

export default ListTemplate;
