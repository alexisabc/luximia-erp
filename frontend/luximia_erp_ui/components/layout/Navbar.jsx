// components/layout/Navbar.jsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import { CircleUser, LogOut } from 'lucide-react';

export default function Navbar() {
    const { isOpen } = useSidebar();
    const { user, logoutUser } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav
            className={`fixed top-0 left-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full ${isOpen ? 'lg:left-64 lg:w-[calc(100%-16rem)]' : 'lg:left-20 lg:w-[calc(100%-5rem)]'}`}
        >
            <div className="px-3 py-3 lg:px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/" className="flex">
                            <img src="/logo-luximia.png" className="h-8 me-3" alt="Luximia" />
                        </Link>
                    </div>
                    <div className="flex items-center relative">
                        {user && (
                            <span className="hidden sm:block mr-2 text-sm text-gray-700 dark:text-gray-300">Bienvenido, {user.username}</span>
                        )}
                        <button onClick={() => setOpen(!open)} type="button" className="flex text-sm rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" aria-expanded="false">
                            <span className="sr-only">Open user menu</span>
                            <CircleUser className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div className={`${open ? '' : 'hidden'} absolute right-0 top-12 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-sm shadow-sm dark:bg-gray-700 dark:divide-gray-600`}>
                            <div className="px-4 py-3">
                                {user && (
                                    <p className="text-sm text-gray-900 dark:text-white">{user.username}</p>
                                )}
                            </div>
                            <ul className="py-1">
                                <li>
                                    <Link href="/ajustes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white">Ajustes</Link>
                                </li>
                                <li>
                                    <ThemeSwitcher />
                                </li>
                                <li>
                                    <button onClick={logoutUser} className="hidden lg:flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600">
                                        <LogOut className="h-5 w-5" />
                                        <span className="sr-only">Cerrar sesión</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
