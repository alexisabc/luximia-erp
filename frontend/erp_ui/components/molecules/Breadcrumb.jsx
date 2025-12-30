/**
 * Breadcrumb Molecule - Navegación de migas de pan
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para mostrar la ruta de navegación actual
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label - Texto a mostrar
 * @property {string} [href] - URL (opcional para el último item)
 * @property {React.ComponentType} [icon] - Icono opcional
 */

/**
 * @typedef {Object} BreadcrumbProps
 * @property {BreadcrumbItem[]} items - Items del breadcrumb
 * @property {boolean} [showHome=true] - Mostrar icono de inicio
 * @property {string} [homeHref='/'] - URL del inicio
 * @property {string} [separator='chevron'] - Separador: chevron, slash, dot
 * @property {string} [className=''] - Clases adicionales
 */

export default function Breadcrumb({
    items = [],
    showHome = true,
    homeHref = '/',
    separator = 'chevron',
    className = '',
}) {
    const separators = {
        chevron: <ChevronRight className="w-4 h-4 text-gray-400" />,
        slash: <span className="text-gray-400">/</span>,
        dot: <span className="text-gray-400">•</span>,
    };

    const SeparatorIcon = separators[separator] || separators.chevron;

    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex items-center flex-wrap gap-2 ${className}`}
        >
            <ol className="flex items-center flex-wrap gap-2">
                {/* Home */}
                {showHome && (
                    <>
                        <li>
                            <Link
                                href={homeHref}
                                className="
                                    flex items-center gap-1
                                    text-sm text-gray-600 dark:text-gray-400
                                    hover:text-primary dark:hover:text-primary
                                    transition-colors duration-200
                                    touch-target
                                "
                                aria-label="Inicio"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Inicio</span>
                            </Link>
                        </li>
                        {items.length > 0 && (
                            <li aria-hidden="true">
                                {SeparatorIcon}
                            </li>
                        )}
                    </>
                )}

                {/* Items */}
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const ItemIcon = item.icon;

                    return (
                        <React.Fragment key={index}>
                            <li>
                                {isLast || !item.href ? (
                                    <span
                                        className="
                                            flex items-center gap-1
                                            text-sm font-medium
                                            text-gray-900 dark:text-white
                                        "
                                        aria-current={isLast ? 'page' : undefined}
                                    >
                                        {ItemIcon && <ItemIcon className="w-4 h-4" />}
                                        <span className="truncate max-w-[150px] sm:max-w-none">
                                            {item.label}
                                        </span>
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="
                                            flex items-center gap-1
                                            text-sm
                                            text-gray-600 dark:text-gray-400
                                            hover:text-primary dark:hover:text-primary
                                            transition-colors duration-200
                                            touch-target
                                        "
                                    >
                                        {ItemIcon && <ItemIcon className="w-4 h-4" />}
                                        <span className="truncate max-w-[150px] sm:max-w-none">
                                            {item.label}
                                        </span>
                                    </Link>
                                )}
                            </li>

                            {!isLast && (
                                <li aria-hidden="true">
                                    {SeparatorIcon}
                                </li>
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
