/**
 * DetailPageTemplate - Plantilla para páginas de detalle
 * 
 * Siguiendo principios de Atomic Design y Mobile First
 * Template optimizado para vistas de detalle con tabs y acciones
 */
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/atoms/Button';
import Divider from '@/components/atoms/Divider';
import { ArrowLeft, Edit, Trash2, MoreVertical } from 'lucide-react';

/**
 * @typedef {Object} DetailPageTemplateProps
 * @property {string} title - Título principal
 * @property {string} [subtitle] - Subtítulo o descripción
 * @property {React.ReactNode} [breadcrumbs] - Breadcrumbs de navegación
 * @property {React.ReactNode} children - Contenido principal
 * @property {React.ReactNode} [aside] - Contenido lateral (acciones, info)
 * @property {Array} [tabs] - Tabs para contenido relacionado
 * @property {number} [activeTab=0] - Tab activo
 * @property {Function} [onTabChange] - Callback al cambiar tab
 * @property {Function} [onBack] - Callback para volver
 * @property {Function} [onEdit] - Callback para editar
 * @property {Function} [onDelete] - Callback para eliminar
 * @property {Array} [actions] - Acciones adicionales
 * @property {boolean} [loading=false] - Estado de carga
 * @property {string} [className=''] - Clases adicionales
 */

const DetailPageTemplate = ({
    title,
    subtitle,
    breadcrumbs,
    children,
    aside,
    tabs = [],
    activeTab = 0,
    onTabChange,
    onBack,
    onEdit,
    onDelete,
    actions = [],
    loading = false,
    className = '',
}) => {
    const [currentTab, setCurrentTab] = React.useState(activeTab);
    const [showMobileActions, setShowMobileActions] = React.useState(false);

    const handleTabChange = (index) => {
        setCurrentTab(index);
        onTabChange?.(index);
    };

    return (
        <div className={`container-responsive spacing-responsive ${className}`}>
            {/* Breadcrumbs & Back Button */}
            <div className="mb-4 sm:mb-6">
                {breadcrumbs || (
                    onBack && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={ArrowLeft}
                            onClick={onBack}
                        >
                            Volver
                        </Button>
                    )
                )}
            </div>

            {/* Header Section */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <>
                                <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                                {subtitle && (
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2 animate-pulse" />
                                )}
                            </>
                        ) : (
                            <>
                                <h1 className="heading-responsive break-words">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                                        {subtitle}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Actions - Desktop */}
                    <div className="hidden sm:flex items-center gap-2 flex-wrap">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="md"
                                icon={Edit}
                                onClick={onEdit}
                                disabled={loading}
                            >
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="destructive"
                                size="md"
                                icon={Trash2}
                                onClick={onDelete}
                                disabled={loading}
                            >
                                Eliminar
                            </Button>
                        )}
                        {actions}
                    </div>

                    {/* Actions - Mobile (Dropdown) */}
                    <div className="sm:hidden relative">
                        <Button
                            variant="outline"
                            size="md"
                            icon={MoreVertical}
                            onClick={() => setShowMobileActions(!showMobileActions)}
                            disabled={loading}
                            aria-label="Más acciones"
                        />
                        {showMobileActions && (
                            <div className="
                                absolute right-0 top-full mt-2 z-10
                                bg-white dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700
                                rounded-lg shadow-lg
                                min-w-[200px]
                                animate-in fade-in slide-in-from-top-2 duration-200
                            ">
                                <div className="p-2 space-y-1">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                onEdit();
                                                setShowMobileActions(false);
                                            }}
                                            className="
                                                w-full text-left px-3 py-2 rounded-md
                                                hover:bg-gray-100 dark:hover:bg-gray-700
                                                flex items-center gap-2
                                                text-sm
                                            "
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                onDelete();
                                                setShowMobileActions(false);
                                            }}
                                            className="
                                                w-full text-left px-3 py-2 rounded-md
                                                hover:bg-red-50 dark:hover:bg-red-900/20
                                                flex items-center gap-2
                                                text-sm text-red-600
                                            "
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {tabs.length > 0 && (
                    <div className="mt-6">
                        <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                            <nav className="flex gap-2 sm:gap-4 min-w-max sm:min-w-0" aria-label="Tabs">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleTabChange(index)}
                                        className={`
                                            px-3 sm:px-4 py-2 sm:py-3
                                            text-sm sm:text-base font-medium
                                            border-b-2 transition-colors
                                            whitespace-nowrap
                                            ${currentTab === index
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                            }
                                        `}
                                        aria-current={currentTab === index ? 'page' : undefined}
                                    >
                                        {tab.label}
                                        {tab.badge && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Main Content */}
                <div className={aside ? 'lg:col-span-8' : 'lg:col-span-12'}>
                    {tabs.length > 0 ? (
                        <div className="space-y-6">
                            {tabs[currentTab]?.content || children}
                        </div>
                    ) : (
                        children
                    )}
                </div>

                {/* Sidebar */}
                {aside && (
                    <aside className="lg:col-span-4">
                        <div className="sticky top-20 space-y-6">
                            {aside}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

DetailPageTemplate.displayName = 'DetailPageTemplate';

export default DetailPageTemplate;
