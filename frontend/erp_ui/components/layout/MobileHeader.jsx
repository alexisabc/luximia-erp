// components/layout/MobileHeader.jsx
'use client';

import { APP_NAME, getMonogram } from '@/lib/branding';
import { useSidebar } from '@/context/SidebarContext';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export default function MobileHeader() {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-20 shadow-sm transition-colors duration-300">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors duration-200"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            <Link href="/" className="flex items-center justify-center flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 mr-2">
                    {getMonogram()}
                </div>
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    {APP_NAME}
                </span>
            </Link>

            {/* Espaciador para centrar el logo si hay botón a la izquierda */}
            <div className="w-10" />
        </header>
    );
}
