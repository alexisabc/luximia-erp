//components/ui/modals/Form.jsx
'use client';

import Modal from '.';

// El FormModal ahora es capaz de renderizar grupos de checkboxes
export default function FormModal({
    isOpen,
    onClose,
    title,
    formData,
    onFormChange,
    onSubmit,
    fields,
    handleMultiSelectChange, // Maneja selecciones múltiples
    handleSelectAll, // Opcional: manejar selección global
    handleGroupSelect, // Opcional: selección por grupo
    submitText = "Guardar Cambios",
}) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={onSubmit} className="space-y-4">
                {fields.map(field => (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                        </label>
                        {
                            field.type === 'checkbox-group' ? (
                                <div className="mt-2 space-y-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                                    {field.withSelectAll && (
                                        <label className="flex items-center space-x-2 cursor-pointer font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.name]?.length === field.options.length && field.options.length > 0}
                                                onChange={(e) => handleSelectAll && handleSelectAll(field.name, e.target.checked, field.options)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Seleccionar Todos</span>
                                        </label>
                                    )}
                                    {field.options.map(option => (
                                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.name]?.includes(option.value) || false}
                                                onChange={() => handleMultiSelectChange(field.name, option.value)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : field.type === 'grouped-checkbox' ? (
                                <div className="mt-2 space-y-2 p-2 border rounded-md max-h-60 overflow-y-auto">
                                    {field.withSelectAll && (
                                        <label className="flex items-center space-x-2 cursor-pointer font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.name]?.length === field.groups.reduce((a, g) => a + g.options.length, 0) && field.groups.length > 0}
                                                onChange={(e) => handleSelectAll && handleSelectAll(field.name, e.target.checked, field.groups.flatMap(g => g.options))}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Seleccionar Todos</span>
                                        </label>
                                    )}
                                    {field.groups.map(group => (
                                        <div key={group.label} className="mt-2">
                                            <label className="flex items-center space-x-2 cursor-pointer font-semibold">
                                                <input
                                                    type="checkbox"
                                                    checked={group.options.every(o => formData[field.name]?.includes(o.value))}
                                                    onChange={(e) => handleGroupSelect && handleGroupSelect(field.name, e.target.checked, group.options)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{group.label}</span>
                                            </label>
                                            <div className="ml-4 mt-1 space-y-1">
                                                {group.options.map(option => (
                                                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData[field.name]?.includes(option.value) || false}
                                                            onChange={() => handleMultiSelectChange(field.name, option.value)}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center mt-2">
                                    <input type="checkbox" name={field.name} checked={!!formData[field.name]} onChange={onFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{field.checkboxLabel}</span>
                                </div>
                            ) : field.type === 'select' ? (
                                <select name={field.name} value={formData[field.name]} onChange={onFormChange} required={field.required} className="mt-1 ...">
                                    {field.options.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={onFormChange}
                                    required={field.required}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            )
                        }
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