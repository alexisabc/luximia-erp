/**
 * ActionCard Molecule - Tarjeta de acción rápida
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para acciones rápidas con icono y descripción
 */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ChevronRight } from 'lucide-react';

/**
 * @typedef {Object} ActionCardProps
 * @property {string} title - Título de la acción
 * @property {string} [description] - Descripción opcional
 * @property {React.ComponentType} icon - Icono de Lucide React
 * @property {Function} [onClick] - Función al hacer click
 * @property {string} [href] - URL de navegación
 * @property {string} [variant='default'] - Variante de color
 * @property {boolean} [disabled=false] - Estado deshabilitado
 * @property {string} [className=''] - Clases adicionales
 */

const ActionCard = ({
    title,
    description,
    icon: Icon,
    onClick,
    href,
    variant = 'default',
    disabled = false,
    className = '',
}) => {
    const variants = {
        default: 'hover:border-primary/50 hover:bg-primary/5',
        primary: 'border-primary/20 hover:border-primary hover:bg-primary/10',
        success: 'border-green-200 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20',
        warning: 'border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        danger: 'border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    };

    const iconColors = {
        default: 'text-primary',
        primary: 'text-primary',
        success: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        danger: 'text-red-600 dark:text-red-400',
    };

    const Component = href ? 'a' : 'button';
    const props = href ? { href } : { onClick, type: 'button' };

    return (
        <Component
            {...props}
            disabled={disabled}
            className={`
                block w-full text-left
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <Card className={`
                ${variants[variant]}
                transition-all duration-300
                hover:shadow-lg hover:scale-[1.02]
                active:scale-[0.98]
                ${disabled ? 'pointer-events-none' : ''}
                ${className}
            `}>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icono */}
                        <div className={`
                            flex-shrink-0
                            p-2 sm:p-3
                            rounded-lg sm:rounded-xl
                            bg-gradient-to-br from-primary/10 to-primary/5
                            ${iconColors[variant]}
                        `}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                                {title}
                            </h3>
                            {description && (
                                <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Flecha */}
                        <ChevronRight className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        </Component>
    );
};

ActionCard.displayName = 'ActionCard';

export default ActionCard;
