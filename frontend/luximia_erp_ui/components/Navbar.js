'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/solid';

export default function Navbar() {
    const { isOpen, toggleSidebar } = useSidebar();
    const { user, logoutUser } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav className={`fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${isOpen ? 'lg:pl-64' : 'lg:pl-20'}` }>
            <div className="px-3 py-3 lg:px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <Bars3Icon className="w-6 h-6" />
                            <span className="sr-only">Toggle sidebar</span>
                        </button>
                        <Link href="/" className="flex ms-2">
                            <img src="/logo-luximia.png" className="h-8 me-3" alt="Luximia" />
                        </Link>
                    </div>
                    <div className="flex items-center relative">
                        {user && (
                            <span className="hidden sm:block mr-2 text-sm text-gray-700 dark:text-gray-300">Bienvenido, {user.username}</span>
                        )}
                        <button onClick={() => setOpen(!open)} type="button" className="flex text-sm rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" aria-expanded="false">
                            <span className="sr-only">Open user menu</span>
                            <UserCircleIcon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div className={`${open ? '' : 'hidden'} absolute right-0 top-12 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-sm shadow-sm dark:bg-gray-700 dark:divide-gray-600`}> 
                            <div className="px-4 py-3">
                                {user && (
                                    <p className="text-sm text-gray-900 dark:text-white">{user.username}</p>
                                )}
                            </div>
                            <ul className="py-1">
                                <li>
                                    <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white">Ajustes</Link>
                                </li>
                                <li className="px-4 py-2">
                                    <ThemeSwitcher />
                                </li>
                                <li>
                                    <button onClick={logoutUser} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600">Cerrar Sesión</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
