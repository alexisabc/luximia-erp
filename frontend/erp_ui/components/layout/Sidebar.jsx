'use client';

import Link from 'next/link';
import { APP_NAME, getMonogram } from '@/lib/branding';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { useSidebar } from '@/context/SidebarContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import EmpresaSelector from '@/components/layout/EmpresaSelector';
import { MENU_STRUCTURE } from './navigationConfig';
import { ChevronRight, Menu, Home } from 'lucide-react';

const ChevronIcon = ({ isOpen, className = '' }) => (
    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isOpen ? 'rotate-90' : ''} ${className}`} />
);

export default function Sidebar() {
    const { hasPermission } = useAuth();
    const { config, isFeatureEnabled } = useConfig();
    const { isOpen, toggleSidebar } = useSidebar();
    const isCollapsed = !isOpen;
    const pathname = usePathname();

    // State for expanded modules (Level 1)
    const [expandedModules, setExpandedModules] = useState({});

    // Auto-expand based on active route
    useEffect(() => {
        const newExpanded = {};
        MENU_STRUCTURE.forEach(module => {
            const hasActiveChild = module.items.some(sub =>
                sub.items?.some(link => pathname.startsWith(link.path.split('?')[0]))
            );
            if (hasActiveChild) {
                newExpanded[module.key] = true;
            }
        });
        setExpandedModules(prev => ({ ...prev, ...newExpanded }));
    }, [pathname]);

    const toggleModule = (key) => {
        if (isCollapsed) toggleSidebar();
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper permission check
    const checkPermission = (perm) => {
        if (!perm) return true;
        return hasPermission(perm);
    };

    // Helper feature check
    const checkFeature = (feature) => {
        if (!feature) return true;
        return isFeatureEnabled(feature);
    };

    return (
        <>
            {/* Overlay Mobile */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-800/60 shadow-2xl
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-[17rem]'}`}
            >
                {/* Header */}
                <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-4 mb-2`}>
                    {isOpen && (
                        <Link href="/" className="flex items-center gap-3 transition-opacity duration-300">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                                {config?.nombre_sistema ? config.nombre_sistema[0].toUpperCase() : 'E'}
                            </div>
                            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                {config?.nombre_sistema || 'ERP System'}
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={`rounded-lg transition-all duration-200 flex items-center justify-center 
                            ${isOpen
                                ? 'p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                                : 'w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:scale-105'
                            }`}
                    >
                        {isOpen ? <Menu className="h-5 w-5" /> : (config?.nombre_sistema ? config.nombre_sistema[0].toUpperCase() : 'E')}
                    </button>
                </div>

                {/* Empresa Selector */}
                <div className="flex-none px-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <EmpresaSelector />
                </div>

                {/* Navigation */}
                <nav className={`flex-1 px-3 py-2 space-y-1 transition-all duration-500 min-h-0 ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>

                    {/* Dashboard */}
                    {checkPermission('users.view_dashboard') && (
                        <div className="mb-2">
                            <Link href="/" className={`flex items-center p-2.5 rounded-xl text-sm transition-all duration-300 group ${pathname === '/' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'}`}>
                                <Home className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                                <span className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>Inicio</span>
                            </Link>
                        </div>
                    )}

                    {/* Modules Recursive */}
                    {MENU_STRUCTURE.map((module) => {
                        // Check Feature Flag
                        if (module.featureFlag && !checkFeature(module.featureFlag)) {
                            return null;
                        }

                        if (!checkPermission(module.permission) && !module.items.some(sub => sub.items?.some(i => checkPermission(i.permission)))) {
                            return null;
                        }

                        const isExpanded = expandedModules[module.key];
                        // Active module logic: if any child path matches start of current path
                        const isActiveModule = module.items.some(sub => sub.items?.some(link => pathname.startsWith(link.path.split('?')[0])));

                        return (
                            <div key={module.key} className="py-1">
                                <button
                                    onClick={() => toggleModule(module.key)}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200
                                        ${isActiveModule || isExpanded
                                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'}`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                        <module.icon className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                                        <span className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>{module.label}</span>
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isExpanded} />}
                                </button>

                                {/* Submodules */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded && isOpen ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <div className="ml-1 space-y-2 relative">
                                        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
                                        {module.items.map((submodule, idx) => (
                                            <div key={idx} className="pl-6 relative">
                                                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 mt-2 px-2">
                                                    {submodule.label}
                                                </h4>

                                                <ul className="space-y-0.5">
                                                    {submodule.items.map((link, lIdx) => {
                                                        if (!checkPermission(link.permission)) return null;
                                                        const cleanPath = link.path.split('?')[0];
                                                        const isActiveLink = pathname.startsWith(cleanPath);

                                                        return (
                                                            <li key={lIdx}>
                                                                <Link
                                                                    href={link.path}
                                                                    className={`flex items-center p-2 rounded-lg text-sm transition-all duration-200
                                                                        ${isActiveLink
                                                                            ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1'}`}
                                                                >
                                                                    {isActiveLink ? <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mr-2" />}
                                                                    {link.label}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>


            </aside>
        </>
    );
}