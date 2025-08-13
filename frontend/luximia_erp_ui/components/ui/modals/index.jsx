//components/ui/modals/Index.jsx
'use client';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        // Fondo oscuro semitransparente
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            {/* Contenedor del modal */}
            {/* ### CAMBIO: de max-w-md a max-w-4xl y añadido dark:bg-gray-800 ### */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl">
                {/* Encabezado del modal */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
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