import React from 'react';

/**
 * Text Atom
 * Para párrafos y textos auxiliares.
 */
const Text = ({
    size = 'base',
    variant = 'default',
    children,
    className = '',
    as = 'p'
}) => {

    const Component = as;

    // Tamaños Mobile First
    const sizes = {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg sm:text-xl",
        xl: "text-xl sm:text-2xl"
    };

    const variants = {
        default: "text-gray-700 dark:text-gray-300",
        muted: "text-gray-500 dark:text-gray-400",
        white: "text-white",
        danger: "text-red-600 dark:text-red-400",
        success: "text-green-600 dark:text-green-400",
        warning: "text-amber-600 dark:text-amber-400"
    };

    return (
        <Component className={`
            leading-relaxed
            ${sizes[size] || sizes.base}
            ${variants[variant] || variants.default}
            ${className}
        `}>
            {children}
        </Component>
    );
};

export default Text;
