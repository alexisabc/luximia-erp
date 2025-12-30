/**
 * Avatar Atom - Componente base para avatares
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 */
'use client';

import React from 'react';
import { User } from 'lucide-react';

/**
 * @typedef {Object} AvatarProps
 * @property {string} [src] - URL de la imagen
 * @property {string} [alt='Avatar'] - Texto alternativo
 * @property {string} [fallback] - Texto de respaldo (iniciales)
 * @property {string} [size='md'] - Tamaño: xs, sm, md, lg, xl
 * @property {string} [shape='circle'] - Forma: circle, square, rounded
 * @property {string} [className=''] - Clases adicionales
 */

const Avatar = ({
    src,
    alt = 'Avatar',
    fallback,
    size = 'md',
    shape = 'circle',
    className = '',
    ...props
}) => {
    const [imageError, setImageError] = React.useState(false);

    // Tamaños Mobile First
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 sm:w-12 sm:h-12 text-base',
        lg: 'w-12 h-12 sm:w-16 sm:h-16 text-lg',
        xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl',
    };

    const shapes = {
        circle: 'rounded-full',
        square: 'rounded-none',
        rounded: 'rounded-lg',
    };

    const baseStyles = `
        inline-flex items-center justify-center
        bg-gradient-to-br from-primary/20 to-primary/10
        text-primary font-semibold
        overflow-hidden
        flex-shrink-0
    `;

    // Si hay imagen y no ha fallado
    if (src && !imageError) {
        return (
            <div className={`${baseStyles} ${sizes[size]} ${shapes[shape]} ${className}`} {...props}>
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    // Si hay fallback text (iniciales)
    if (fallback) {
        return (
            <div className={`${baseStyles} ${sizes[size]} ${shapes[shape]} ${className}`} {...props}>
                {fallback}
            </div>
        );
    }

    // Icono por defecto
    return (
        <div className={`${baseStyles} ${sizes[size]} ${shapes[shape]} ${className}`} {...props}>
            <User className="w-1/2 h-1/2" />
        </div>
    );
};

Avatar.displayName = 'Avatar';

export default Avatar;
