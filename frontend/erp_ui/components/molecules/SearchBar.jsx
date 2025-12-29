/**
 * SearchBar Molecule - Barra de búsqueda
 * 
 * Combina Input + Icon (átomos)
 * Mobile First con diseño responsive
 */
'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import Input from '@/components/atoms/Input';

export default function SearchBar({
    value = '',
    onChange,
    onClear,
    placeholder = 'Buscar...',
    fullWidth = true,
    className = '',
    ...props
}) {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: '' } });
        }
    };

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
            {/* Icono de búsqueda */}
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
            />

            {/* Input */}
            <Input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                fullWidth={fullWidth}
                className="pl-10 pr-10"
                {...props}
            />

            {/* Botón para limpiar - solo visible cuando hay texto */}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="
            absolute right-3 top-1/2 -translate-y-1/2
            p-1 rounded-md
            text-muted-foreground hover:text-foreground
            hover:bg-muted
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          "
                    aria-label="Limpiar búsqueda"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
