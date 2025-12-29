/**
 * Label Atom - Etiqueta de formulario
 * Mobile First con tamaños responsive
 */
'use client';

import React from 'react';

const Label = React.forwardRef(({
    children,
    htmlFor,
    required = false,
    className = '',
    ...props
}, ref) => {
    return (
        <label
            ref={ref}
            htmlFor={htmlFor}
            className={`
        text-sm sm:text-base font-medium
        text-foreground
        cursor-pointer
        ${className}
      `}
            {...props}
        >
            {children}
            {required && (
                <span className="text-destructive ml-1" aria-label="requerido">
                    *
                </span>
            )}
        </label>
    );
});

Label.displayName = 'Label';

export default Label;
