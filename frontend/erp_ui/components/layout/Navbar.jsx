'use client';

import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { Menu, Search, Bell, Settings, LogOut, ChevronRight, User as UserIcon } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationsBell from './NotificationsBell';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { toggleSidebar } = useSidebar();
    const { user, logoutUser } = useAuth();
    const pathname = usePathname();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate Breadcrumbs from Pathname
    const getBreadcrumbs = () => {
        if (pathname === '/') return [{ label: 'Inicio', path: '/' }];

        const parts = pathname.split('/').filter(Boolean);
        return parts.map((part, index) => {
            const path = `/${parts.slice(0, index + 1).join('/')}`;
            // Simple capitalization
            const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
            return { label, path };
        });
    };

    const breadcrumbs = getBreadcrumbs();
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuario';

    return (
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-gray-200/50 bg-white/80 px-4 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/80 transition-all duration-300">
            {/* Left: Sidebar Toggle & Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden transition-colors"
                    aria-label="Menu"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Breadcrumbs - Hidden on small mobile, visible on larger */}
                <div className="hidden items-center gap-2 text-sm text-gray-500 dark:text-gray-400 sm:flex">
                    <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Inicio
                    </Link>
                    {breadcrumbs.length > 0 && breadcrumbs[0].path !== '/' && (
                        <>
                            {breadcrumbs.map((crumb, idx) => (
                                <div key={crumb.path} className="flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4" />
                                    <Link
                                        href={crumb.path}
                                        className={`capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${idx === breadcrumbs.length - 1 ? 'font-semibold text-gray-800 dark:text-gray-100' : ''}`}
                                    >
                                        {crumb.label}
                                    </Link>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Logo (Center) */}
            <div className="flex lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                        {(process.env.NEXT_PUBLIC_APP_NAME || 'ERP')[0]}
                    </div>
                </Link>
            </div>

            {/* Middle: Search (Optional - visual placeholder) */}
            <div className="hidden md:flex max-w-md w-full px-4">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar en el sistema..."
                        className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:bg-gray-900/50 dark:focus:bg-gray-900"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
                <ThemeSwitcher showLabel={false} className="h-10 w-10 rounded-xl hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800 dark:text-gray-400 justify-center" />

                <NotificationsBell />

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 rounded-xl border border-transparent p-1 pl-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                        <div className="hidden text-right text-xs sm:block">
                            <p className="font-semibold text-gray-700 dark:text-gray-200">{fullName}</p>
                            <p className="text-gray-500 dark:text-gray-400">Admin</p>
                        </div>
                        <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-800">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                                    {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 z-50">
                            <div className="px-2 py-1.5 sm:hidden">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fullName}</p>
                                <p className="text-xs text-gray-500">Conectado</p>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 sm:hidden"></div>

                            <Link
                                href="/perfil"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Settings className="h-4 w-4" />
                                Mi Perfil
                            </Link>
                            <button
                                onClick={logoutUser}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
