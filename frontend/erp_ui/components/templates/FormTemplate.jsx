/**
 * FormTemplate - Plantilla para páginas de formulario
 * Mobile First con layout responsive
 */
'use client';

import React from 'react';

export default function FormTemplate({
    title,
    description,
    onSubmit,
    children,
    actions,
    backButton,
    className = '',
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(e);
        }
    };

    return (
        <div className={`container-responsive ${className}`}>
            {/* Header */}
            <header className="mb-6 sm:mb-8">
                {backButton && (
                    <div className="mb-4">
                        {backButton}
                    </div>
                )}

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
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Form Fields */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-4 sm:p-6 lg:p-8">
                    <div className="space-y-4 sm:space-y-6">
                        {children}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sticky bottom-0 sm:static bg-white dark:bg-gray-900 p-4 sm:p-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-800 -mx-4 sm:mx-0">
                        {actions}
                    </div>
                )}
            </form>
        </div>
    );
}
