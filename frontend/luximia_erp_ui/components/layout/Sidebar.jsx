// components/layout/Sidebar.jsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import {
    Home,
    Users,
    ClipboardList,
    Building,
    FileText,
    Banknote,
    Landmark,
    Calendar,
    BarChart3,
    Settings,
    Briefcase,
    User,
    UserPlus,
    Key,
    Upload,
    CircleDollarSign,
    Coins,
    CreditCard,
    ShieldCheck,
    FileSearch,
    Folder,
    Menu,
    LogOut,
    Wallet,
    ChevronRight,
} from 'lucide-react';

const ChevronIcon = ({ isOpen }) => (
    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
);

export default function Sidebar() {
    const { user, logoutUser, hasPermission } = useAuth();
    const { isOpen, toggleSidebar } = useSidebar();
    const isCollapsed = !isOpen;
    const pathname = usePathname();
    const sidebarRef = useRef(null);
    const textClasses = 'ml-2 transition-all duration-300 overflow-hidden';

    // Toggles de grupos
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isGestionOpen, setIsGestionOpen] = useState(false);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState(false);
    const [isImportarOpen, setIsImportarOpen] = useState(false);
    const [isSeguridadOpen, setIsSeguridadOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCatalogosOpen, setIsCatalogosOpen] = useState(false);
    const [isFinanzasOpen, setIsFinanzasOpen] = useState(false);

    // Secciones activas por ruta
    const adminActive =
        pathname.startsWith('/configuraciones') ||
        pathname.startsWith('/importar') ||
        pathname.startsWith('/tipos-de-cambio') ||
        pathname.startsWith('/tipos-cambio') ||
        pathname.startsWith('/auditoria');

    const catalogosActive = [
        '/clientes',
        '/puestos',
        '/vendedores',
        '/empleados',
        '/proyectos',
        '/departamentos',
        '/bancos',
        '/monedas',
        '/upes',
        '/contratos',
    ].some((path) => pathname.startsWith(path));

    const finanzasActive = [
        '/pagos',
        '/formas-pago',
        '/planes-pago',
        '/esquemas-comision',
        '/reportes',
    ].some((path) => pathname.startsWith(path));

    useEffect(() => {
        // Abrimos/cerramos acorde a la ruta
        setIsAdminOpen(adminActive);
        setIsCatalogosOpen(catalogosActive);
        setIsFinanzasOpen(finanzasActive);
        setIsGestionOpen(pathname.startsWith('/configuraciones'));
        setIsImportarOpen(pathname.startsWith('/importar'));
        setIsHerramientasOpen(
            pathname.startsWith('/importar') || pathname.startsWith('/tipos-de-cambio') || pathname.startsWith('/tipos-cambio')
        );
        setIsSeguridadOpen(pathname.startsWith('/auditoria'));
        setIsUserMenuOpen(false);
    }, [pathname, adminActive, catalogosActive, finanzasActive]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdminToggle = () => setIsAdminOpen((v) => !v);
    const handleCatalogosToggle = () => setIsCatalogosOpen((v) => !v);
    const handleFinanzasToggle = () => setIsFinanzasOpen((v) => !v);
    const handleUserToggle = () => setIsUserMenuOpen((v) => !v);

    const getLinkClass = (path, isSubmenu = false) => {
        const base = isSubmenu
            ? `flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 ${isCollapsed ? 'justify-center' : ''
            }`
            : `flex items-center p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white text-gray-800 dark:text-gray-200 ${isCollapsed ? 'justify-center' : ''
            }`;

        const active =
            (path === '/' ? pathname === '/' : pathname.startsWith(path)) &&
            path !== '' &&
            path !== null;

        const activeClass = isSubmenu
            ? 'bg-gray-200 dark:bg-gray-700 font-semibold text-blue-600 dark:text-white'
            : 'bg-blue-600 text-white dark:bg-blue-700 font-semibold';

        return `${base} ${active ? activeClass : ''}`;
    };

    const canViewSettings = hasPermission('cxc.view_user') || hasPermission('cxc.view_group');
    const canImportData = user?.is_superuser || hasPermission('cxc.add_pago');
    const showAdminGroup =
        canViewSettings ||
        canImportData ||
        hasPermission('cxc.view_tipocambio') ||
        hasPermission('cxc.view_tipodecambio') ||
        hasPermission('cxc.can_view_auditlog');

    const showCatalogosGroup =
        hasPermission('cxc.view_cliente') ||
        hasPermission('cxc.view_puesto') ||
        hasPermission('cxc.view_vendedor') ||
        hasPermission('cxc.view_empleado') ||
        hasPermission('cxc.view_proyecto') ||
        hasPermission('cxc.view_departamento') ||
        hasPermission('cxc.view_banco') ||
        hasPermission('cxc.view_moneda') ||
        hasPermission('cxc.view_upe') ||
        hasPermission('cxc.view_contrato');

    const showFinanzasGroup =
        hasPermission('cxc.view_pago') ||
        hasPermission('cxc.view_formapago') ||
        hasPermission('cxc.view_planpago') ||
        hasPermission('cxc.view_esquemacomision') ||
        hasPermission('cxc.can_export');

    // Cambiado: Ahora usa el nombre completo del usuario
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuario';

    return (
        <>
            {/* Overlay en móvil */}
            <div
                className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={toggleSidebar}
            />

            <div
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-40 bg-white text-gray-800 border-r border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ease-in-out w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
            >
                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle sidebar</span>
                    </button>
                    {isOpen && (
                        <Link href="/" className={textClasses}>
                            <img src="/logo-luximia.png" className="h-6" alt="Luximia" />
                        </Link>
                    )}
                </div>

                {/* NAV */}
                <nav data-collapsed={!isOpen} className={`flex-1 px-4 py-4 transition-all duration-300 ${isCollapsed ? '' : 'overflow-y-auto'}`}>
                    <ul className="space-y-1">
                        {/* Inicio / Dashboard */}
                        <li>
                            <Link href="/" className={getLinkClass('/')}>
                                <Home className="h-5 w-5" />
                                <span className={textClasses}>
                                        {hasPermission('cxc.can_view_dashboard') ? 'Dashboard' : 'Inicio'}
                                    </span>
                            </Link>
                        </li>

                        {/* Catálogos */}
                        {showCatalogosGroup && (
                            <li className="pt-2">
                                <button
                                    onClick={handleCatalogosToggle}
                                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''} ${catalogosActive ? 'bg-blue-600 text-white dark:bg-blue-700 font-semibold' : ''}`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                        <Folder className="h-5 w-5" />
                                        <span className={`${textClasses} text-sm font-semibold uppercase`}>Catálogos</span>
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isCatalogosOpen} />}
                                </button>

                                {isCatalogosOpen && (
                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                        {hasPermission('cxc.view_cliente') && (
                                            <li>
                                                <Link href="/clientes" className={getLinkClass('/clientes', true)}>
                                                    <Users className="h-4 w-4" />
                                                    <span className={textClasses}>Clientes</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_puesto') && (
                                            <li>
                                                <Link href="/puestos" className={getLinkClass('/puestos', true)}>
                                                    <Briefcase className="h-4 w-4" />
                                                    <span className={textClasses}>Puestos</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_vendedor') && (
                                            <li>
                                                <Link href="/vendedores" className={getLinkClass('/vendedores', true)}>
                                                    <User className="h-4 w-4" />
                                                    <span className={textClasses}>Vendedores</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_empleado') && (
                                            <li>
                                                <Link href="/empleados" className={getLinkClass('/empleados', true)}>
                                                    <UserPlus className="h-4 w-4" />
                                                    <span className={textClasses}>Empleados</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_proyecto') && (
                                            <li>
                                                <Link href="/proyectos" className={getLinkClass('/proyectos', true)}>
                                                    <ClipboardList className="h-4 w-4" />
                                                    <span className={textClasses}>Proyectos</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_departamento') && (
                                            <li>
                                                <Link href="/departamentos" className={getLinkClass('/departamentos', true)}>
                                                    <Building className="h-4 w-4" />
                                                    <span className={textClasses}>Departamentos</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_banco') && (
                                            <li>
                                                <Link href="/bancos" className={getLinkClass('/bancos', true)}>
                                                    <Landmark className="h-4 w-4" />
                                                    <span className={textClasses}>Bancos</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_moneda') && (
                                            <li>
                                                <Link href="/monedas" className={getLinkClass('/monedas', true)}>
                                                    <Coins className="h-4 w-4" />
                                                    <span className={textClasses}>Monedas</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_upe') && (
                                            <li>
                                                <Link href="/upes" className={getLinkClass('/upes', true)}>
                                                    <FileSearch className="h-4 w-4" />
                                                    <span className={textClasses}>UPEs</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_contrato') && (
                                            <li>
                                                <Link href="/contratos" className={getLinkClass('/contratos', true)}>
                                                    <FileText className="h-4 w-4" />
                                                    <span className={textClasses}>Contratos</span>
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Finanzas */}
                        {showFinanzasGroup && (
                            <li className="pt-2">
                                <button
                                    onClick={handleFinanzasToggle}
                                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''} ${finanzasActive ? 'bg-blue-600 text-white dark:bg-blue-700 font-semibold' : ''}`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                        <Wallet className="h-5 w-5" />
                                        <span className={`${textClasses} text-sm font-semibold uppercase`}>Finanzas</span>
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isFinanzasOpen} />}
                                </button>

                                {isFinanzasOpen && (
                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                        {hasPermission('cxc.view_pago') && (
                                            <li>
                                                <Link href="/pagos" className={getLinkClass('/pagos', true)}>
                                                    <Banknote className="h-4 w-4" />
                                                    <span className={textClasses}>Pagos</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_formapago') && (
                                            <li>
                                                <Link href="/formas-pago" className={getLinkClass('/formas-pago', true)}>
                                                    <CreditCard className="h-4 w-4" />
                                                    <span className={textClasses}>Formas de Pago</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_planpago') && (
                                            <li>
                                                <Link href="/planes-pago" className={getLinkClass('/planes-pago', true)}>
                                                    <Calendar className="h-4 w-4" />
                                                    <span className={textClasses}>Planes de Pago</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.view_esquemacomision') && (
                                            <li>
                                                <Link href="/esquemas-comision" className={getLinkClass('/esquemas-comision', true)}>
                                                    <CircleDollarSign className="h-4 w-4" />
                                                    <span className={textClasses}>Esquemas</span>
                                                </Link>
                                            </li>
                                        )}
                                        {hasPermission('cxc.can_export') && (
                                            <li>
                                                <Link href="/reportes" className={getLinkClass('/reportes', true)}>
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span className={textClasses}>Reportes</span>
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* ADMINISTRACIÓN */}
                        {showAdminGroup && (
                            <li className="pt-2">
                                <button
                                    onClick={handleAdminToggle}
                                    className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''
                                        } ${adminActive ? 'bg-blue-600 text-white dark:bg-blue-700 font-semibold' : ''}`}
                                >
                                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                        <Settings className="h-5 w-5" />
                                        <span className={`${textClasses} text-sm font-semibold uppercase`}>Administración</span>
                                    </div>
                                    {isOpen && <ChevronIcon isOpen={isAdminOpen} />}
                                </button>

                                {isAdminOpen && (
                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                        {canViewSettings && (
                                            <li>
                                                <button
                                                    onClick={() => setIsGestionOpen((v) => !v)}
                                                    className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center">
                                                        <Users className="h-5 w-5" />
                                                        <span className={textClasses}>Gestión de Usuarios</span>
                                                    </div>
                                                    {isOpen && <ChevronIcon isOpen={isGestionOpen} />}
                                                </button>
                                                {isGestionOpen && (
                                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                                        {hasPermission('cxc.view_user') && (
                                                            <li>
                                                                <Link
                                                                    href="/configuraciones/usuarios"
                                                                    className={getLinkClass('/configuraciones/usuarios', true)}
                                                                >
                                                                    <User className="h-4 w-4" />
                                                                    <span className={textClasses}>Usuarios</span>
                                                                </Link>
                                                            </li>
                                                        )}
                                                        {hasPermission('cxc.view_group') && (
                                                            <li>
                                                                <Link
                                                                    href="/configuraciones/roles"
                                                                    className={getLinkClass('/configuraciones/roles', true)}
                                                                >
                                                                    <Key className="h-4 w-4" />
                                                                    <span className={textClasses}>Roles y Permisos</span>
                                                                </Link>
                                                            </li>
                                                        )}
                                                    </ul>
                                                )}
                                            </li>
                                        )}

                                        {canImportData && (
                                            <li>
                                                <button
                                                    onClick={() => setIsHerramientasOpen((v) => !v)}
                                                    className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center">
                                                        <Settings className="h-5 w-5" />
                                                        <span className={textClasses}>Herramientas</span>
                                                    </div>
                                                    {isOpen && <ChevronIcon isOpen={isHerramientasOpen} />}
                                                </button>
                                                {isHerramientasOpen && (
                                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                                        <li>
                                                            <Link href="/importar" className={getLinkClass('/importar', true)}>
                                                                <Upload className="h-4 w-4" />
                                                                <span className={textClasses}>Importar</span>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                )}
                                            </li>
                                        )}
                                        {hasPermission('cxc.can_view_auditlog') && (
                                            <li>
                                                <button
                                                    onClick={() => setIsSeguridadOpen((v) => !v)}
                                                    className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center">
                                                        <ShieldCheck className="h-5 w-5" />
                                                        <span className={textClasses}>Seguridad</span>
                                                    </div>
                                                    {isOpen && <ChevronIcon isOpen={isSeguridadOpen} />}
                                                </button>
                                                {isSeguridadOpen && (
                                                    <ul className={`${isCollapsed ? 'pl-0' : 'pl-4'} mt-1 space-y-1`}>
                                                        <li>
                                                            <Link href="/auditoria" className={getLinkClass('/auditoria', true)}>
                                                                <FileSearch className="h-4 w-4" />
                                                                <span className={textClasses}>Registro de Auditoría</span>
                                                            </Link>
                                                        </li>
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

            <style jsx>{`
                nav span {
                    transition: all 0.3s;
                    display: inline-block;
                }
                nav[data-collapsed="true"] span {
                    width: 0;
                    opacity: 0;
                    margin-left: 0;
                }
            `}</style>

                {/* User footer */}
                <div className="relative p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                        <button
                            onClick={handleUserToggle}
                            className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-600 dark:hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                <img src={user?.avatar || '/icon-luximia.png'} alt="Usuario" className="h-6 w-6 rounded-full" />
                                {!isCollapsed && <span className={`${textClasses} text-sm`}>{fullName}</span>}
                            </div>
                            {isOpen && <ChevronIcon isOpen={isUserMenuOpen} />}
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute left-0 bottom-full w-full mb-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg space-y-1 z-50">
                                <ThemeSwitcher
                                    className={`w-full p-2 text-sm text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                                    showLabel={!isCollapsed}
                                />
                                <Link
                                    href="/ajustes"
                                    className={`flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <Settings className="h-5 w-5" />
                                    {!isCollapsed && <span className={textClasses}>Ajustes</span>}
                                </Link>
                                <button
                                    onClick={logoutUser}
                                    className={`flex items-center w-full p-2 text-red-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <LogOut className="h-5 w-5" />
                                    {!isCollapsed && <span className={textClasses}>Cerrar sesión</span>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}