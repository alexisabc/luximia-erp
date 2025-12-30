/**
 * SearchBar Molecule - Barra de búsqueda
 * 
 * Combina Input + Icon (átomos)
 * Mobile First con diseño responsive mejorado
 */
'use client';

import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import Input from '@/components/atoms/Input';

/**
 * @typedef {Object} SearchBarProps
 * @property {string} [value=''] - Valor del input
 * @property {Function} [onChange] - Callback al cambiar valor
 * @property {Function} [onSubmit] - Callback al enviar búsqueda
 * @property {Function} [onClear] - Callback al limpiar
 * @property {string} [placeholder='Buscar...'] - Placeholder
 * @property {boolean} [fullWidth=true] - Ancho completo
 * @property {string} [size='md'] - Tamaño: sm, md, lg
 * @property {boolean} [loading=false] - Estado de carga
 * @property {boolean} [autoFocus=false] - Auto focus
 * @property {string} [className=''] - Clases adicionales
 */

export default function SearchBar({
    value = '',
    onChange,
    onSubmit,
    onClear,
    placeholder = 'Buscar...',
    fullWidth = true,
    size = 'md',
    loading = false,
    autoFocus = false,
    className = '',
    ...props
}) {
    const [internalValue, setInternalValue] = React.useState(value);

    React.useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(e);
    };

    const handleClear = () => {
        setInternalValue('');
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: '' } });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(internalValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit(internalValue);
        }
    };

    // Tamaños Mobile First
    const sizes = {
        sm: 'h-9 text-sm',
        md: 'h-10 sm:h-11 text-sm sm:text-base',
        lg: 'h-11 sm:h-12 text-base sm:text-lg',
    };

    const iconSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}
        >
            {/* Icono de búsqueda o loading */}
            <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {loading ? (
                    <Loader2
                        className={`${iconSizes[size]} text-muted-foreground animate-spin`}
                        aria-hidden="true"
                    />
                ) : (
                    <Search
                        className={`${iconSizes[size]} text-muted-foreground`}
                        aria-hidden="true"
                    />
                )}
            </div>

            {/* Input */}
            <Input
                type="search"
                value={internalValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                fullWidth={fullWidth}
                autoFocus={autoFocus}
                disabled={loading}
                className={`
                    pl-9 sm:pl-10 pr-9 sm:pr-10
                    ${sizes[size]}
                `}
                aria-label={placeholder}
                {...props}
            />

            {/* Botón para limpiar - solo visible cuando hay texto */}
            {internalValue && !loading && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="
                        absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2
                        p-1 rounded-md
                        text-muted-foreground hover:text-foreground
                        hover:bg-muted
                        transition-all duration-200
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        touch-target
                    "
                    aria-label="Limpiar búsqueda"
                >
                    <X className={iconSizes[size]} />
                </button>
            )}
        </form>
    );
}
