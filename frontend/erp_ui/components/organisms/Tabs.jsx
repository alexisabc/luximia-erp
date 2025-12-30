/**
 * Tabs Organism - Pestañas/tabs
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Organismo para navegación por pestañas con contenido
 */
'use client';

import React, { useState } from 'react';

/**
 * @typedef {Object} TabItem
 * @property {string} label - Etiqueta de la pestaña
 * @property {React.ReactNode} content - Contenido de la pestaña
 * @property {React.ComponentType} [icon] - Icono opcional
 * @property {string|number} [badge] - Badge opcional
 * @property {boolean} [disabled] - Deshabilitar pestaña
 */

/**
 * @typedef {Object} TabsProps
 * @property {TabItem[]} tabs - Array de pestañas
 * @property {number} [defaultTab=0] - Pestaña activa por defecto
 * @property {Function} [onChange] - Callback al cambiar de pestaña
 * @property {string} [variant='line'] - Variante: line, pills, enclosed
 * @property {boolean} [fullWidth=false] - Pestañas de ancho completo
 * @property {string} [className=''] - Clases adicionales
 */

export default function Tabs({
    tabs = [],
    defaultTab = 0,
    onChange,
    variant = 'line',
    fullWidth = false,
    className = '',
}) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabChange = (index) => {
        if (tabs[index]?.disabled) return;
        setActiveTab(index);
        onChange?.(index);
    };

    const variants = {
        line: {
            container: 'border-b border-gray-200 dark:border-gray-800',
            tab: `
                px-4 py-3 sm:px-6 sm:py-4
                text-sm sm:text-base font-medium
                border-b-2 transition-all duration-200
                whitespace-nowrap
            `,
            active: 'border-primary text-primary',
            inactive: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700',
            disabled: 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed',
        },
        pills: {
            container: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
            tab: `
                px-4 py-2 sm:px-6 sm:py-3
                text-sm sm:text-base font-medium
                rounded-md transition-all duration-200
                whitespace-nowrap
            `,
            active: 'bg-white dark:bg-gray-700 text-primary shadow-sm',
            inactive: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            disabled: 'text-gray-400 dark:text-gray-600 cursor-not-allowed',
        },
        enclosed: {
            container: 'border-b border-gray-200 dark:border-gray-800',
            tab: `
                px-4 py-3 sm:px-6 sm:py-4
                text-sm sm:text-base font-medium
                border border-transparent
                rounded-t-lg transition-all duration-200
                whitespace-nowrap
            `,
            active: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-b-white dark:border-b-gray-900 text-primary',
            inactive: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50',
            disabled: 'text-gray-400 dark:text-gray-600 cursor-not-allowed',
        },
    };

    const currentVariant = variants[variant];

    return (
        <div className={className}>
            {/* Tab Headers */}
            <div className={`
                ${currentVariant.container}
                overflow-x-auto
                custom-scrollbar
            `}>
                <div className={`
                    flex
                    ${fullWidth ? 'w-full' : 'w-max sm:w-full'}
                    gap-1 sm:gap-2
                `}>
                    {tabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === index;
                        const isDisabled = tab.disabled;

                        return (
                            <button
                                key={index}
                                onClick={() => handleTabChange(index)}
                                disabled={isDisabled}
                                className={`
                                    ${currentVariant.tab}
                                    ${isActive ? currentVariant.active : ''}
                                    ${!isActive && !isDisabled ? currentVariant.inactive : ''}
                                    ${isDisabled ? currentVariant.disabled : ''}
                                    ${fullWidth ? 'flex-1' : ''}
                                    flex items-center justify-center gap-2
                                    touch-target
                                `}
                                role="tab"
                                aria-selected={isActive}
                                aria-disabled={isDisabled}
                            >
                                {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span className={`
                                        ml-1 px-2 py-0.5
                                        text-xs font-semibold
                                        rounded-full
                                        ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }
                                    `}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4 sm:mt-6">
                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        role="tabpanel"
                        hidden={activeTab !== index}
                        className={`
                            ${activeTab === index ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}
                        `}
                    >
                        {activeTab === index && tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
