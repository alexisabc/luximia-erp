/**
 * NavigationSidebar Organism - Barra lateral de navegación
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Organismo complejo para navegación principal con soporte responsive
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '@/components/atoms/Button';

/**
 * @typedef {Object} NavItem
 * @property {string} label - Etiqueta del item
 * @property {string} [href] - URL de navegación
 * @property {React.ComponentType} [icon] - Icono de Lucide React
 * @property {NavItem[]} [children] - Sub-items
 * @property {string} [badge] - Badge opcional
 */

/**
 * @typedef {Object} NavigationSidebarProps
 * @property {NavItem[]} items - Items de navegación
 * @property {boolean} [isOpen=false] - Estado abierto (móvil)
 * @property {Function} [onClose] - Callback al cerrar
 * @property {string} [className=''] - Clases adicionales
 */

const NavigationSidebar = ({
    items = [],
    isOpen = false,
    onClose,
    className = '',
}) => {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = React.useState([]);

    const toggleExpanded = (label) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const isActive = (href) => {
        if (!href) return false;
        return pathname === href || pathname.startsWith(href + '/');
    };

    const renderNavItem = (item, level = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.label);
        const active = isActive(item.href);

        return (
            <div key={item.label} className="w-full">
                {/* Nav Item */}
                <div
                    className={`
                        flex items-center justify-between
                        px-3 py-2 sm:px-4 sm:py-2.5
                        rounded-lg
                        transition-all duration-200
                        ${level > 0 ? 'ml-4 sm:ml-6' : ''}
                        ${active
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                    `}
                >
                    {/* Link or Button */}
                    {item.href ? (
                        <Link
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                        >
                            {item.icon && (
                                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm sm:text-base truncate">
                                {item.label}
                            </span>
                            {item.badge && (
                                <span className="
                                    ml-auto px-2 py-0.5
                                    text-xs font-semibold
                                    bg-red-600 text-white
                                    rounded-full
                                ">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ) : (
                        <button
                            onClick={() => hasChildren && toggleExpanded(item.label)}
                            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left"
                        >
                            {item.icon && (
                                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm sm:text-base truncate">
                                {item.label}
                            </span>
                        </button>
                    )}

                    {/* Expand Icon */}
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpanded(item.label)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {item.children.map(child => renderNavItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky
                top-0 left-0
                h-screen
                w-64 sm:w-72 lg:w-64 xl:w-72
                bg-white dark:bg-gray-900
                border-r border-gray-200 dark:border-gray-800
                z-50 lg:z-10
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${className}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                            Navegación
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={X}
                            onClick={onClose}
                            className="lg:hidden"
                            aria-label="Cerrar menú"
                        />
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-1">
                        {items.map(item => renderNavItem(item))}
                    </nav>

                    {/* Footer (Optional) */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-muted-foreground text-center">
                            ERP System v1.0
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

NavigationSidebar.displayName = 'NavigationSidebar';

export default NavigationSidebar;
