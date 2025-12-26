'use client';

import React, { useState } from 'react';
import { X, Mail, User, Shield, Check, Monitor, Smartphone, LogOut, Calendar } from 'lucide-react';

export default function UserModal({
    isOpen,
    onClose,
    title,
    formData,
    onFormChange,
    onSubmit,
    groups = [], // [{ id, name }]
    submitText = 'Guardar',
}) {
    if (!isOpen) return null;

    const [touched, setTouched] = useState({});

    // Simple email validation regex
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleGroupToggle = (groupId) => {
        const currentGroups = formData.groups || [];
        const newGroups = currentGroups.includes(groupId)
            ? currentGroups.filter(id => id !== groupId)
            : [...currentGroups, groupId];

        // Simular evento change para mantener compatibilidad con el parent
        onFormChange({ target: { name: 'groups', value: newGroups } });
    };

    const isEmailInvalid = touched.email && !isValidEmail(formData.email);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Complete la información para invitar al usuario.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    {/* Sección: Información Personal */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Información Personal</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    onChange={onFormChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Juan"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    onChange={onFormChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Pérez"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Cuenta */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Cuenta de Acceso</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Correo Electrónico (Usuario) *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                onChange={onFormChange}
                                onBlur={() => handleBlur('email')}
                                required
                                className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg focus:ring-2 outline-none transition-all ${isEmailInvalid
                                    ? 'border-red-300 focus:ring-red-200'
                                    : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'
                                    }`}
                                placeholder="usuario@empresa.com"
                            />
                            {isEmailInvalid ? (
                                <p className="text-xs text-red-500">Por favor ingrese un correo válido.</p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Se enviará una invitación a este correo para configurar la contraseña.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sección: Roles */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Asignación de Roles</h3>
                        </div>

                        {groups.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay roles disponibles.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {groups.map(group => {
                                    const isSelected = (formData.groups || []).includes(group.id);
                                    return (
                                        <div
                                            key={group.id}
                                            onClick={() => handleGroupToggle(group.id)}
                                            className={`
                                                relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 shadow-sm'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'}
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {group.name}
                                                    </span>
                                                </div>
                                                <div className={`
                                                    w-5 h-5 rounded flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-transparent'}
                                                `}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Seleccione uno o más roles para definir los permisos de este usuario.
                        </p>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isEmailInvalid || !formData.email}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitText}
                    </button>
                </div>
            </div>
        </div>
    );
}
