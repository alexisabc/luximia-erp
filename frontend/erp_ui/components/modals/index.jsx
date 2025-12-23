'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) {
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            // Pequeño delay para permitir que el navegador renderice antes de iniciar la transición
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            // Esperar a que termine la animación (300ms) para desmontar
            const timer = setTimeout(() => {
                setIsMounted(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Manejo de tecla ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (isOpen && e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Limpieza al desmontar el componente por completo
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!isMounted) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 transition-all duration-300 ${isVisible ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'
                }`}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`w-full ${maxWidth} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl transform transition-all duration-300 ease-out flex flex-col max-h-[90dvh] overflow-hidden ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
