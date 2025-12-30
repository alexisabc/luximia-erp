/**
 * EmptyState Molecule - Estado vacío
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para mostrar cuando no hay datos disponibles
 */
'use client';

import React from 'react';
import { Search, Inbox, FileX, AlertCircle } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} EmptyStateProps
 * @property {string} [title='No hay datos'] - Título principal
 * @property {string} [description] - Descripción opcional
 * @property {React.ComponentType} [icon] - Icono personalizado
 * @property {string} [variant='default'] - Variante: default, search, error, empty
 * @property {React.ReactNode} [action] - Botón de acción personalizado
 * @property {Function} [onAction] - Callback del botón de acción
 * @property {string} [actionLabel] - Texto del botón de acción
 * @property {string} [className=''] - Clases adicionales
 */

export default function EmptyState({
    title = 'No hay datos',
    description,
    icon: CustomIcon,
    variant = 'default',
    action,
    onAction,
    actionLabel,
    className = '',
}) {
    // Variantes predefinidas
    const variants = {
        default: {
            icon: Inbox,
            iconColor: 'text-gray-300 dark:text-gray-600',
            title: title || 'No hay datos disponibles',
            description: description || 'No se encontraron elementos para mostrar.',
        },
        search: {
            icon: Search,
            iconColor: 'text-gray-300 dark:text-gray-600',
            title: title || 'No se encontraron resultados',
            description: description || 'Intenta ajustar tu búsqueda o filtros.',
        },
        error: {
            icon: AlertCircle,
            iconColor: 'text-red-300 dark:text-red-600',
            title: title || 'Error al cargar datos',
            description: description || 'Ocurrió un error al cargar la información.',
        },
        empty: {
            icon: FileX,
            iconColor: 'text-gray-300 dark:text-gray-600',
            title: title || 'Aún no hay contenido',
            description: description || 'Comienza agregando tu primer elemento.',
        },
    };

    const currentVariant = variants[variant] || variants.default;
    const Icon = CustomIcon || currentVariant.icon;

    return (
        <div className={`
            flex flex-col items-center justify-center
            py-12 sm:py-16 lg:py-20
            px-4 sm:px-6
            text-center
            ${className}
        `}>
            {/* Icono */}
            <div className="mb-4 sm:mb-6">
                <Icon className={`
                    w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
                    ${currentVariant.iconColor}
                    animate-in fade-in zoom-in-95 duration-500
                `} />
            </div>

            {/* Título */}
            <h3 className="
                text-lg sm:text-xl lg:text-2xl
                font-semibold
                text-gray-900 dark:text-white
                mb-2
                animate-in fade-in slide-in-from-bottom-2 duration-500
                delay-100
            ">
                {currentVariant.title}
            </h3>

            {/* Descripción */}
            {currentVariant.description && (
                <p className="
                    text-sm sm:text-base
                    text-gray-600 dark:text-gray-400
                    max-w-md
                    mb-6 sm:mb-8
                    animate-in fade-in slide-in-from-bottom-2 duration-500
                    delay-200
                ">
                    {currentVariant.description}
                </p>
            )}

            {/* Acción */}
            {(action || (onAction && actionLabel)) && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                    {action || (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onAction}
                        >
                            {actionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
