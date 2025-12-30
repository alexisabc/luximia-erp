import React from 'react';

/**
 * Heading Atom
 * Estandariza la jerarquía tipográfica con enfoque Mobile First.
 * Evita clases hardcoded arbitrarias en las páginas.
 */
const Heading = ({
    level = 1,
    children,
    className = '',
    align = 'left'
}) => {

    // Mapeo de niveles a etiquetas HTML
    const Component = `h${Math.min(level, 6)}`;

    // Estilos base Mobile First -> Desktop
    const styles = {
        1: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight",
        2: "text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight",
        3: "text-lg sm:text-xl lg:text-2xl font-semibold",
        4: "text-base sm:text-lg font-semibold",
        5: "text-sm sm:text-base font-bold",
        6: "text-xs sm:text-sm font-bold uppercase tracking-wide"
    };

    const aligns = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
    };

    return (
        <Component className={`
            font-heading text-gray-900 dark:text-gray-100 
            ${styles[level] || styles[1]} 
            ${aligns[align]}
            ${className}
        `}>
            {children}
        </Component>
    );
};

export default Heading;
