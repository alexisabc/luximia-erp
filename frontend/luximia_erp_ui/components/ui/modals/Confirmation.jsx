//components/ui/modals/Confirmation.jsx
'use client';

import Modal from '@/components/ui/modals';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Acción",
    message = "¿Estás seguro de que deseas realizar esta acción?",
    confirmText = "Confirmar" // Añade un texto para el botón
}) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div>
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
                <div className="pt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}