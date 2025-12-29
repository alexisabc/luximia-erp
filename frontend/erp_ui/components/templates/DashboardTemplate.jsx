/**
 * DashboardTemplate - Plantilla base para páginas de dashboard
 * 
 * Template que define la estructura de una página de dashboard
 * Mobile First con layout responsive
 */
'use client';

import React from 'react';

export default function DashboardTemplate({
    title,
    description,
    actions,
    filters,
    stats,
    mainContent,
    sidebar,
    className = '',
}) {
    return (
        <div className={`container-responsive ${className}`}>
            {/* Header Section */}
            <header className="mb-6 sm:mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                {/* Filters */}
                {filters && (
                    <div className="mt-4 sm:mt-6">
                        {filters}
                    </div>
                )}
            </header>

            {/* Stats Section */}
            {stats && (
                <section className="mb-6 sm:mb-8" aria-label="Estadísticas">
                    {stats}
                </section>
            )}

            {/* Main Content with Optional Sidebar */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                {/* Main Content */}
                <main className={sidebar ? 'lg:col-span-9' : 'lg:col-span-12'}>
                    {mainContent}
                </main>

                {/* Sidebar */}
                {sidebar && (
                    <aside className="lg:col-span-3">
                        {sidebar}
                    </aside>
                )}
            </div>
        </div>
    );
}
