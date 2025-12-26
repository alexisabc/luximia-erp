'use client';

import Modal from '@/components/modals';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

/**
 * ConfirmationModal
 * 
 * Modal premium para confirmaciones críticas o informativas.
 * Tipos soportados: danger, success, warning, info.
 */
export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Acción",
    message = "¿Estás seguro de que deseas realizar esta acción?",
    confirmText = "Confirmar",
    type = "danger" // danger, success, warning, info
}) {
    if (!isOpen) return null;

    // Configuración estética según el tipo
    const typeConfig = {
        danger: {
            icon: <XCircle className="w-6 h-6" />,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-100 dark:bg-red-900/30',
            btn: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25',
            title: 'Confirmación Crítica'
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6" />,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            btn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
            title: 'Advertencia'
        },
        success: {
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            btn: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25',
            title: 'Confirmar Éxito'
        },
        info: {
            icon: <Info className="w-6 h-6" />,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25',
            title: 'Información'
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
            title={
                <div className="flex items-center gap-3">
                    <div className={`p-2 ${config.bg} rounded-lg ${config.color}`}>
                        {config.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold">{title}</span>
                        <span className="text-xs text-gray-400 font-normal">{config.title}</span>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="py-2">
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`
                            px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5
                            ${config.btn}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
