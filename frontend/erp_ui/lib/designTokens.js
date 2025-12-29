/**
 * Design Tokens - Sistema de Diseño
 * 
 * Tokens centralizados para mantener consistencia en todo el proyecto.
 * Estos valores deben ser usados en lugar de valores hardcodeados.
 */

export const designTokens = {
    // Breakpoints - Mobile First
    breakpoints: {
        mobile: '0px',      // 0-639px (por defecto)
        tablet: '640px',    // sm: 640px-1023px
        desktop: '1024px',  // lg: 1024px-1279px
        wide: '1280px',     // xl: 1280px+
        ultrawide: '1536px' // 2xl: 1536px+
    },

    // Spacing - Sistema de 4px
    spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem',   // 64px
        '4xl': '6rem',   // 96px
    },

    // Typography
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem',// 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
    },

    fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },

    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2',
    },

    // Border Radius
    borderRadius: {
        none: '0',
        sm: '0.25rem',   // 4px
        md: '0.5rem',    // 8px
        lg: '0.75rem',   // 12px
        xl: '1rem',      // 16px
        '2xl': '1.5rem', // 24px
        full: '9999px',
    },

    // Shadows
    boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    },

    // Z-Index
    zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        modalBackdrop: '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
    },

    // Transitions
    transition: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Touch Targets (Mobile First)
    touchTarget: {
        min: '44px', // Mínimo recomendado para touch
        comfortable: '48px',
        large: '56px',
    },

    // Container Widths
    container: {
        mobile: '100%',
        tablet: '640px',
        desktop: '1024px',
        wide: '1280px',
    },
};

// Helper para media queries
export const mediaQueries = {
    mobile: `@media (min-width: ${designTokens.breakpoints.mobile})`,
    tablet: `@media (min-width: ${designTokens.breakpoints.tablet})`,
    desktop: `@media (min-width: ${designTokens.breakpoints.desktop})`,
    wide: `@media (min-width: ${designTokens.breakpoints.wide})`,
    ultrawide: `@media (min-width: ${designTokens.breakpoints.ultrawide})`,
};

// Helper para clases de Tailwind responsive
export const responsiveClasses = {
    // Ejemplo de uso: responsiveClasses.padding.mobile
    padding: {
        mobile: 'p-4',
        tablet: 'sm:p-6',
        desktop: 'lg:p-8',
    },
    margin: {
        mobile: 'm-4',
        tablet: 'sm:m-6',
        desktop: 'lg:m-8',
    },
    text: {
        mobile: 'text-sm',
        tablet: 'sm:text-base',
        desktop: 'lg:text-lg',
    },
    grid: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-2',
        desktop: 'lg:grid-cols-3',
        wide: 'xl:grid-cols-4',
    },
};

export default designTokens;
