/**
 * StatCard Molecule - Tarjeta de estadística
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para mostrar estadísticas con icono, título y valor
 */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * @typedef {Object} StatCardProps
 * @property {string} title - Título de la estadística
 * @property {string|number} value - Valor principal
 * @property {React.ComponentType} [icon] - Icono de Lucide React
 * @property {number} [change] - Cambio porcentual
 * @property {string} [changeLabel] - Etiqueta del cambio (ej: "vs mes anterior")
 * @property {string} [variant='default'] - Variante: default, primary, success, warning, danger
 * @property {boolean} [loading=false] - Estado de carga
 * @property {string} [className=''] - Clases adicionales
 */

const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeLabel,
    variant = 'default',
    loading = false,
    className = '',
}) => {
    // Variantes de color
    const variants = {
        default: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-700 dark:text-gray-300',
            iconBg: 'bg-gray-200 dark:bg-gray-700',
        },
        primary: {
            bg: 'bg-primary/5 dark:bg-primary/10',
            text: 'text-primary',
            iconBg: 'bg-primary/10 dark:bg-primary/20',
        },
        success: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            text: 'text-green-700 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-800/30',
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            text: 'text-yellow-700 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-800/30',
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-700 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-800/30',
        },
    };

    const currentVariant = variants[variant];

    return (
        <Card className={`
            ${currentVariant.bg}
            border-none
            hover:shadow-md
            transition-all duration-300
            ${className}
        `}>
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide truncate">
                            {title}
                        </p>

                        {loading ? (
                            <div className="mt-2 h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ) : (
                            <p className={`
                                mt-2 text-2xl sm:text-3xl font-bold
                                ${currentVariant.text}
                                break-words
                            `}>
                                {value}
                            </p>
                        )}

                        {/* Cambio porcentual */}
                        {change !== undefined && !loading && (
                            <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm">
                                {change > 0 ? (
                                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                ) : change < 0 ? (
                                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                ) : null}
                                <span className={`
                                    font-semibold
                                    ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}
                                `}>
                                    {change > 0 ? '+' : ''}{change}%
                                </span>
                                {changeLabel && (
                                    <span className="text-muted-foreground ml-1">
                                        {changeLabel}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Icono */}
                    {Icon && (
                        <div className={`
                            flex-shrink-0 
                            p-2 sm:p-3 
                            rounded-lg sm:rounded-xl
                            ${currentVariant.iconBg}
                            ${currentVariant.text}
                        `}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

StatCard.displayName = 'StatCard';

export default StatCard;
