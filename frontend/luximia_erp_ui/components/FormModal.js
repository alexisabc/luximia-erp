// components/FormModal.js
'use client';

import Modal from './Modal';

export default function FormModal({
    isOpen,
    onClose,
    title,
    formData,
    onFormChange,
    onSubmit,
    fields, // Array que define los campos del formulario
    submitText = "Guardar Cambios"
}) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={onSubmit} className="space-y-4">
                {fields.map(field => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                            <textarea
                                name={field.name}
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={onFormChange}
                                required={field.required}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        ) : field.type === 'select' ? (
                            <select
                                name={field.name}
                                id={field.name}
                                value={formData[field.name]}
                                onChange={onFormChange}
                                required={field.required}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {field.options.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type || 'text'}
                                name={field.name}
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={onFormChange}
                                required={field.required}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        )}
                    </div>
                ))}
                <div className="pt-4 flex justify-end">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        {submitText}
                    </button>
                </div>
            </form>
        </Modal>
    );
}