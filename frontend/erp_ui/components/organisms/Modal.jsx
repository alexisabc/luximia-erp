/**
 * Modal Organism - Modal responsive
 * Mobile First: slide from bottom en móvil, centered en desktop
 */
'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button';

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnOverlay = true,
    showCloseButton = true,
    className = '',
}) {
    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
        full: 'sm:max-w-full sm:m-4',
    };

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[1050] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleOverlayClick}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                className={`
          relative
          bg-white dark:bg-gray-900
          w-full ${sizes[size]}
          rounded-t-2xl sm:rounded-2xl
          shadow-2xl
          max-h-[90vh] sm:max-h-[85vh]
          flex flex-col
          animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300
          ${className}
        `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex-1 pr-4">
                        {title && (
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="
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
                    <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
