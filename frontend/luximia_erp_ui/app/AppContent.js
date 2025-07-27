// app/AppContent.js
'use client';

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bars3Icon, ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function AppContent({ children }) {
    const { authTokens } = useAuth();
    const { isOpen, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!authTokens && pathname !== '/login') {
            router.push('/login');
        }
    }, [authTokens, pathname, router]);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authTokens) {
        return <div className="text-center p-8">Cargando...</div>;
    }

    return (
        <div className="min-h-screen">
            <Sidebar />
            {/* ### Los estilos de fondo AHORA se aplican aquí ### */}
            <main className={`transition-all duration-300 ease-in-out bg-gray-100 dark:bg-gray-900 ${isOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>

                {/* Botón para pantallas grandes (flecha) */}
                <div className="hidden lg:block">
                    <button
                        onClick={toggleSidebar}
                        className="fixed top-5 left-0 z-50 p-1.5 bg-gray-700 text-white rounded-r-lg shadow-md transition-all duration-300 ease-in-out hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ transform: isOpen ? 'translateX(16rem)' : 'translateX(0)' }}
                        aria-label="Ocultar menú"
                    >
                        <div className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}>
                            <ArrowLeftIcon className="h-6 w-6" />
                        </div>
                    </button>
                </div>

                {/* Encabezado para pantallas pequeñas (hamburguesa) */}
                <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-md p-4 lg:hidden">
                    <button onClick={toggleSidebar} className="text-gray-800 dark:text-gray-200">
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </header>

                <div>
                    {children}
                </div>
            </main>
        </div>
    );
}