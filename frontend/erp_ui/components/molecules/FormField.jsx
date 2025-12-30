/**
 * FormField Molecule - Campo de formulario completo
 * 
 * Combina Label + Input/Textarea/Select + ErrorMessage (átomos)
 * Mobile First con diseño responsive mejorado
 */
'use client';

import React from 'react';
import Input from '@/components/atoms/Input';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import { AlertCircle, Info } from 'lucide-react';

/**
 * @typedef {Object} FormFieldProps
 * @property {string} [label] - Etiqueta del campo
 * @property {string} [id] - ID del input
 * @property {string} [error] - Mensaje de error
 * @property {string} [helperText] - Texto de ayuda
 * @property {string} [hint] - Pista/sugerencia
 * @property {boolean} [required=false] - Campo requerido
 * @property {boolean} [fullWidth=true] - Ancho completo
 * @property {string} [layout='vertical'] - Layout: vertical, horizontal
 * @property {React.ComponentType} [icon] - Icono opcional
 * @property {React.ReactNode} [children] - Input personalizado
 * @property {string} [type='input'] - Tipo: input, textarea, select
 * @property {string} [className=''] - Clases adicionales
 */

export default function FormField({
    label,
    id,
    error,
    helperText,
    hint,
    required = false,
    fullWidth = true,
    layout = 'vertical',
    icon: Icon,
    children,
    type = 'input',
    className = '',
    inputClassName = '',
    ...inputProps
}) {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    // Renderizar el input apropiado
    const renderInput = () => {
        if (children) return children;

        const commonProps = {
            id: inputId,
            error: !!error,
            fullWidth: fullWidth,
            className: inputClassName,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined,
            required: required,
            ...inputProps
        };

        switch (type) {
            case 'textarea':
                return <Textarea {...commonProps} />;
            case 'select':
                return <Select {...commonProps} />;
            default:
                return <Input {...commonProps} type={inputProps.inputType || inputProps.type || 'text'} />;
        }
    };

    const isHorizontal = layout === 'horizontal';

    return (
        <div className={`
            flex ${isHorizontal ? 'flex-col sm:flex-row sm:items-start' : 'flex-col'}
            gap-1.5 ${isHorizontal ? 'sm:gap-4' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
        `}>
            {/* Label Section */}
            {label && (
                <div className={`
                    flex items-start gap-2
                    ${isHorizontal ? 'sm:w-1/3 sm:pt-2' : ''}
                `}>
                    {Icon && (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <label
                            htmlFor={inputId}
                            className="text-sm sm:text-base font-medium text-foreground block"
                        >
                            {label}
                            {required && (
                                <span className="text-destructive ml-1" aria-label="requerido">*</span>
                            )}
                        </label>
                        {hint && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-start gap-1">
                                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{hint}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Input Section */}
            <div className={`
                flex-1
                ${isHorizontal ? 'sm:w-2/3' : ''}
            `}>
                {renderInput()}

                {/* Error Message */}
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="
                            mt-1.5 text-xs sm:text-sm text-destructive
                            flex items-start gap-1
                            animate-in fade-in slide-in-from-top-1 duration-200
                        "
                        role="alert"
                    >
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </p>
                )}

                {/* Helper Text */}
                {!error && helperText && (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-1.5 text-xs sm:text-sm text-muted-foreground"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        </div>
    );
}
