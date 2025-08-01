// components/Sidebar.js
'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import {
    Home,
    Users,
    ClipboardList,
    FileText,
    Banknote,
    Calendar,
    BarChart3,
    Settings,
    User,
    Key,
    Upload,
    CircleDollarSign,
    ShieldCheck,
    FileSearch,
    Menu,
    LogOut
} from 'lucide-react';

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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const sidebarRef = useRef(null);

    const adminActive = pathname.startsWith('/configuraciones') || pathname.startsWith('/importar') ||
        pathname.startsWith('/tipos-de-cambio') || pathname.startsWith('/auditoria');

    useEffect(() => {
        setIsAdminOpen(adminActive);
        setIsUserMenuOpen(false);
        setIsGestionOpen(pathname.startsWith('/configuraciones'));
        const isImportarPath = pathname.startsWith('/importar');
        setIsImportarOpen(isImportarPath);
        const herramientasPath = isImportarPath || pathname.startsWith('/tipos-de-cambio');
        setIsHerramientasOpen(herramientasPath);
        setIsSeguridadOpen(pathname.startsWith('/auditoria'));
    }, [pathname]);

    const closeAllMenus = () => {
        setIsAdminOpen(false);
        setIsGestionOpen(false);
        setIsHerramientasOpen(false);
        setIsImportarOpen(false);
        setIsSeguridadOpen(false);
        setIsUserMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!sidebarRef.current?.contains(e.target)) {
                closeAllMenus();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdminToggle = () => {
        const newState = !isAdminOpen;
        closeAllMenus();
        setIsAdminOpen(newState);
    };

    const handleUserToggle = () => {
        const newState = !isUserMenuOpen;
        closeAllMenus();
        setIsUserMenuOpen(newState);
    };

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
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-40 bg-white text-gray-800 border-r border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isOpen ? 'lg:w-64' : 'lg:w-20'} ${isCollapsed ? 'overflow-visible' : 'overflow-hidden'}`}
            >
                <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle sidebar</span>
                    </button>
                    {isOpen && (
                        <Link href="/" className="ml-2">
                            <img src="/logo-luximia.png" className="h-6" alt="Luximia" />
                        </Link>
                    )}
                </div>
                <nav className={`flex-1 px-4 py-4 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    <ul className="space-y-1">
                        {hasPermission('cxc.can_view_dashboard') ? (
                            <li>
                                <Link href="/" className={getLinkClass('/')}> 
                                    <Home className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Dashboard</span>}
                                </Link>
                            </li>
                        ) : (
                            <li>
                                <Link href="/" className={getLinkClass('/')}> 
                                    <Home className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Inicio</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_cliente') && (
                            <li>
                                <Link href="/clientes" className={getLinkClass('/clientes')}>
                                    <Users className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Clientes</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_proyecto') && (
                            <li>
                                <Link href="/proyectos" className={getLinkClass('/proyectos')}>
                                    <ClipboardList className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Proyectos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_upe') && (
                            <li>
                                <Link href="/upes" className={getLinkClass('/upes')}>
                                    <FileSearch className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">UPEs</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_contrato') && (
                            <li>
                                <Link href="/contratos" className={getLinkClass('/contratos')}>
                                    <FileText className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Contratos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_pago') && (
                            <li>
                                <Link href="/pagos" className={getLinkClass('/pagos')}>
                                    <Banknote className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Pagos</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.view_planpago') && (
                            <li>
                                <Link href="/planes-pago" className={getLinkClass('/planes-pago')}>
                                    <Calendar className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Planes de Pago</span>}
                                </Link>
                            </li>
                        )}
                        {hasPermission('cxc.can_export') && (
                            <li>
                                <Link href="/reportes" className={getLinkClass('/reportes')}>
                                    <BarChart3 className="h-5 w-5" />
                                    {isOpen && <span className="ml-2">Reportes</span>}
                                </Link>
                            </li>
                        )}

                        {canViewSettings && (
                            <li className="pt-2 relative">
                                <button
                                    onClick={handleAdminToggle}
                                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''} ${adminActive ? 'bg-blue-600 text-white dark:bg-blue-700 font-semibold' : ''}`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                        <Settings className="h-5 w-5" />
                                        {isOpen && <span className="ml-2 text-sm font-semibold uppercase">Administración</span>}
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isAdminOpen} />}
                                </button>
                                {isAdminOpen && (
                                    isCollapsed ? (
                                        <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 transition-all duration-200">
                                            <div className="relative">
                                                <button onClick={() => { setIsGestionOpen(!isGestionOpen); setIsHerramientasOpen(false); setIsSeguridadOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <div className="flex items-center">
                                                        <Users className="h-5 w-5" />
                                                        <span className="ml-2">Gestión de Usuarios</span>
                                                    </div>
                                                    <ChevronIcon isOpen={isGestionOpen} />
                                                </button>
                                                {isGestionOpen && (
                                                    <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 whitespace-nowrap transition-all duration-200">
                                                        {hasPermission('cxc.view_user') && (
                                                            <Link href="/configuraciones/usuarios" className={getLinkClass('/configuraciones/usuarios', true)}>
                                                                <User className="h-4 w-4" />
                                                                <span className="ml-2">Usuarios</span>
                                                            </Link>
                                                        )}
                                                        {hasPermission('cxc.view_group') && (
                                                            <Link href="/configuraciones/roles" className={getLinkClass('/configuraciones/roles', true)}>
                                                                <Key className="h-4 w-4" />
                                                                <span className="ml-2">Roles y Permisos</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {canImportData && (
                                                <div className="relative">
                                                    <button onClick={() => { setIsHerramientasOpen(!isHerramientasOpen); setIsGestionOpen(false); setIsSeguridadOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <div className="flex items-center">
                                                            <Settings className="h-5 w-5" />
                                                            <span className="ml-2">Herramientas</span>
                                                        </div>
                                                        <ChevronIcon isOpen={isHerramientasOpen} />
                                                    </button>
                                                    {isHerramientasOpen && (
                                                        <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 whitespace-nowrap transition-all duration-200">
                                                            <div className="relative">
                                                                <button onClick={() => setIsImportarOpen(!isImportarOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                    <div className="flex items-center">
                                                                        <Upload className="h-5 w-5" />
                                                                        <span className="ml-2">Importadores de Datos</span>
                                                                    </div>
                                                                    <ChevronIcon isOpen={isImportarOpen} />
                                                                </button>
                                                                {isImportarOpen && (
                                                                    <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 whitespace-nowrap transition-all duration-200">
                                                                        {user?.is_superuser && (
                                                                            <Link href="/importar" className={getLinkClass('/importar', true)}>
                                                                                <Upload className="h-4 w-4" />
                                                                                <span className="ml-2">Masivo (General)</span>
                                                                            </Link>
                                                                        )}
                                                                        {hasPermission('cxc.add_cliente') && (
                                                                            <Link href="/importar/clientes" className={getLinkClass('/importar/clientes', true)}>
                                                                                <Upload className="h-4 w-4" />
                                                                                <span className="ml-2">Clientes</span>
                                                                            </Link>
                                                                        )}
                                                                        {hasPermission('cxc.add_upe') && (
                                                                            <Link href="/importar/upes" className={getLinkClass('/importar/upes', true)}>
                                                                                <Upload className="h-4 w-4" />
                                                                                <span className="ml-2">UPEs</span>
                                                                            </Link>
                                                                        )}
                                                                        {hasPermission('cxc.add_contrato') && (
                                                                            <Link href="/importar/contratos" className={getLinkClass('/importar/contratos', true)}>
                                                                                <Upload className="h-4 w-4" />
                                                                                <span className="ml-2">Contratos</span>
                                                                            </Link>
                                                                        )}
                                                                        {hasPermission('cxc.add_pago') && (
                                                                            <Link href="/importar/pagos" className={getLinkClass('/importar/pagos', true)}>
                                                                                <Upload className="h-4 w-4" />
                                                                                <span className="ml-2">Pagos Históricos</span>
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {hasPermission('cxc.view_tipodecambio') && (
                                                                <Link href="/tipos-de-cambio" className={getLinkClass('/tipos-de-cambio', true)}>
                                                                    <CircleDollarSign className="h-4 w-4" />
                                                                    <span className="ml-2">Tipo de Cambio</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {hasPermission('cxc.can_view_auditlog') && (
                                                <div className="relative">
                                                    <button onClick={() => { setIsSeguridadOpen(!isSeguridadOpen); setIsGestionOpen(false); setIsHerramientasOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <div className="flex items-center">
                                                            <ShieldCheck className="h-5 w-5" />
                                                            <span className="ml-2">Seguridad</span>
                                                        </div>
                                                        <ChevronIcon isOpen={isSeguridadOpen} />
                                                    </button>
                                                    {isSeguridadOpen && (
                                                        <div className="absolute left-full top-0 ml-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 whitespace-nowrap transition-all duration-200">
                                                            <Link href="/auditoria" className={getLinkClass('/auditoria', true)}>
                                                                <FileSearch className="h-4 w-4" />
                                                                <span className="ml-2">Registro de Auditoría</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <ul className="pl-4 mt-1 space-y-1">
                                            <li>
                                                <button onClick={() => { setIsGestionOpen(!isGestionOpen); setIsHerramientasOpen(false); setIsSeguridadOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <div className="flex items-center">
                                                        <Users className="h-5 w-5" />
                                                        <span className="ml-2">Gestión de Usuarios</span>
                                                    </div>
                                                    <ChevronIcon isOpen={isGestionOpen} />
                                                </button>
                                                {isGestionOpen && (
                                                    <ul className="pl-4 mt-1 space-y-1">
                                                        {hasPermission('cxc.view_user') && (
                                                            <li>
                                                                <Link href="/configuraciones/usuarios" className={getLinkClass('/configuraciones/usuarios', true)}>
                                                                    <User className="h-4 w-4" />
                                                                    <span className="ml-2">Usuarios</span>
                                                                </Link>
                                                            </li>
                                                        )}
                                                        {hasPermission('cxc.view_group') && (
                                                            <li>
                                                                <Link href="/configuraciones/roles" className={getLinkClass('/configuraciones/roles', true)}>
                                                                    <Key className="h-4 w-4" />
                                                                    <span className="ml-2">Roles y Permisos</span>
                                                                </Link>
                                                            </li>
                                                        )}
                                                    </ul>
                                                )}
                                            </li>
                                            {canImportData && (
                                                <li>
                                                    <button onClick={() => { setIsHerramientasOpen(!isHerramientasOpen); setIsGestionOpen(false); setIsSeguridadOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <div className="flex items-center">
                                                            <Settings className="h-5 w-5" />
                                                            <span className="ml-2">Herramientas</span>
                                                        </div>
                                                        <ChevronIcon isOpen={isHerramientasOpen} />
                                                    </button>
                                                    {isHerramientasOpen && (
                                                        <ul className="pl-4 mt-1 space-y-1">
                                                            <li>
                                                                <button onClick={() => setIsImportarOpen(!isImportarOpen)} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                    <div className="flex items-center">
                                                                        <Upload className="h-5 w-5" />
                                                                        <span className="ml-2">Importadores de Datos</span>
                                                                    </div>
                                                                    <ChevronIcon isOpen={isImportarOpen} />
                                                                </button>
                                                                {isImportarOpen && (
                                                                    <ul className="pl-4 mt-1 space-y-1">
                                                                        {user?.is_superuser && (
                                                                            <li>
                                                                                <Link href="/importar" className={getLinkClass('/importar', true)}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="ml-2">Masivo (General)</span>
                                                                                </Link>
                                                                            </li>
                                                                        )}
                                                                        {hasPermission('cxc.add_cliente') && (
                                                                            <li>
                                                                                <Link href="/importar/clientes" className={getLinkClass('/importar/clientes', true)}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="ml-2">Clientes</span>
                                                                                </Link>
                                                                            </li>
                                                                        )}
                                                                        {hasPermission('cxc.add_upe') && (
                                                                            <li>
                                                                                <Link href="/importar/upes" className={getLinkClass('/importar/upes', true)}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="ml-2">UPEs</span>
                                                                                </Link>
                                                                            </li>
                                                                        )}
                                                                        {hasPermission('cxc.add_contrato') && (
                                                                            <li>
                                                                                <Link href="/importar/contratos" className={getLinkClass('/importar/contratos', true)}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="ml-2">Contratos</span>
                                                                                </Link>
                                                                            </li>
                                                                        )}
                                                                        {hasPermission('cxc.add_pago') && (
                                                                            <li>
                                                                                <Link href="/importar/pagos" className={getLinkClass('/importar/pagos', true)}>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="ml-2">Pagos Históricos</span>
                                                                                </Link>
                                                                            </li>
                                                                        )}
                                                                    </ul>
                                                                )}
                                                            </li>
                                                            {hasPermission('cxc.view_tipodecambio') && (
                                                                <li>
                                                                    <Link href="/tipos-de-cambio" className={getLinkClass('/tipos-de-cambio', true)}>
                                                                        <CircleDollarSign className="h-4 w-4" />
                                                                        <span className="ml-2">Tipo de Cambio</span>
                                                                    </Link>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </li>
                                            )}
                                            {hasPermission('cxc.can_view_auditlog') && (
                                                <li>
                                                    <button onClick={() => { setIsSeguridadOpen(!isSeguridadOpen); setIsGestionOpen(false); setIsHerramientasOpen(false); setIsImportarOpen(false); }} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <div className="flex items-center">
                                                            <ShieldCheck className="h-5 w-5" />
                                                            <span className="ml-2">Seguridad</span>
                                                        </div>
                                                        <ChevronIcon isOpen={isSeguridadOpen} />
                                                    </button>
                                                    {isSeguridadOpen && (
                                                        <ul className="pl-4 mt-1 space-y-1">
                                                            <li>
                                                                <Link href="/auditoria" className={getLinkClass('/auditoria', true)}>
                                                                    <FileSearch className="h-4 w-4" />
                                                                    <span className="ml-2">Registro de Auditoría</span>
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </li>
                                            )}
                                        </ul>
                                    ))}
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="relative p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleUserToggle}
                        className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                            <img src={user?.avatar || '/icon-luximia.png'} alt="Usuario" className="h-6 w-6 rounded-full" />
                            {isOpen && <span className="ml-2 text-sm">{user?.username || 'Usuario'}</span>}
                        </div>
                        {isOpen && <ChevronIcon isOpen={isUserMenuOpen} />}
                    </button>
                    {isUserMenuOpen && (
                        isCollapsed ? (
                            <div className="absolute left-full bottom-0 ml-2 mb-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 transition-all duration-200">
                                <ThemeSwitcher className="w-full p-2 text-sm text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" />
                                <Link href="/ajustes" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <Settings className="h-5 w-5" />
                                    <span className="ml-2">Ajustes</span>
                                </Link>
                                <button onClick={logoutUser} className="flex items-center w-full p-2 text-red-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <LogOut className="h-5 w-5" />
                                    <span className="ml-2">Salir</span>
                                </button>
                            </div>
                        ) : (
                            <div className="mt-2 space-y-1 transition-all duration-200">
                                <ThemeSwitcher className="w-full p-2 text-sm text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700" />
                                <Link href="/ajustes" className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <Settings className="h-5 w-5" />
                                    <span className="ml-2">Ajustes</span>
                                </Link>
                                <button onClick={logoutUser} className="flex items-center w-full p-2 text-red-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <LogOut className="h-5 w-5" />
                                    <span className="ml-2">Cerrar sesión</span>
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
}
