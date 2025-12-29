/**
 * Button Atom - Componente base de botón
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 */
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    ...props
}, ref) => {

    // Variantes de estilo
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20',
        ghost: 'text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20',
        destructive: 'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80',
    };

    // Tamaños - Mobile First (touch-friendly)
    const sizes = {
        sm: 'h-10 px-4 text-sm gap-2',      // 40px height (mobile-friendly)
        md: 'h-11 px-6 text-base gap-2',    // 44px height (recommended touch target)
        lg: 'h-12 px-8 text-lg gap-3',      // 48px height (comfortable touch)
        xl: 'h-14 px-10 text-xl gap-3',     // 56px height (large touch)
    };

    const baseStyles = `
    inline-flex items-center justify-center
    rounded-lg font-medium
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    active:scale-95
    ${fullWidth ? 'w-full' : ''}
  `;

    const isDisabled = disabled || loading;

    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {loading && (
                <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {!loading && Icon && iconPosition === 'left' && (
                <Icon className="h-4 w-4" />
            )}
            {children}
            {!loading && Icon && iconPosition === 'right' && (
                <Icon className="h-4 w-4" />
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
