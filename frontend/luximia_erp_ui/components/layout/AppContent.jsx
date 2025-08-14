//components/AppContent.jsx
'use client';

import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import ChatInteligente from "@/components/features/ChatInteligente";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Overlay from '@/components/loaders/Overlay';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

export default function AppContent({ children }) {
    // 1. Obtén 'loading' desde el contexto
    const { authTokens, hasPermission, loading, logoutUser } = useAuth();
    const { isOpen } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    // Lógica para detectar la inactividad del usuario
    const handleInactivity = () => {
        if (authTokens) {
            logoutUser();
        }
    };
    useInactivityTimer(handleInactivity, 5 * 60 * 1000); // 5 minutos

    useEffect(() => {
        // 2. No hagas nada si el contexto aún está cargando la información inicial
        if (loading) return; // <-- nunca retornes "null" desde useEffect

        const publicPaths = ['/login'];
        if (!authTokens && !publicPaths.includes(pathname) && !pathname.startsWith('/enroll')) {
            router.replace('/login'); // replace evita que el usuario "vuelva" a la privada con back
        }
        // 3. Añade 'loading' a las dependencias del useEffect
    }, [authTokens, pathname, router, loading]);

    // 4. Muestra un loader principal si el contexto está en su fase de carga inicial
    if (loading) {
        return <Overlay className="min-h-screen" />;
    }

    // 5. Si ya no está cargando, decide qué mostrar
    const isPublicPage = pathname === '/login' || pathname.startsWith('/enroll');
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Si no es una página pública y no hay tokens, el useEffect ya lo está redirigiendo,
    // pero podemos mostrar un loader como fallback.
    if (!authTokens) {
        return <Overlay className="min-h-screen" />;
    }

    // Si todo está bien, muestra la aplicación principal
    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className={`transition-all duration-300 ease-in-out bg-gray-100 dark:bg-gray-900 ${isOpen ? 'lg:ml-64' : 'lg:ml-20'} p-4`}>
                <div>
                    {children}
                </div>
                {hasPermission('cxc.can_use_ai') && <ChatInteligente />}
            </main>
        </div>
    );
}