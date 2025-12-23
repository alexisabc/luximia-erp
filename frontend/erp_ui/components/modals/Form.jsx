'use client';

import Modal from '@/components/modals';

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
    maxWidth = "max-w-2xl",
}) {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={maxWidth}>
            <form onSubmit={onSubmit} className="space-y-5">
                {fields.map(field => (
                    <div key={field.name} className="space-y-1.5">
                        {field.type !== 'checkbox' && (
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}

                        {
                            field.type === 'checkbox-group' ? (
                                <div className="p-3 border border-gray-200 dark:border-gray-600/50 rounded-xl bg-gray-50/50 dark:bg-gray-950/40 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                    {field.withSelectAll && (
                                        <label className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.name]?.length === field.options.length && field.options.length > 0}
                                                onChange={(e) => handleSelectAll && handleSelectAll(field.name, e.target.checked, field.options)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 bg-white dark:bg-gray-900"
                                            />
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Seleccionar Todos</span>
                                        </label>
                                    )}
                                    {field.options.map(option => (
                                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData[field.name]?.includes(option.value) || false}
                                                onChange={() => handleMultiSelectChange(field.name, option.value)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 bg-white dark:bg-gray-900"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : field.type === 'grouped-checkbox' ? (
                                <div className="space-y-3">
                                    {/* Cabecera con Contador y Select All Global */}
                                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Seleccionados: <span className="text-blue-600 dark:text-blue-400 font-bold">
                                                {formData[field.name]?.length || 0}
                                            </span> / {field.groups.reduce((acc, g) => acc + g.options.length, 0)}
                                        </div>
                                        {field.withSelectAll && (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectAll && handleSelectAll(field.name, !(formData[field.name]?.length === field.groups.reduce((a, g) => a + g.options.length, 0)), field.groups.flatMap(g => g.options))}
                                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors"
                                            >
                                                {formData[field.name]?.length === field.groups.reduce((a, g) => a + g.options.length, 0) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Grid de Grupos */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                                        {field.groups.map(group => {
                                            const groupSelectedCount = group.options.filter(o => formData[field.name]?.includes(o.value)).length;
                                            const isAllGroupSelected = groupSelectedCount === group.options.length && group.options.length > 0;

                                            return (
                                                <div key={group.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                    {/* Cabecera de Grupo */}
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllGroupSelected}
                                                                onChange={(e) => handleGroupSelect && handleGroupSelect(field.name, e.target.checked, group.options)}
                                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 bg-white dark:bg-gray-900"
                                                            />
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate max-w-[150px]" title={group.label}>{group.label}</span>
                                                        </label>
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                            {groupSelectedCount}/{group.options.length}
                                                        </span>
                                                    </div>

                                                    {/* Opciones del Grupo */}
                                                    <div className="p-3 space-y-1">
                                                        {group.options.map(option => (
                                                            <div key={option.value} className="flex items-start space-x-3 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer" onClick={() => handleMultiSelectChange(field.name, option.value)}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData[field.name]?.includes(option.value) || false}
                                                                    onChange={() => { }} // Handled by parent div for larger hit area
                                                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 bg-white dark:bg-gray-900 pointer-events-none"
                                                                />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight select-none">{option.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-600/50 bg-gray-50/50 dark:bg-gray-950/40 hover:bg-gray-100 dark:hover:bg-gray-900/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        checked={!!formData[field.name]}
                                        onChange={onFormChange}
                                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 bg-white dark:bg-gray-900"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">{field.checkboxLabel}</span>
                                </div>
                            ) : field.type === 'select' ? (
                                <div className="relative">
                                    <select
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={onFormChange}
                                        required={field.required}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 appearance-none shadow-sm"
                                    >
                                        <option value="" className="dark:bg-gray-900">Seleccione una opción</option>
                                        {field.options.map((option, idx) => {
                                            const value = typeof option === 'object' ? option.value : option;
                                            const label = typeof option === 'object' ? option.label : option;
                                            return <option key={value} value={value} className="dark:bg-gray-900">{label}</option>;
                                        })}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={onFormChange}
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    rows={field.rows || 3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 placeholder-gray-400/80 shadow-sm resize-none"
                                />
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={onFormChange}
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 placeholder-gray-400/80 shadow-sm"
                                />
                            )
                        }
                    </div>
                ))}

                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 w-full sm:w-auto"
                    >
                        {submitText}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
