'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Wallet,
    ShoppingCart,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    X,
    Briefcase,
    TrendingUp,
    CreditCard,
    Package,
    UserCog,
} from 'lucide-react';

/**
 * Sidebar Inteligente - Navegación lateral con filtrado por roles (RBAC),
 * grupos colapsables y diseño responsive.
 */
export default function Sidebar({ isOpen, setIsOpen, userRole = 'ADMIN' }) {
    const pathname = usePathname();
    const [expandedGroups, setExpandedGroups] = useState({
        operativo: true,
        administrativo: true,
        financiero: true,
    });

    // Definición del menú con roles permitidos
    const menuItems = [
        {
            group: 'operativo',
            groupName: 'Operativo',
            icon: Briefcase,
            items: [
                {
                    name: 'Dashboard',
                    href: '/dashboard',
                    icon: LayoutDashboard,
                    roles: ['ADMIN', 'GERENTE', 'CONTADOR', 'VENDEDOR'],
                },
                {
                    name: 'Proyectos',
                    href: '/proyectos',
                    icon: Building2,
                    roles: ['ADMIN', 'GERENTE'],
                },
                {
                    name: 'Punto de Venta',
                    href: '/pos',
                    icon: ShoppingCart,
                    roles: ['ADMIN', 'VENDEDOR', 'CAJERO'],
                },
            ],
        },
        {
            group: 'administrativo',
            groupName: 'Administrativo',
            icon: UserCog,
            items: [
                {
                    name: 'Empleados',
                    href: '/rrhh/empleados',
                    icon: Users,
                    roles: ['ADMIN', 'RRHH'],
                },
                {
                    name: 'Clientes',
                    href: '/clientes',
                    icon: Users,
                    roles: ['ADMIN', 'VENDEDOR', 'CONTADOR'],
                },
                {
                    name: 'Proveedores',
                    href: '/proveedores',
                    icon: Package,
                    roles: ['ADMIN', 'COMPRAS'],
                },
            ],
        },
        {
            group: 'financiero',
            groupName: 'Financiero',
            icon: TrendingUp,
            items: [
                {
                    name: 'Tesorería',
                    href: '/tesoreria',
                    icon: Wallet,
                    roles: ['ADMIN', 'CONTADOR', 'TESORERO'],
                },
                {
                    name: 'Cuentas por Cobrar',
                    href: '/cxc',
                    icon: CreditCard,
                    roles: ['ADMIN', 'CONTADOR'],
                },
                {
                    name: 'Facturación',
                    href: '/facturacion',
                    icon: FileText,
                    roles: ['ADMIN', 'CONTADOR', 'VENDEDOR'],
                },
            ],
        },
    ];

    // Configuración (siempre visible para ADMIN)
    const settingsItem = {
        name: 'Configuración',
        href: '/configuracion',
        icon: Settings,
        roles: ['ADMIN'],
    };

    const toggleGroup = (groupName) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    const isActive = (href) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    // Filtrar items por rol
    const filterItemsByRole = (items) => {
        return items.filter((item) => item.roles.includes(userRole));
    };

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
            >
                {/* Header del Sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">ERP</span>
                        </div>
                        <span className="font-bold text-gray-900">Sistema ERP</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {menuItems.map((group) => {
                        const filteredItems = filterItemsByRole(group.items);

                        // No mostrar el grupo si no hay items visibles
                        if (filteredItems.length === 0) return null;

                        const GroupIcon = group.icon;
                        const isExpanded = expandedGroups[group.group];

                        return (
                            <div key={group.group}>
                                {/* Header del Grupo */}
                                <button
                                    onClick={() => toggleGroup(group.group)}
                                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <GroupIcon className="w-4 h-4" />
                                        <span>{group.groupName}</span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Items del Grupo */}
                                {isExpanded && (
                                    <div className="mt-2 space-y-1">
                                        {filteredItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg
                            transition-all duration-200
                            ${active
                                                            ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                        }
                          `}
                                                >
                                                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                                                    <span className="text-sm">{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Configuración (separada) */}
                    {settingsItem.roles.includes(userRole) && (
                        <div className="pt-4 border-t border-gray-200">
                            <Link
                                href={settingsItem.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${isActive(settingsItem.href)
                                        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }
                `}
                            >
                                <Settings className={`w-5 h-5 ${isActive(settingsItem.href) ? 'text-blue-600' : 'text-gray-500'}`} />
                                <span className="text-sm">{settingsItem.name}</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Footer del Sidebar */}
                <div className="p-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Rol Actual</p>
                        <p className="text-sm font-bold text-blue-700">{userRole}</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
