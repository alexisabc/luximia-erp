'use client';

import React from 'react';

/**
 * Select Atom - Componente de selección básico
 * Mobile First: Touch-friendly con altura mínima de 44px
 */
const Select = React.forwardRef(({ 
    children,
    className = '',
    error = false,
    fullWidth = false,
    disabled = false,
    ...props 
}, ref) => {
    const baseClasses = `
        min-h-[44px] px-3 py-2.5 sm:py-2
        text-sm sm:text-base
        border rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${error 
            ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800'
        }
        ${disabled ? 'bg-gray-100 dark:bg-gray-900' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <select
            ref={ref}
            className={baseClasses}
            disabled={disabled}
            {...props}
        >
            {children}
        </select>
    );
});

Select.displayName = 'Select';

export default Select;
