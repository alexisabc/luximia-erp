/**
 * CardCustom Molecule - Tarjeta mejorada
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para contenedores de contenido con header, body y footer
 */
'use client';

import React from 'react';

/**
 * @typedef {Object} CardCustomProps
 * @property {React.ReactNode} children - Contenido principal
 * @property {React.ReactNode} [header] - Contenido del header
 * @property {React.ReactNode} [footer] - Contenido del footer
 * @property {string} [title] - Título del card
 * @property {string} [description] - Descripción del card
 * @property {React.ComponentType} [icon] - Icono del header
 * @property {React.ReactNode} [actions] - Acciones del header
 * @property {boolean} [hoverable=false] - Efecto hover
 * @property {boolean} [clickable=false] - Cursor pointer
 * @property {Function} [onClick] - Callback al hacer click
 * @property {string} [variant='default'] - Variante: default, bordered, elevated, flat
 * @property {string} [padding='default'] - Padding: none, sm, default, lg
 * @property {string} [className=''] - Clases adicionales
 */

export default function CardCustom({
    children,
    header,
    footer,
    title,
    description,
    icon: Icon,
    actions,
    hoverable = false,
    clickable = false,
    onClick,
    variant = 'default',
    padding = 'default',
    className = '',
}) {
    const variants = {
        default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
        bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
        elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-800',
        flat: 'bg-gray-50 dark:bg-gray-900 border-none',
    };

    const paddings = {
        none: '',
        sm: 'p-3 sm:p-4',
        default: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
    };

    const hasHeader = header || title || Icon || actions;

    return (
        <div
            onClick={clickable ? onClick : undefined}
            className={`
                rounded-lg
                transition-all duration-200
                ${variants[variant]}
                ${hoverable ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
                ${clickable ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {/* Header */}
            {hasHeader && (
                <div className={`
                    flex items-start justify-between gap-4
                    ${padding !== 'none' ? 'px-4 sm:px-6 pt-4 sm:pt-6' : ''}
                    ${!children && !footer ? (padding !== 'none' ? 'pb-4 sm:pb-6' : '') : 'pb-3 sm:pb-4'}
                    border-b border-gray-200 dark:border-gray-700
                `}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {Icon && (
                            <div className="flex-shrink-0 mt-0.5">
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {header || (
                                <>
                                    {title && (
                                        <h3 className="
                                            text-base sm:text-lg font-semibold
                                            text-gray-900 dark:text-white
                                            truncate
                                        ">
                                            {title}
                                        </h3>
                                    )}
                                    {description && (
                                        <p className="
                                            mt-1 text-sm
                                            text-gray-600 dark:text-gray-400
                                        ">
                                            {description}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex-shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {/* Body */}
            {children && (
                <div className={paddings[padding]}>
                    {children}
                </div>
            )}

            {/* Footer */}
            {footer && (
                <div className={`
                    ${padding !== 'none' ? 'px-4 sm:px-6 pb-4 sm:pb-6' : ''}
                    ${children ? 'pt-3 sm:pt-4' : ''}
                    border-t border-gray-200 dark:border-gray-700
                `}>
                    {footer}
                </div>
            )}
        </div>
    );
}
