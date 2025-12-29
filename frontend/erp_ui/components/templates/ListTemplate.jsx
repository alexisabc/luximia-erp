/**
 * ListTemplate - Plantilla para páginas de listado
 * 
 * Template optimizado para listas de datos con filtros y acciones
 * Mobile First con diseño responsive
 */
'use client';

import React from 'react';

export default function ListTemplate({
    title,
    description,
    searchBar,
    filters,
    actions,
    dataTable,
    emptyState,
    className = '',
}) {
    return (
        <div className={`container-responsive ${className}`}>
            {/* Header */}
            <header className="mb-6 sm:mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Title & Description */}
                    <div className="flex-1">
                        {title && (
                            <h1 className="heading-responsive text-foreground">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </header>

            {/* Search and Filters */}
            {(searchBar || filters) && (
                <section className="mb-6 sm:mb-8 space-y-4">
                    {searchBar && (
                        <div className="w-full sm:max-w-md">
                            {searchBar}
                        </div>
                    )}
                    {filters && (
                        <div className="flex flex-wrap gap-3">
                            {filters}
                        </div>
                    )}
                </section>
            )}

            {/* Data Table or Empty State */}
            <section aria-label="Contenido principal">
                {dataTable || emptyState}
            </section>
        </div>
    );
}
