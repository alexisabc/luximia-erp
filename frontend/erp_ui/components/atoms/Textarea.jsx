/**
 * Textarea Atom - Área de texto
 * Mobile First con tamaños touch-friendly
 */
'use client';

import React from 'react';

const Textarea = React.forwardRef(({
    error = false,
    fullWidth = false,
    rows = 4,
    className = '',
    ...props
}, ref) => {
    const baseStyles = `
    rounded-lg border
    bg-background text-foreground
    px-4 py-3
    text-sm sm:text-base
    transition-all duration-200
    placeholder:text-muted-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    resize-y
    ${fullWidth ? 'w-full' : ''}
  `;

    const errorStyles = error
        ? 'border-destructive focus-visible:ring-destructive'
        : 'border-input';

    return (
        <textarea
            ref={ref}
            rows={rows}
            className={`
        ${baseStyles}
        ${errorStyles}
        ${className}
      `}
            {...props}
        />
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
