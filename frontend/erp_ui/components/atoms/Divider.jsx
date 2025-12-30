/**
 * Divider Atom - Componente separador
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 */
'use client';

import React from 'react';

/**
 * @typedef {Object} DividerProps
 * @property {string} [orientation='horizontal'] - Orientación: horizontal, vertical
 * @property {string} [variant='solid'] - Variante: solid, dashed, dotted
 * @property {string} [spacing='md'] - Espaciado: sm, md, lg
 * @property {string} [label] - Texto opcional en el divisor
 * @property {string} [className=''] - Clases adicionales
 */

const Divider = ({
    orientation = 'horizontal',
    variant = 'solid',
    spacing = 'md',
    label,
    className = '',
    ...props
}) => {
    const spacings = {
        sm: orientation === 'horizontal' ? 'my-2 sm:my-3' : 'mx-2 sm:mx-3',
        md: orientation === 'horizontal' ? 'my-4 sm:my-6' : 'mx-4 sm:mx-6',
        lg: orientation === 'horizontal' ? 'my-6 sm:my-8' : 'mx-6 sm:mx-8',
    };

    const variants = {
        solid: 'border-solid',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
    };

    if (label && orientation === 'horizontal') {
        return (
            <div className={`relative ${spacings[spacing]} ${className}`} {...props}>
                <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${variants[variant]} border-gray-200 dark:border-gray-800`} />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-background px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground font-medium">
                        {label}
                    </span>
                </div>
            </div>
        );
    }

    if (orientation === 'vertical') {
        return (
            <div
                className={`
                    inline-block h-full
                    border-l ${variants[variant]}
                    border-gray-200 dark:border-gray-800
                    ${spacings[spacing]}
                    ${className}
                `}
                {...props}
            />
        );
    }

    return (
        <hr
            className={`
                border-t ${variants[variant]}
                border-gray-200 dark:border-gray-800
                ${spacings[spacing]}
                ${className}
            `}
            {...props}
        />
    );
};

Divider.displayName = 'Divider';

export default Divider;
