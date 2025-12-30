/**
 * Icon Atom - Componente base para iconos
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Wrapper consistente para iconos de Lucide React
 */
'use client';

import React from 'react';

/**
 * @typedef {Object} IconProps
 * @property {React.ComponentType} icon - Componente de icono de Lucide React
 * @property {string} [size='md'] - Tamaño: xs, sm, md, lg, xl
 * @property {string} [color='current'] - Color del icono
 * @property {string} [className=''] - Clases adicionales
 * @property {boolean} [spin=false] - Animación de rotación
 */

const Icon = ({
    icon: IconComponent,
    size = 'md',
    color = 'current',
    className = '',
    spin = false,
    ...props
}) => {
    // Tamaños Mobile First
    const sizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5 sm:w-6 sm:h-6',
        lg: 'w-6 h-6 sm:w-7 sm:h-7',
        xl: 'w-8 h-8 sm:w-10 sm:h-10',
    };

    const colorClass = color === 'current' ? 'text-current' : color;

    return (
        <IconComponent
            className={`
                ${sizes[size]}
                ${colorClass}
                ${spin ? 'animate-spin' : ''}
                ${className}
            `}
            {...props}
        />
    );
};

Icon.displayName = 'Icon';

export default Icon;
