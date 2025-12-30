/**
 * Modal Organism - Modal responsive MEJORADO
 * 
 * Mobile First: fullscreen/slide from bottom en móvil, centered en desktop
 * Con trap de foco, variantes y mejor accesibilidad
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen - Estado abierto/cerrado
 * @property {Function} onClose - Callback al cerrar
 * @property {string} [title] - Título del modal
 * @property {string} [description] - Descripción opcional
 * @property {React.ReactNode} children - Contenido del modal
 * @property {React.ReactNode} [footer] - Footer personalizado
 * @property {string} [size='md'] - Tamaño: sm, md, lg, xl, full
 * @property {boolean} [closeOnOverlay=true] - Cerrar al click en overlay
 * @property {boolean} [closeOnEsc=true] - Cerrar con tecla Escape
 * @property {boolean} [showCloseButton=true] - Mostrar botón de cerrar
 * @property {boolean} [fullscreenMobile=false] - Fullscreen en móvil
 * @property {string} [variant='default'] - Variante: default, success, warning, danger, info
 * @property {string} [position='center'] - Posición: center, top, bottom
 * @property {string} [className=''] - Clases adicionales
 */

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnOverlay = true,
    closeOnEsc = true,
    showCloseButton = true,
    fullscreenMobile = false,
    variant = 'default',
    position = 'center',
    className = '',
}) {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            document.body.style.overflow = 'hidden';

            // Focus en el modal
            modalRef.current?.focus();
        } else {
            document.body.style.overflow = 'unset';

            // Restaurar focus
            previousActiveElement.current?.focus();
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEsc, onClose]);

    // Trap de foco
    useEffect(() => {
        if (!isOpen) return;

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    if (!isOpen) return null;

    // Tamaños responsive
    const sizes = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
        full: 'sm:max-w-full sm:m-4',
    };

    // Variantes con iconos y colores
    const variants = {
        default: {
            icon: null,
            headerBg: '',
            iconColor: '',
        },
        success: {
            icon: CheckCircle,
            headerBg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
        },
        warning: {
            icon: AlertTriangle,
            headerBg: 'bg-yellow-50 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
        },
        danger: {
            icon: AlertCircle,
            headerBg: 'bg-red-50 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400',
        },
        info: {
            icon: Info,
            headerBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
    };

    // Posiciones
    const positions = {
        center: 'items-center',
        top: 'items-start pt-20',
        bottom: 'items-end pb-20',
    };

    const currentVariant = variants[variant];
    const VariantIcon = currentVariant.icon;

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose();
        }
    };

    return (
        <div
            className={`
                fixed inset-0 z-[1050] 
                flex ${positions[position]}
                justify-center 
                p-0 ${fullscreenMobile ? '' : 'sm:p-4'}
            `}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`
                    relative
                    bg-white dark:bg-gray-900
                    ${fullscreenMobile ? 'w-full h-full sm:h-auto sm:w-auto' : 'w-full'} 
                    ${sizes[size]}
                    ${fullscreenMobile ? 'sm:rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl'}
                    shadow-2xl
                    ${fullscreenMobile ? 'max-h-full sm:max-h-[85vh]' : 'max-h-[90vh] sm:max-h-[85vh]'}
                    flex flex-col
                    animate-in 
                    ${fullscreenMobile
                        ? 'slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95'
                        : 'slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95'
                    }
                    duration-300
                    ${className}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`
                    flex items-start gap-3 sm:gap-4
                    p-4 sm:p-6 
                    border-b border-gray-200 dark:border-gray-800
                    ${currentVariant.headerBg}
                `}>
                    {/* Icono de variante */}
                    {VariantIcon && (
                        <div className={`flex-shrink-0 ${currentVariant.iconColor}`}>
                            <VariantIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                    )}

                    {/* Título y descripción */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                id="modal-description"
                                className="mt-1 text-sm sm:text-base text-muted-foreground"
                            >
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Botón cerrar */}
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="
                                flex-shrink-0
                                p-2 rounded-lg
                                text-muted-foreground hover:text-foreground
                                hover:bg-gray-100 dark:hover:bg-gray-800
                                transition-all duration-200
                                touch-target
                            "
                            aria-label="Cerrar modal"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="
                        p-4 sm:p-6 
                        border-t border-gray-200 dark:border-gray-800 
                        bg-gray-50 dark:bg-gray-800/50
                        flex flex-col-reverse sm:flex-row
                        gap-3 sm:gap-4
                        sm:justify-end
                    ">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * ConfirmModal - Modal de confirmación predefinido
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'warning',
    loading = false,
}) {
    const handleConfirm = async () => {
        await onConfirm?.();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            variant={variant}
            size="sm"
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'destructive' : 'primary'}
                        onClick={handleConfirm}
                        loading={loading}
                        fullWidth
                        className="sm:w-auto"
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        />
    );
}
