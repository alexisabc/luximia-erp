// components/Sidebar.js
'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import {
    HomeIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    UserIcon,
    KeyIcon,
    ArrowUpTrayIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ChevronIcon = ({ isOpen }) => (
    <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path>
    </svg>
);

export default function Sidebar() {
    const { user, logoutUser, hasPermission } = useAuth();
    const { isOpen, toggleSidebar } = useSidebar();
    const isCollapsed = !isOpen;
    const pathname = usePathname();

    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isGestionOpen, setIsGestionOpen] = useState(false);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState(false);
    const [isImportarOpen, setIsImportarOpen] = useState(false);
    const [isSeguridadOpen, setIsSeguridadOpen] = useState(false);

    useEffect(() => {
        const adminPath = pathname.startsWith('/configuraciones') || pathname.startsWith('/importar') || pathname.startsWith('/tipos-de-cambio') || pathname.startsWith('/auditoria');
        setIsAdminOpen(adminPath);

        setIsGestionOpen(pathname.startsWith('/configuraciones'));

        const isImportarPath = pathname.startsWith('/importar');
        setIsImportarOpen(isImportarPath);

        const herramientasPath = isImportarPath || pathname.startsWith('/tipos-de-cambio');
        setIsHerramientasOpen(herramientasPath);

        setIsSeguridadOpen(pathname.startsWith('/auditoria'));
    }, [pathname]);

    const getLinkClass = (path, isSubmenu = false) => {
        const baseClass = isSubmenu
            ? `flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm ${isCollapsed ? 'justify-center' : ''}`
            : `flex items-center p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''}`;

        const activeClass = isSubmenu
            ? 'bg-gray-200 dark:bg-gray-700 font-semibold'
            : 'bg-blue-600 text-white dark:bg-blue-700 font-semibold';

        let isActive = pathname.startsWith(path) && path !== '/';
        if (path === '/') isActive = pathname === path;

        return `${baseClass} ${isActive ? activeClass : ''}`;
    };

    const canViewSettings = hasPermission('cxc.view_user') || hasPermission('cxc.view_group') || hasPermission('cxc.view_tipodecambio');
    const canImportData = user?.is_superuser || hasPermission('cxc.add_pago');

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            ></div>

            <div
                className={`fixed inset-y-0 left-0 z-40 bg-white text-gray-800 border-r border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isOpen ? 'lg:w-64' : 'lg:w-20'}`}
            >
                <div className="p-4 flex-shrink-0 text-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Luximia ERP</h2>
                    {user && <span className="text-sm block text-gray-500 dark:text-gray-400">Bienvenido, {user.username}</span>}
                </div>

                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {hasPermission('cxc.can_view_dashboard') ? (
                            <li>
                                <Link href="/" className={getLinkClass('/')}> 
                                    <HomeIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Dashboard</span>}
                                </Link>
                            </li>
                        ) : (
                            <li>
                                <Link href="/" className={getLinkClass('/')}> 
                                    <HomeIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Inicio</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_cliente') && (
                            <li>
                                <Link href="/clientes" className={getLinkClass('/clientes')}>
                                    <UserGroupIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Clientes</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_proyecto') && (
                            <li>
                                <Link href="/proyectos" className={getLinkClass('/proyectos')}>
                                    <ClipboardDocumentListIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Proyectos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_contrato') && (
                            <li>
                                <Link href="/contratos" className={getLinkClass('/contratos')}>
                                    <DocumentTextIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Contratos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_pago') && (
                            <li>
                                <Link href="/pagos" className={getLinkClass('/pagos')}>
                                    <BanknotesIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Pagos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.can_export') && (
                            <li>
                                <Link href="/reportes" className={getLinkClass('/reportes')}>
                                    <ChartBarIcon className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Reportes</span>}
                                </Link>
                            </li>
                        )}

                        {canViewSettings && (
                            <li className="pt-2 relative">
                                <button onClick={() => setIsAdminOpen(!isAdminOpen)} className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}> 
                                        <Cog6ToothIcon className="h-5 w-5" />
                                        {isOpen && <span className="ml-2 text-sm font-semibold uppercase">Administración</span>}
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isAdminOpen} />}
                                </button>
                                {isAdminOpen && (
                                    isCollapsed ? (
                                        <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1">
                                            {hasPermission('cxc.view_user') && (
                                                <Link href="/configuraciones/usuarios" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <UserIcon className="h-5 w-5" />
                                                    <span className="ml-2">Usuarios</span>
                                                </Link>
                                            )}
                                            {hasPermission('cxc.view_group') && (
                                                <Link href="/configuraciones/roles" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <KeyIcon className="h-5 w-5" />
                                                    <span className="ml-2">Roles</span>
                                                </Link>
                                            )}
                                            {canImportData && (
                                                <>
                                                    <Link href="/importar" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <ArrowUpTrayIcon className="h-5 w-5" />
                                                        <span className="ml-2">Importar</span>
                                                    </Link>
                                                    {hasPermission('cxc.view_tipodecambio') && (
                                                        <Link href="/tipos-de-cambio" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                            <CurrencyDollarIcon className="h-5 w-5" />
                                                            <span className="ml-2">Tipo Cambio</span>
                                                        </Link>
                                                    )}
                                                </>
                                            )}
                                            {hasPermission('cxc.can_view_auditlog') && (
                                                <Link href="/auditoria" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                                                    <span className="ml-2">Auditoría</span>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                    <ul className="pl-4 mt-1 space-y-1">
                                        <li>
                                            <button onClick={() => setIsGestionOpen(!isGestionOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                <span>Gestión de Usuarios</span>
                                                <ChevronIcon isOpen={isGestionOpen} />
                                            </button>
                                            {isGestionOpen && (
                                                <ul className="pl-4 mt-1 space-y-1">
                                                    {hasPermission('cxc.view_user') && <li><Link href="/configuraciones/usuarios" className={getLinkClass('/configuraciones/usuarios', true)}>Usuarios</Link></li>}
                                                    {hasPermission('cxc.view_group') && <li><Link href="/configuraciones/roles" className={getLinkClass('/configuraciones/roles', true)}>Roles y Permisos</Link></li>}
                                                </ul>
                                            )}
                                        </li>
                                        {canImportData && (
                                            <li>
                                                <button onClick={() => setIsHerramientasOpen(!isHerramientasOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <span>Herramientas</span>
                                                    <ChevronIcon isOpen={isHerramientasOpen} />
                                                </button>
                                                {isHerramientasOpen && (
                                                    <ul className="pl-4 mt-1 space-y-1">
                                                        <li>
                                                            <button onClick={() => setIsImportarOpen(!isImportarOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                <span>Importadores de Datos</span>
                                                                <ChevronIcon isOpen={isImportarOpen} />
                                                            </button>
                                                            {isImportarOpen && (
                                                                <ul className="pl-4 mt-1 space-y-1">
                                                                    {user?.is_superuser && <li><Link href="/importar" className={getLinkClass('/importar', true)}>Masivo (General)</Link></li>}
                                                                    {hasPermission('cxc.add_cliente') && <li><Link href="/importar/clientes" className={getLinkClass('/importar/clientes', true)}>Clientes</Link></li>}
                                                                    {hasPermission('cxc.add_upe') && <li><Link href="/importar/upes" className={getLinkClass('/importar/upes', true)}>UPEs</Link></li>}
                                                                    {hasPermission('cxc.add_contrato') && <li><Link href="/importar/contratos" className={getLinkClass('/importar/contratos', true)}>Contratos</Link></li>}
                                                                    {hasPermission('cxc.add_pago') && <li><Link href="/importar/pagos" className={getLinkClass('/importar/pagos', true)}>Pagos Históricos</Link></li>}
                                                                </ul>
                                                            )}
                                                        </li>
                                                        {hasPermission('cxc.view_tipodecambio') && <li><Link href="/tipos-de-cambio" className={getLinkClass('/tipos-de-cambio', true)}>Tipo de Cambio</Link></li>}
                                                    </ul>
                                                )}
                                            </li>
                                        )}
                                        {hasPermission('cxc.can_view_auditlog') && (
                                            <li>
                                                <button onClick={() => setIsSeguridadOpen(!isSeguridadOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <span>Seguridad</span>
                                                    <ChevronIcon isOpen={isSeguridadOpen} />
                                                </button>
                                                {isSeguridadOpen && (
                                                    <ul className="pl-4 mt-1 space-y-1">
                                                        <li><Link href="/auditoria" className={getLinkClass('/auditoria', true)}>Registro de Auditoría</Link></li>
                                                    </ul>
                                                )}
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="p-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <ThemeSwitcher />
                    <button onClick={logoutUser} className="w-full flex items-center justify-center p-2 rounded-md text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white transition-colors">
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
}