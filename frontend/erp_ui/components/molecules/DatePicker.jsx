/**
 * DatePicker Molecule - Selector de fecha
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Molécula para selección de fechas con calendario
 */
'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import Input from '@/components/atoms/Input';

/**
 * @typedef {Object} DatePickerProps
 * @property {string} [value=''] - Valor de la fecha (YYYY-MM-DD)
 * @property {Function} [onChange] - Callback al cambiar fecha
 * @property {string} [label] - Etiqueta del campo
 * @property {string} [placeholder='Seleccionar fecha'] - Placeholder
 * @property {boolean} [required=false] - Campo requerido
 * @property {string} [min] - Fecha mínima
 * @property {string} [max] - Fecha máxima
 * @property {boolean} [disabled=false] - Deshabilitar campo
 * @property {string} [error] - Mensaje de error
 * @property {string} [className=''] - Clases adicionales
 */

export default function DatePicker({
    value = '',
    onChange,
    label,
    placeholder = 'Seleccionar fecha',
    required = false,
    min,
    max,
    disabled = false,
    error,
    className = '',
}) {
    const [focused, setFocused] = useState(false);

    const handleChange = (e) => {
        onChange?.(e);
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <Input
                    type="date"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                    max={max}
                    disabled={disabled}
                    error={!!error}
                    className={`
                        pr-10
                        ${focused ? 'ring-2 ring-primary' : ''}
                    `}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className={`
                        w-4 h-4 sm:w-5 sm:h-5
                        ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}
                    `} />
                </div>
            </div>

            {error && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
