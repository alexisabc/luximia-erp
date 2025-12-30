/**
 * Alert Molecule - Alerta/mensaje
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para mostrar mensajes importantes, avisos o errores
 */
'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} AlertProps
 * @property {React.ReactNode} children - Contenido de la alerta
 * @property {string} [title] - Título opcional
 * @property {string} [variant='info'] - Variante: info, success, warning, danger
 * @property {boolean} [dismissible=false] - Mostrar botón de cerrar
 * @property {Function} [onDismiss] - Callback al cerrar
 * @property {React.ReactNode} [action] - Acción personalizada
 * @property {Function} [onAction] - Callback de la acción
 * @property {string} [actionLabel] - Texto del botón de acción
 * @property {string} [className=''] - Clases adicionales
 */

export default function Alert({
    children,
    title,
    variant = 'info',
    dismissible = false,
    onDismiss,
    action,
    onAction,
    actionLabel,
    className = '',
}) {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    const variants = {
        info: {
            icon: Info,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textColor: 'text-blue-900 dark:text-blue-100',
            titleColor: 'text-blue-800 dark:text-blue-200',
        },
        success: {
            icon: CheckCircle,
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-600 dark:text-green-400',
            textColor: 'text-green-900 dark:text-green-100',
            titleColor: 'text-green-800 dark:text-green-200',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            textColor: 'text-yellow-900 dark:text-yellow-100',
            titleColor: 'text-yellow-800 dark:text-yellow-200',
        },
        danger: {
            icon: AlertCircle,
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-600 dark:text-red-400',
            textColor: 'text-red-900 dark:text-red-100',
            titleColor: 'text-red-800 dark:text-red-200',
        },
    };

    const currentVariant = variants[variant];
    const Icon = currentVariant.icon;

    if (!isVisible) return null;

    return (
        <div
            role="alert"
            className={`
                relative
                flex gap-3 sm:gap-4
                p-4 sm:p-5
                rounded-lg border
                ${currentVariant.bg}
                ${currentVariant.border}
                animate-in fade-in slide-in-from-top-2 duration-300
                ${className}
            `}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 ${currentVariant.iconColor}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {title && (
                    <h3 className={`
                        font-semibold text-sm sm:text-base mb-1
                        ${currentVariant.titleColor}
                    `}>
                        {title}
                    </h3>
                )}
                <div className={`
                    text-sm sm:text-base
                    ${currentVariant.textColor}
                `}>
                    {children}
                </div>

                {/* Action */}
                {(action || (onAction && actionLabel)) && (
                    <div className="mt-3 sm:mt-4">
                        {action || (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onAction}
                                className={`
                                    ${variant === 'info' ? 'border-blue-300 text-blue-700 hover:bg-blue-100' : ''}
                                    ${variant === 'success' ? 'border-green-300 text-green-700 hover:bg-green-100' : ''}
                                    ${variant === 'warning' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100' : ''}
                                    ${variant === 'danger' ? 'border-red-300 text-red-700 hover:bg-red-100' : ''}
                                `}
                            >
                                {actionLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Dismiss button */}
            {dismissible && (
                <button
                    type="button"
                    onClick={handleDismiss}
                    className={`
                        flex-shrink-0
                        p-1 rounded-md
                        ${currentVariant.iconColor}
                        hover:bg-black/5 dark:hover:bg-white/5
                        transition-colors duration-200
                        touch-target
                    `}
                    aria-label="Cerrar alerta"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            )}
        </div>
    );
}
