'use client';

import React from 'react';

/**
 * Checkbox Atom - Componente de checkbox básico
 * Mobile First: Touch-friendly con tamaño mínimo de 24px (dentro del área de 44px)
 */
const Checkbox = React.forwardRef(({
    label,
    className = '',
    error = false,
    disabled = false,
    ...props
}, ref) => {
    const checkboxClasses = `
        w-5 h-5 sm:w-4 sm:h-4
        rounded border-2
        transition-all duration-200
        focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error
            ? 'border-red-500 text-red-600'
            : 'border-gray-300 dark:border-gray-600 text-blue-600'
        }
        ${disabled ? 'bg-gray-100 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}
    `.trim().replace(/\s+/g, ' ');

    if (label) {
        return (
            <label className={`flex items-center gap-3 min-h-[44px] cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
                <input
                    ref={ref}
                    type="checkbox"
                    className={checkboxClasses}
                    disabled={disabled}
                    {...props}
                />
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 select-none">
                    {label}
                </span>
            </label>
        );
    }

    return (
        <input
            ref={ref}
            type="checkbox"
            className={`${checkboxClasses} ${className}`}
            disabled={disabled}
            {...props}
        />
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
