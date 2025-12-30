/**
 * Tooltip Atom - Tooltip accesible
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Átomo para mostrar información adicional al hover/focus
 */
'use client';

import React, { useState } from 'react';

/**
 * @typedef {Object} TooltipProps
 * @property {React.ReactNode} children - Elemento que activa el tooltip
 * @property {string} content - Contenido del tooltip
 * @property {string} [position='top'] - Posición: top, bottom, left, right
 * @property {boolean} [disabled=false] - Deshabilitar tooltip
 * @property {number} [delay=200] - Delay en ms antes de mostrar
 * @property {string} [className=''] - Clases adicionales
 */

export default function Tooltip({
    children,
    content,
    position = 'top',
    disabled = false,
    delay = 200,
    className = '',
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);

    const handleMouseEnter = () => {
        if (disabled) return;

        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        setIsVisible(false);
    };

    const handleFocus = () => {
        if (disabled) return;
        setIsVisible(true);
    };

    const handleBlur = () => {
        setIsVisible(false);
    };

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrows = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
    };

    if (disabled || !content) {
        return <>{children}</>;
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
                tabIndex={0}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    role="tooltip"
                    className={`
                        absolute z-50
                        ${positions[position]}
                        px-3 py-2
                        bg-gray-900 dark:bg-gray-700
                        text-white text-xs sm:text-sm
                        rounded-lg
                        shadow-lg
                        whitespace-nowrap
                        max-w-xs sm:max-w-sm
                        animate-in fade-in zoom-in-95 duration-200
                        pointer-events-none
                    `}
                >
                    {content}

                    {/* Arrow */}
                    <div
                        className={`
                            absolute
                            ${arrows[position]}
                            border-4 border-transparent
                        `}
                    />
                </div>
            )}
        </div>
    );
}
