/**
 * Input Atom - Componente base de entrada de texto
 * 
 * Mobile First con touch-friendly sizing
 */
'use client';

import React from 'react';

const Input = React.forwardRef(({
    type = 'text',
    size = 'md',
    error = false,
    fullWidth = false,
    className = '',
    ...props
}, ref) => {

    // Tamaños - Mobile First (touch-friendly)
    const sizes = {
        sm: 'h-10 px-3 text-sm',     // 40px height
        md: 'h-11 px-4 text-base',   // 44px height (recommended)
        lg: 'h-12 px-5 text-lg',     // 48px height
    };

    const baseStyles = `
    rounded-lg border
    bg-background text-foreground
    transition-all duration-200
    placeholder:text-muted-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    ${fullWidth ? 'w-full' : ''}
  `;

    const errorStyles = error
        ? 'border-destructive focus-visible:ring-destructive'
        : 'border-input';

    return (
        <input
            ref={ref}
            type={type}
            className={`
        ${baseStyles}
        ${sizes[size]}
        ${errorStyles}
        ${className}
      `}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export default Input;
