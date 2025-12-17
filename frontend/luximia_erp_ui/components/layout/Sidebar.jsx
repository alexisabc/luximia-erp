'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import EmpresaSelector from '@/components/layout/EmpresaSelector';
import {
    Home,
    Users,
    Building,
    FileText,
    Banknote,
    Landmark,
    BarChart3,
    Settings,
    Briefcase,
    ShieldCheck,
    Menu,
    LogOut,
    Wallet,
    ChevronRight,
    Scale,
    Gavel,
    FileSearch,
    Monitor,
    LayoutDashboard,
    PieChart,
    Briefcase as BriefcaseIcon,
    HardHat,
    CircleDollarSign,
    CreditCard,
    Calendar,
    UserCheck,
    ScrollText,
    ShoppingCart,
} from 'lucide-react';

const ChevronIcon = ({ isOpen, className = '' }) => (
    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isOpen ? 'rotate-90' : ''} ${className}`} />
);

// --- NAVIGATION STRUCTURE ---
const MENU_STRUCTURE = [
    {
        key: 'auditoria',
        label: 'Auditoría',
        icon: FileSearch,
        permission: 'auditoria.view_auditlog',
        items: [
            {
                label: 'Seguimiento',
                items: [
                    { label: 'Bitácora de Cambios', path: '/auditoria', permission: 'auditoria.view_auditlog' }
                ]
            }
        ]
    },
    {
        key: 'contabilidad',
        label: 'Contabilidad',
        icon: FileText,
        permission: 'contabilidad.view_cliente',
        items: [
            {
                label: 'Cuentas',
                items: [
                    { label: 'Clientes (CxC)', path: '/contabilidad/clientes', permission: 'contabilidad.view_cliente' },
                    { label: 'Proveedores (CxP)', path: '/contabilidad/proveedores' },
                ]
            },
            {
                label: 'Fiscal',
                items: [
                    { label: 'Facturación', path: '/contabilidad/facturacion' },
                ]
            },
            {
                label: 'Operaciones',
                items: [
                    { label: 'Monedas', path: '/contabilidad/monedas', permission: 'contabilidad.view_moneda' },
                    { label: 'Proyectos', path: '/contabilidad/proyectos', permission: 'contabilidad.view_proyecto' },
                    { label: 'UPEs', path: '/contabilidad/upes', permission: 'contabilidad.view_upe' },
                ]
            }
        ]
    },
    {
        key: 'direccion',
        label: 'Dirección',
        icon: LayoutDashboard,
        permission: 'users.view_dashboard',
        items: [
            {
                label: 'Estratégico',
                items: [
                    { label: 'Dashboard', path: '/direccion/dashboard', permission: 'users.view_dashboard' },
                    { label: 'KPIs', path: '/direccion/kpis' },
                ]
            }
        ]
    },
    {
        key: 'juridico',
        label: 'Jurídico',
        icon: Scale,
        permission: 'contabilidad.view_contrato',
        items: [
            {
                label: 'Gestión Legal',
                items: [
                    { label: 'Contratos', path: '/juridico/contratos', permission: 'contabilidad.view_contrato' },
                    { label: 'Expedientes', path: '/juridico/expedientes' },
                ]
            }
        ]
    },
    {
        key: 'rrhh',
        label: 'RRHH',
        icon: Users,
        permission: 'rrhh.view_empleado', // Base permission for module
        items: [
            {
                label: 'Administración',
                items: [
                    { label: 'Esquemas Comisión', path: '/rrhh/esquemas-comision', permission: 'contabilidad.view_esquemacomision' },
                    { label: 'Expedientes', path: '/rrhh/expedientes' },
                    { label: 'Nómina', path: '/rrhh/nominas' },
                ]
            },
            {
                label: 'Gestión de Personal',
                items: [
                    { label: 'Ausencias', path: '/rrhh/ausencias' },
                    { label: 'Departamentos', path: '/rrhh/departamentos', permission: 'rrhh.view_departamento' },
                    { label: 'Empleados', path: '/rrhh/empleados', permission: 'rrhh.view_empleado' },
                    { label: 'Organigrama', path: '/rrhh/organigrama' },
                    { label: 'Puestos', path: '/rrhh/puestos', permission: 'rrhh.view_puesto' },
                    { label: 'Vendedores', path: '/rrhh/vendedores', permission: 'contabilidad.view_vendedor' },
                ]
            }
        ]
    },
    {
        key: 'pos',
        label: 'Punto de Venta',
        icon: ShoppingCart,
        permission: 'pos.view_venta',
        items: [
            {
                label: 'Operación',
                items: [
                    { label: 'Terminal PV', path: '/pos/terminal', permission: 'pos.add_venta' },
                    { label: 'Historial Ventas', path: '/pos/ventas', permission: 'pos.view_venta' },
                ]
            },
            {
                label: 'Administración',
                items: [
                    { label: 'Cajas y Turnos', path: '/pos/turnos', permission: 'pos.view_turno' },
                    { label: 'Productos', path: '/pos/productos', permission: 'pos.view_producto' },
                    { label: 'Cuentas Clientes', path: '/pos/cuentas', permission: 'pos.view_cuentacliente' },
                ]
            }
        ]
    },
    {
        key: 'sistemas',
        label: 'Sistemas',
        icon: Monitor,
        permission: 'users.view_customuser',
        items: [
            {
                label: 'Gestión IT',
                items: [
                    { label: 'Inventario', path: '/sistemas/inventario', permission: 'sistemas.view_activoit' },
                    { label: 'Generar Responsiva', path: '/sistemas/responsivas/nuevo', permission: 'sistemas.add_asignacionequipo' },
                ]
            },
            {
                label: 'Herramientas',
                items: [
                    { label: 'Importar Datos', path: '/sistemas/importar', permission: 'contabilidad.add_pago' },
                    { label: 'Exportar Datos', path: '/sistemas/exportar', permission: 'contabilidad.view_contrato' },
                ]
            },
            {
                label: 'Seguridad y Acceso',
                items: [
                    { label: 'Bitácora de Eventos', path: '/auditoria', permission: 'auditoria.view_auditlog' },
                    { label: 'Roles y Permisos', path: '/sistemas/roles', permission: 'auth.view_group' },
                    { label: 'Usuarios', path: '/sistemas/usuarios', permission: 'users.view_customuser' },
                ]
            }
        ]
    },
    {
        key: 'tesoreria',
        label: 'Tesorería',
        icon: Wallet,
        permission: 'contabilidad.view_banco',
        items: [
            {
                label: 'Egresos',
                items: [
                    { label: 'Cajas Chicas', path: '/tesoreria/cajas' },
                ]
            },
            {
                label: 'Gestión de Fondos',
                items: [
                    { label: 'Bancos', path: '/tesoreria/bancos', permission: 'contabilidad.view_banco' },
                    { label: 'Formas de Pago', path: '/tesoreria/formas-pago', permission: 'contabilidad.view_formapago' },
                    { label: 'Pagos', path: '/tesoreria/pagos', permission: 'contabilidad.view_pago' },
                    { label: 'Planes de Pago', path: '/tesoreria/planes-pago', permission: 'contabilidad.view_planpago' },
                ]
            }
        ]
    }
];

export default function Sidebar() {
    const { user, logoutUser, hasPermission } = useAuth();
    const { isOpen, toggleSidebar } = useSidebar();
    const isCollapsed = !isOpen;
    const pathname = usePathname();
    const sidebarRef = useRef(null);

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

    // Close user menu on outside click
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleModule = (key) => {
        if (isCollapsed) toggleSidebar();
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper permission check
    const checkPermission = (perm) => {
        if (!perm) return true;
        return hasPermission(perm);
    };

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuario';

    return (
        <>
            {/* Overlay Mobile */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            />

            <aside
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-40 flex flex-col whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-800/60 shadow-2xl
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-[17rem]'}`}
            >
                {/* Header */}
                <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-4 mb-2`}>
                    {isOpen && (
                        <Link href="/" className="flex items-center gap-3 transition-opacity duration-300">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                                L
                            </div>
                            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                LUXIMIA
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
                        {isOpen ? <Menu className="h-5 w-5" /> : 'L'}
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
                        if (!checkPermission(module.permission) && !module.items.some(sub => sub.items?.some(i => checkPermission(i.permission)))) {
                            return null;
                        }

                        const isExpanded = expandedModules[module.key];
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
                                                {/* Dot indicator for connection */}

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

                {/* User Footer */}
                <div className="relative p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsUserMenuOpen(v => !v)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                                <div className="relative">
                                    <img src={user?.avatar || '/icon-luximia.png'} alt="Usuario" className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm" />
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                </div>
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className={`text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[140px]`}>{fullName}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">Conectado</span>
                                    </div>
                                )}
                            </div>
                            {isOpen && <ChevronIcon isOpen={isUserMenuOpen} />}
                        </button>

                        {isUserMenuOpen && (
                            <div className={`${isCollapsed ? 'fixed left-20 bottom-4 w-60 z-50 ml-2' : 'absolute left-0 bottom-full w-full mb-2 z-50'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                                <ThemeSwitcher className={`w-full p-2.5 rounded-xl text-sm flex items-center text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors`} showLabel={true} />
                                <Link
                                    href="/perfil"
                                    className="flex items-center w-full p-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    <Settings className="h-4 w-4 mr-3" />
                                    <span>Mi Perfil & Seguridad</span>
                                </Link>
                                <button
                                    onClick={logoutUser}
                                    className={`flex items-center w-full p-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}