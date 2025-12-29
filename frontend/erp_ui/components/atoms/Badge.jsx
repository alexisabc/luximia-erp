/**
 * Badge Atom - Insignia de estado
 * Mobile First con variantes de color
 */
'use client';

import React from 'react';

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
}) {
    const variants = {
        default: 'bg-secondary text-secondary-foreground',
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        danger: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        outline: 'border-2 border-primary text-primary bg-transparent',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    return (
        <span
            className={`
        inline-flex items-center justify-center
        rounded-full font-medium
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {children}
        </span>
    );
}
