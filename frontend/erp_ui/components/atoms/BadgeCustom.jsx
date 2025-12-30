/**
 * Badge Atom - Etiqueta/insignia
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Átomo para mostrar estados, categorías o etiquetas
 */
'use client';

import React from 'react';
import { X } from 'lucide-react';

/**
 * @typedef {Object} BadgeProps
 * @property {React.ReactNode} children - Contenido del badge
 * @property {string} [variant='default'] - Variante: default, primary, success, warning, danger, info, outline
 * @property {string} [size='md'] - Tamaño: sm, md, lg
 * @property {boolean} [dot=false] - Mostrar punto indicador
 * @property {boolean} [removable=false] - Mostrar botón de eliminar
 * @property {Function} [onRemove] - Callback al eliminar
 * @property {React.ComponentType} [icon] - Icono opcional
 * @property {string} [className=''] - Clases adicionales
 */

export default function BadgeCustom({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    removable = false,
    onRemove,
    icon: Icon,
    className = '',
}) {
    const variants = {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
        outline: 'bg-transparent border-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const dotColors = {
        default: 'bg-gray-500',
        primary: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-cyan-500',
        outline: 'bg-gray-500',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1.5
                font-medium
                rounded-full
                transition-colors duration-200
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
        >
            {/* Dot indicator */}
            {dot && (
                <span
                    className={`
                        w-2 h-2 rounded-full
                        ${dotColors[variant]}
                        animate-pulse
                    `}
                />
            )}

            {/* Icon */}
            {Icon && (
                <Icon className={iconSizes[size]} />
            )}

            {/* Content */}
            <span>{children}</span>

            {/* Remove button */}
            {removable && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="
                        ml-0.5 -mr-1
                        hover:bg-black/10 dark:hover:bg-white/10
                        rounded-full
                        p-0.5
                        transition-colors duration-200
                        touch-target
                    "
                    aria-label="Eliminar"
                >
                    <X className={iconSizes[size]} />
                </button>
            )}
        </span>
    );
}
