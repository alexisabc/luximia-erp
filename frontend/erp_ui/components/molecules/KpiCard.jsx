/**
 * KpiCard Molecule - Tarjeta de KPI (Key Performance Indicator)
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula compuesta de Card (átomo) + contenido estructurado
 */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * @typedef {Object} KpiCardProps
 * @property {string} title - Título del KPI
 * @property {number} value - Valor numérico principal
 * @property {string} [prefix='$'] - Prefijo del valor (ej: '$', '%')
 * @property {string} [suffix=''] - Sufijo del valor
 * @property {number} [trend] - Porcentaje de cambio (positivo/negativo)
 * @property {string} [icon] - Icono opcional (componente Lucide)
 * @property {string} [variant='default'] - Variante de color: default, success, warning, danger
 * @property {boolean} [compact=false] - Versión compacta para móvil
 * @property {string} [className=''] - Clases adicionales
 */

const KpiCard = ({
    title,
    value,
    prefix = '$',
    suffix = '',
    trend,
    icon: Icon,
    variant = 'default',
    compact = false,
    className = '',
}) => {
    // Asegurar que el valor sea un número
    const numberValue = Number(value ?? 0);

    // Variantes de color
    const variants = {
        default: 'border-l-primary dark:border-l-primary/80',
        success: 'border-l-green-600 dark:border-l-green-500',
        warning: 'border-l-yellow-600 dark:border-l-yellow-500',
        danger: 'border-l-red-600 dark:border-l-red-500',
    };

    // Determinar icono de tendencia
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    // Formatear valor - Mobile First (notación compacta para números grandes)
    const formatValue = (num) => {
        return num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            notation: num > 1000000 ? 'compact' : 'standard',
            compactDisplay: 'short'
        });
    };

    return (
        <Card
            className={`
                border-l-4 ${variants[variant]}
                hover:shadow-lg hover:scale-[1.02]
                transition-all duration-300
                ${compact ? 'min-h-[100px]' : 'min-h-[120px] sm:min-h-[140px]'}
                ${className}
            `}
        >
            <CardContent className={`
                ${compact ? 'p-4' : 'p-4 sm:p-6'}
                flex flex-col h-full justify-between
            `}>
                {/* Header - Título e Icono */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`
                        font-medium text-muted-foreground uppercase tracking-wide
                        ${compact ? 'text-xs' : 'text-xs sm:text-sm'}
                        truncate flex-1
                    `}>
                        {title}
                    </h3>
                    {Icon && (
                        <div className={`
                            flex-shrink-0 rounded-lg p-2
                            bg-primary/10 text-primary
                            ${compact ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'}
                        `}>
                            <Icon className="w-full h-full" />
                        </div>
                    )}
                </div>

                {/* Valor Principal - Mobile First */}
                <div className="flex items-end justify-between gap-2">
                    <p className={`
                        font-extrabold text-transparent bg-clip-text 
                        bg-gradient-to-r from-foreground to-foreground/70
                        ${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'}
                        break-all
                    `}>
                        {prefix}{formatValue(numberValue)}{suffix}
                    </p>

                    {/* Tendencia */}
                    {trend !== undefined && (
                        <div className={`
                            flex items-center gap-1 
                            ${compact ? 'text-xs' : 'text-xs sm:text-sm'}
                            font-semibold
                            ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'}
                        `}>
                            {getTrendIcon()}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

KpiCard.displayName = 'KpiCard';

export default KpiCard;
