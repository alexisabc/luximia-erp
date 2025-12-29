/**
 * FormField Molecule - Campo de formulario completo
 * 
 * Combina Label + Input + ErrorMessage (átomos)
 * Mobile First con diseño responsive
 */
'use client';

import React from 'react';
import Input from '@/components/atoms/Input';

export default function FormField({
    label,
    id,
    error,
    helperText,
    required = false,
    fullWidth = true,
    className = '',
    inputClassName = '',
    ...inputProps
}) {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-foreground"
                >
                    {label}
                    {required && (
                        <span className="text-destructive ml-1" aria-label="requerido">*</span>
                    )}
                </label>
            )}

            {/* Input */}
            <Input
                id={inputId}
                error={!!error}
                fullWidth={fullWidth}
                className={inputClassName}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                required={required}
                {...inputProps}
            />

            {/* Error Message */}
            {error && (
                <p
                    id={`${inputId}-error`}
                    className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {/* Helper Text */}
            {!error && helperText && (
                <p
                    id={`${inputId}-helper`}
                    className="text-sm text-muted-foreground"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}
