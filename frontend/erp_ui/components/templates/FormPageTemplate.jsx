/**
 * FormTemplate - Plantilla para páginas de formularios
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Template optimizado para formularios con validación y estados
 */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/atoms/Button';
import { ArrowLeft, Save, X } from 'lucide-react';

/**
 * @typedef {Object} FormTemplateProps
 * @property {string} title - Título del formulario
 * @property {string} [description] - Descripción opcional
 * @property {React.ReactNode} children - Campos del formulario
 * @property {Function} [onSubmit] - Callback al enviar
 * @property {Function} [onCancel] - Callback al cancelar
 * @property {Function} [onBack] - Callback para volver
 * @property {boolean} [loading=false] - Estado de carga
 * @property {boolean} [disabled=false] - Estado deshabilitado
 * @property {string} [submitLabel='Guardar'] - Texto del botón de envío
 * @property {string} [cancelLabel='Cancelar'] - Texto del botón de cancelar
 * @property {React.ReactNode} [aside] - Contenido lateral (ayuda, info)
 * @property {string} [className=''] - Clases adicionales
 */

const FormTemplate = ({
    title,
    description,
    children,
    onSubmit,
    onCancel,
    onBack,
    loading = false,
    disabled = false,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    aside,
    className = '',
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    return (
        <div className={`container-responsive spacing-responsive ${className}`}>
            {/* Back Button */}
            {onBack && (
                <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowLeft}
                    onClick={onBack}
                    className="mb-4"
                >
                    Volver
                </Button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Main Form */}
                <div className={aside ? 'lg:col-span-8' : 'lg:col-span-12'}>
                    <Card>
                        <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                            <div className="space-y-2">
                                <h1 className="heading-responsive">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm sm:text-base text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6 lg:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Form Fields */}
                                <div className="space-y-4 sm:space-y-6">
                                    {children}
                                </div>

                                {/* Form Actions - Mobile First */}
                                <div className="
                                    flex flex-col-reverse sm:flex-row
                                    gap-3 sm:gap-4
                                    pt-6
                                    border-t border-gray-200 dark:border-gray-800
                                ">
                                    {onCancel && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onCancel}
                                            disabled={loading || disabled}
                                            fullWidth
                                            className="sm:w-auto"
                                            icon={X}
                                        >
                                            {cancelLabel}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={loading}
                                        disabled={disabled}
                                        fullWidth
                                        className="sm:w-auto sm:ml-auto"
                                        icon={Save}
                                    >
                                        {submitLabel}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Aside - Info/Help */}
                {aside && (
                    <aside className="lg:col-span-4">
                        <div className="sticky top-20">
                            {aside}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

FormTemplate.displayName = 'FormTemplate';

export default FormTemplate;
