/**
 * Card Molecule - Tarjeta de contenido
 * Mobile First con padding y bordes responsive
 */
'use client';

import React from 'react';

export default function Card({
    title,
    description,
    children,
    footer,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    ...props
}) {
    return (
        <div
            className={`
        bg-white dark:bg-gray-900
        rounded-lg sm:rounded-xl
        shadow-md hover:shadow-lg
        border border-gray-200 dark:border-gray-800
        transition-all duration-200
        overflow-hidden
        ${className}
      `}
            {...props}
        >
            {/* Header */}
            {(title || description) && (
                <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 ${headerClassName}`}>
                    {title && (
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm sm:text-base text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* Body */}
            <div className={`p-4 sm:p-6 ${bodyClassName}`}>
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className={`p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${footerClassName}`}>
                    {footer}
                </div>
            )}
        </div>
    );
}
