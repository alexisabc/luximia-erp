/**
 * Spinner Atom - Componente de carga
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 */
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @typedef {Object} SpinnerProps
 * @property {string} [size='md'] - Tamaño: xs, sm, md, lg, xl
 * @property {string} [variant='primary'] - Variante de color
 * @property {string} [className=''] - Clases adicionales
 */

const Spinner = ({
    size = 'md',
    variant = 'primary',
    className = '',
    ...props
}) => {
    // Tamaños Mobile First
    const sizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6 sm:w-8 sm:h-8',
        lg: 'w-8 h-8 sm:w-10 sm:h-10',
        xl: 'w-12 h-12 sm:w-16 sm:h-16',
    };

    const variants = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        white: 'text-white',
    };

    return (
        <Loader2
            className={`
                animate-spin
                ${sizes[size]}
                ${variants[variant]}
                ${className}
            `}
            {...props}
        />
    );
};

Spinner.displayName = 'Spinner';

export default Spinner;
