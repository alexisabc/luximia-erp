// components/Modal.js
'use client';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        // Fondo oscuro semitransparente
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            {/* Contenedor del modal */}
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                {/* Encabezado del modal */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-2xl"
                    >
                        &times; {/* Este es el caracter de una 'X' para cerrar */}
                    </button>
                </div>
                {/* Contenido del modal (aquí irá nuestro formulario) */}
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}